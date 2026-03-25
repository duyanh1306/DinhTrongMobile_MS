const multer = require("multer");
const fs = require("fs");

const dir = "./uploads/avatar";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-temp" + getFileExtension(file.originalname));
  },
});

function getFileExtension(originalName) {
  return originalName.substring(originalName.lastIndexOf("."));
}

module.exports = multer({ storage });