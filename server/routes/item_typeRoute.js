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


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'DinhTrongMobile/item_types', 
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], 
    },
});

const upload = multer({ storage: storage });

// PUBLIC ROUTES
router.get("/all", getAllItemTypes);

// PRIVATE ROUTES
router.get("/", authInternal, getItemTypePaginatedAndSearch);

router.post("/create", authInternal, upload.single('image'), createItemType);
router.put("/update/:id", authInternal, upload.single('image'), updateItemType);

module.exports = router;