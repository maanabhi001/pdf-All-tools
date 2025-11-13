import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const GS_PATH = `"C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe"`;

router.post("/", upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No PDF uploaded" });
    }

    const inputPath = path.resolve(req.file.path);
    const fileName = req.file.originalname.replace(/\.[^/.]+$/, "");
    const outputPath = path.resolve("uploads", `${fileName}-compressed.pdf`);
    const quality = req.body.quality || "ebook";

    // ✅ Optimized Ghostscript command for better compression
    const cmd = `${GS_PATH} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
-dPDFSETTINGS=/${quality} \
-dCompressFonts=true \
-dDownsampleColorImages=true \
-dDownsampleGrayImages=true \
-dDownsampleMonoImages=true \
-dColorImageResolution=120 \
-dGrayImageResolution=120 \
-dMonoImageResolution=120 \
-dNOPAUSE -dQUIET -dBATCH \
-sOutputFile="${outputPath}" "${inputPath}"`;

    console.log("------------------------------------------------");
    console.log(`🧩 Compressing "${req.file.originalname}" using quality: ${quality}`);
    console.log("Input:", inputPath);
    console.log("Output:", outputPath);
    console.log("Command:", cmd);


    exec(cmd, (error, stdout, stderr) => {
        console.log("---- EXEC CALLBACK ----");
        console.log("stdout:", stdout);
        console.log("stderr:", stderr);

        if (error) {
            console.error("❌ Ghostscript error:", error.message);
            return res.status(500).json({ error: "Compression failed" });
        }

        // Check file existence
        if (!fs.existsSync(outputPath)) {
            console.error("❌ Output file not found");
            return res.status(500).json({ error: "Output missing" });
        }

        const stats = fs.statSync(outputPath);
        console.log(`✅ Output file created (${(stats.size / 1024).toFixed(2)} KB)`);

        res.download(outputPath, `${fileName}-compressed.pdf`, (err) => {
            if (err) console.error("Download error:", err.message);
            try {
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            } catch (cleanupErr) {
                console.warn("⚠️ Cleanup warning:", cleanupErr.message);
            }
        });
    });
});

export default router;
