import { Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Path to the APK file (project root / app-adda / AddaLudo-release.apk)
const APK_PATH = path.resolve(__dirname, "..", "..", "app-adda", "AddaLudo-release.apk");

// GET /api/app/download — serves the APK file for download
router.get("/download", (req, res) => {
  try {
    if (!fs.existsSync(APK_PATH)) {
      return res.status(404).json({
        success: false,
        error: "APK file not found",
        code: "APK_NOT_FOUND",
      });
    }

    const stat = fs.statSync(APK_PATH);

    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", 'attachment; filename="AddaLudo.apk"');

    const stream = fs.createReadStream(APK_PATH);
    stream.pipe(res);
  } catch (err) {
    console.error("APK download error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to download APK",
      code: "DOWNLOAD_ERROR",
    });
  }
});

// GET /api/app/info — returns APK metadata (size, version) for the frontend
router.get("/info", (req, res) => {
  try {
    if (!fs.existsSync(APK_PATH)) {
      return res.status(404).json({
        success: false,
        error: "APK not found",
      });
    }

    const stat = fs.statSync(APK_PATH);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);

    res.json({
      success: true,
      data: {
        available: true,
        version: "1.0",
        size: `${sizeMB} MB`,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to get app info",
    });
  }
});

export default router;
