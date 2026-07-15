import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getCorrespondenceUploadDir(subdir) {
  return path.join(__dirname, '..', 'uploads', 'correspondence', subdir);
}

export function saveCorrespondencePdf(subdir, id, buffer) {
  const uploadDir = getCorrespondenceUploadDir(subdir);
  fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, `${id}.pdf`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function deleteCorrespondencePdf(pdfPath) {
  if (pdfPath && fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
  }
}
