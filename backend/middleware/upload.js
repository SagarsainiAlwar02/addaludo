import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsBase = path.resolve(__dirname, "..", "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(uploadsBase, subfolder);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WEBP) are allowed"), false);
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024,
};

export const uploadDeposit = multer({
  storage: storage("deposits"),
  fileFilter,
  limits,
}).single("screenshot");

export const uploadResult = multer({
  storage: storage("results"),
  fileFilter,
  limits,
}).single("screenshot");

export const uploadPayment = multer({
  storage: storage("payment"),
  fileFilter,
  limits,
}).single("file");

export const uploadKyc = multer({
  storage: storage("kyc"),
  fileFilter,
  limits,
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "backImage", maxCount: 1 },
  { name: "selfieImage", maxCount: 1 },
]);
