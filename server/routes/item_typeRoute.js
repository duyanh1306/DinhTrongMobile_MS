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

/**
 * @swagger
 * tags:
 *   name: Item Types
 *   description: Item type management endpoints
 */

// PUBLIC ROUTES
/**
 * @swagger
 * /api/item_types/all:
 *   get:
 *     summary: Get all item types
 *     tags: [Item Types]
 *     responses:
 *       200:
 *         description: List of all item types
 */
router.get("/all", getAllItemTypes);

// PRIVATE ROUTES
/**
 * @swagger
 * /api/item_types:
 *   get:
 *     summary: Get item types with pagination and search (authenticated)
 *     tags: [Item Types]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of item types
 *       401:
 *         description: Unauthorized
 */
router.get("/", authInternal, getItemTypePaginatedAndSearch);

// Dùng upload.single('image') để nhận file
/**
 * @swagger
 * /api/item_types/create:
 *   post:
 *     summary: Create a new item type (authenticated)
 *     tags: [Item Types]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               itemData:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item type created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, upload.single('image'), createItemType);

/**
 * @swagger
 * /api/item_types/update/{id}:
 *   put:
 *     summary: Update item type (authenticated)
 *     tags: [Item Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               itemData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item type updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, upload.single('image'), updateItemType);

module.exports = router;