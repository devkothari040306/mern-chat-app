import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");
const maxFileSize = 10 * 1024 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const safeBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 60);
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${Date.now()}-${safeBaseName || "attachment"}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
});

export default upload;
