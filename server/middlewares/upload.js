const multer = require("multer");
const fs = require("fs");

// Tự động tạo thư mục uploads/avatar nếu chưa có
const dir = "./uploads/avatar";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Thêm thời gian vào tên file để không bị trùng lặp
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, ""));
  },
});

module.exports = multer({ storage });