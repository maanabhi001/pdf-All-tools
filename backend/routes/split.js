import express from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import archiver from "archiver";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = req.file.path;
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes);

    const totalPages = pdfDoc.getPageCount();
    const originalName = req.file.originalname.replace(/\.[^/.]+$/, "");

    // Response headers for streaming ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalName}-split.zip"`
    );

    // Create streaming ZIP
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    console.log(`📄 Total pages: ${totalPages}`);

    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();

      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);

      const pdfBytes = await newPdf.save();
      const fileName = `${originalName}-${i + 1}.pdf`;

      console.log(`Adding page ${i + 1}/${totalPages}: ${fileName}`);

      // Add to streaming ZIP
      archive.append(Buffer.from(pdfBytes), { name: fileName });

      // Let event loop breathe for huge PDFs
      if (i % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }

    // Finalize the ZIP stream
    archive.finalize();

    // Delete temp uploaded PDF
    fs.unlink(filePath, () => {});

  } catch (err) {
    console.error("❌ Split error:", err);
    res.status(500).json({ error: "Failed to split PDF" });
  }
});

export default router;
