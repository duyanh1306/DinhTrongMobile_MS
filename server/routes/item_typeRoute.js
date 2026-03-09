const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { authInternal } = require("../middlewares/auth");
const {
    createItemType, 
    updateItemType, 
    getAllItemTypes,
    getItemTypePaginatedAndSearch
} = require("../controllers/item_typeController");

// Cấu hình Multer để lưu ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads/item_types';
        // Nếu thư mục chưa có thì tự động tạo
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Đổi tên file để không bị trùng (Thêm timestamp)
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// PUBLIC ROUTES
router.get("/all", getAllItemTypes);

// PRIVATE ROUTES
router.get("/", authInternal, getItemTypePaginatedAndSearch);
// THÊM middleware upload.single('image') vào đây
router.post("/create", authInternal, upload.single('image'), createItemType);
router.put("/update/:id", authInternal, upload.single('image'), updateItemType);

module.exports = router;