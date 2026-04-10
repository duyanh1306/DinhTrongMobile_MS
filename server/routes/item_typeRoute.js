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

/**
 * @swagger
 * components:
 *   schemas:
 *     ItemType:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         name:
 *           type: string
 *           description: Item type name
 *           example: "Screen"
 *         code:
 *           type: string
 *           description: Unique item type code
 *           example: "SCR"
 *         image:
 *           type: string
 *           description: Item type image URL
 *           example: "https://example.com/screen.jpg"
 *         stockCount:
 *           type: integer
 *           description: Number of items in stock for this type
 *           example: 25
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Item type creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateItemType:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           description: Item type name
 *           example: "Screen"
 *         code:
 *           type: string
 *           description: Unique item type code
 *           example: "SCR"
 *         image:
 *           type: string
 *           format: binary
 *           description: Item type image file (multipart/form-data)
 *         linkedRecipes:
 *           type: string
 *           description: JSON string of linked recipes
 *           example: '[{"recipeId": "507f1f77bcf86cd799439011", "partName": "Screen Assembly"}]'
 *     UpdateItemType:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Item type name
 *           example: "Screen"
 *         code:
 *           type: string
 *           description: Unique item type code
 *           example: "SCR"
 *         image:
 *           type: string
 *           format: binary
 *           description: Item type image file (multipart/form-data)
 *         linkedRecipes:
 *           type: string
 *           description: JSON string of linked recipes
 *           example: '[{"recipeId": "507f1f77bcf86cd799439011", "partName": "Screen Assembly"}]'
 */

/**
 * @swagger
 * /api/item_types/all:
 *   get:
 *     summary: Get all item types
 *     description: Retrieve all item types with stock counts (public endpoint)
 *     tags: [Item Types]
 *     responses:
 *       200:
 *         description: Item types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ItemType'
 *       500:
 *         description: Internal server error
 */
router.get("/all", getAllItemTypes);

/**
 * @swagger
 * /api/item_types:
 *   get:
 *     summary: Get item types with pagination and search
 *     description: Retrieve item types with pagination, search, sorting, and stock counts (internal staff only)
 *     tags: [Item Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (100+ returns all results)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or code (case-insensitive)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: name
 *         description: Sort field (name, code, createdAt, etc.)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Item types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ItemType'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalCount:
 *                       type: integer
 *                       example: 50
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/", authInternal, getItemTypePaginatedAndSearch);

/**
 * @swagger
 * /api/item_types/create:
 *   post:
 *     summary: Create a new item type
 *     description: Create a new item type with image upload and recipe linking (internal staff only)
 *     tags: [Item Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemType'
 *     responses:
 *       201:
 *         description: Item type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ItemType'
 *       400:
 *         description: Bad request - validation errors or duplicate code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Thiếu các trường bắt buộc"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/create", authInternal, upload.single('image'), createItemType);

/**
 * @swagger
 * /api/item_types/update/{id}:
 *   put:
 *     summary: Update item type
 *     description: Update an existing item type with image upload and recipe linking (internal staff only)
 *     tags: [Item Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item type ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateItemType'
 *     responses:
 *       200:
 *         description: Item type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ItemType'
 *       400:
 *         description: Bad request - duplicate code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Loại linh kiện hoặc Mã đã tồn tại"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Item type not found
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, upload.single('image'), updateItemType);

module.exports = router;
