import express from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";

const router = express.Router();

// temp upload storage (disk)
const upload = multer({ dest: "uploads/" });

router.post("/", upload.array("pdfs"), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: "At least 2 PDF files required" });
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const bytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((p) => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();

    // clean temp files
    req.files.forEach((f) => fs.unlinkSync(f.path));

    // send PDF buffer as file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");

    res.send(Buffer.from(mergedBytes));
  } catch (err) {
    console.error("Merge error:", err);
    res.status(500).json({ error: "Failed to merge PDFs" });
  }
});

export default router;
