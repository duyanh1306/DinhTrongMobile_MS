const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { authInternal } = require("../middlewares/auth");
const {
    createItemType, 
    updateItemType, 
    getAllItemTypes,
    getItemTypePaginatedAndSearch
} = require("../controllers/item_typeController");

// Cấu hình Cloudinary (Bạn cần thêm các biến này vào file .env của backend)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình Multer Storage để đẩy file thẳng lên Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'DinhTrongMobile/item_types', // Tên thư mục sẽ tạo trên Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Các định dạng cho phép
    },
});

const upload = multer({ storage: storage });

// PUBLIC ROUTES
router.get("/all", getAllItemTypes);

// PRIVATE ROUTES
router.get("/", authInternal, getItemTypePaginatedAndSearch);
// Dùng upload.single('image') để nhận file
router.post("/create", authInternal, upload.single('image'), createItemType);
router.put("/update/:id", authInternal, upload.single('image'), updateItemType);

module.exports = router;