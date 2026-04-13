const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const uploadCloud = require("../config/cloudinary"); 

const {
    createPhoneModel,
    updatePhoneModel,
    getAllPhoneModels,
    getPhoneModelPaginatedAndSearch
} = require("../controllers/phone_modelController");

/**
 * @swagger
 * components:
 *   schemas:
 *     PhoneModel:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         name:
 *           type: string
 *           description: Phone model name (2-100 characters)
 *           example: "iPhone 13"
 *         brand:
 *           type: object
 *           description: Brand information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Apple"
 *         image:
 *           type: string
 *           description: Phone model image URL
 *           example: "https://example.com/iphone13.jpg"
 *         price:
 *           type: number
 *           description: Base price for the phone model
 *           example: 999.00
 *         tradeInPrice:
 *           type: number
 *           description: Trade-in price for the phone model
 *           example: 500.00
 *         specifications:
 *           type: object
 *           description: Phone specifications
 *           properties:
 *             screenSize:
 *               type: string
 *               example: "6.1 inches"
 *             screenTechnology:
 *               type: string
 *               example: "OLED"
 *             rearCamera:
 *               type: string
 *               example: "12MP + 12MP"
 *             frontCamera:
 *               type: string
 *               example: "12MP"
 *             chipset:
 *               type: string
 *               example: "A15 Bionic"
 *             nfc:
 *               type: string
 *               example: "Yes"
 *             internalStorage:
 *               type: string
 *               example: "128GB"
 *             sim:
 *               type: string
 *               example: "Nano-SIM"
 *             os:
 *               type: string
 *               example: "iOS 15"
 *             screenResolution:
 *               type: string
 *               example: "1170 x 2532"
 *             screenFeatures:
 *               type: string
 *               example: "HDR, True Tone"
 *             cpu:
 *               type: string
 *               example: "Hexa-core"
 *         compatibleItemTypes:
 *           type: array
 *           description: List of compatible item types for this model
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: "Screen"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Phone model creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreatePhoneModel:
 *       type: object
 *       required:
 *         - name
 *         - brand
 *       properties:
 *         name:
 *           type: string
 *           description: Phone model name (2-100 characters)
 *           example: "iPhone 13"
 *         brand:
 *           type: string
 *           description: Brand ID
 *           example: "507f1f77bcf86cd799439011"
 *         image:
 *           type: string
 *           format: binary
 *           description: Phone model image file (multipart/form-data)
 *         price:
 *           type: number
 *           description: Base price for the phone model
 *           example: 999.00
 *         tradeInPrice:
 *           type: number
 *           description: Trade-in price for the phone model
 *           example: 500.00
 *         specifications:
 *           type: object
 *           description: Phone specifications
 *           properties:
 *             screenSize:
 *               type: string
 *               example: "6.1 inches"
 *             screenTechnology:
 *               type: string
 *               example: "OLED"
 *             rearCamera:
 *               type: string
 *               example: "12MP + 12MP"
 *             frontCamera:
 *               type: string
 *               example: "12MP"
 *             chipset:
 *               type: string
 *               example: "A15 Bionic"
 *             nfc:
 *               type: string
 *               example: "Yes"
 *             internalStorage:
 *               type: string
 *               example: "128GB"
 *             sim:
 *               type: string
 *               example: "Nano-SIM"
 *             os:
 *               type: string
 *               example: "iOS 15"
 *             screenResolution:
 *               type: string
 *               example: "1170 x 2532"
 *             screenFeatures:
 *               type: string
 *               example: "HDR, True Tone"
 *             cpu:
 *               type: string
 *               example: "Hexa-core"
 *         compatibleItemTypes:
 *           type: array
 *           description: List of compatible item type IDs
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     UpdatePhoneModel:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Phone model name (2-100 characters)
 *           example: "iPhone 13"
 *         brand:
 *           type: string
 *           description: Brand ID
 *           example: "507f1f77bcf86cd799439011"
 *         image:
 *           type: string
 *           format: binary
 *           description: Phone model image file (multipart/form-data)
 *         price:
 *           type: number
 *           description: Base price for the phone model
 *           example: 999.00
 *         tradeInPrice:
 *           type: number
 *           description: Trade-in price for the phone model
 *           example: 500.00
 *         specifications:
 *           type: object
 *           description: Phone specifications
 *           properties:
 *             screenSize:
 *               type: string
 *               example: "6.1 inches"
 *             screenTechnology:
 *               type: string
 *               example: "OLED"
 *             rearCamera:
 *               type: string
 *               example: "12MP + 12MP"
 *             frontCamera:
 *               type: string
 *               example: "12MP"
 *             chipset:
 *               type: string
 *               example: "A15 Bionic"
 *             nfc:
 *               type: string
 *               example: "Yes"
 *             internalStorage:
 *               type: string
 *               example: "128GB"
 *             sim:
 *               type: string
 *               example: "Nano-SIM"
 *             os:
 *               type: string
 *               example: "iOS 15"
 *             screenResolution:
 *               type: string
 *               example: "1170 x 2532"
 *             screenFeatures:
 *               type: string
 *               example: "HDR, True Tone"
 *             cpu:
 *               type: string
 *               example: "Hexa-core"
 *         compatibleItemTypes:
 *           type: array
 *           description: List of compatible item type IDs
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 */

/**
 * @swagger
 * /api/phone_models/all:
 *   get:
 *     summary: Get all phone models
 *     description: Retrieve all phone models without pagination (public endpoint)
 *     tags: [Phone Models]
 *     responses:
 *       200:
 *         description: Phone models retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PhoneModel'
 *       500:
 *         description: Internal server error
 */
router.get("/all", getAllPhoneModels);

/**
 * @swagger
 * /api/phone_models:
 *   get:
 *     summary: Get phone models with pagination and search
 *     description: Retrieve phone models with pagination and search (internal staff only)
 *     tags: [Phone Models]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by model name (case-insensitive)
 *     responses:
 *       200:
 *         description: Phone models retrieved successfully
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
 *                     $ref: '#/components/schemas/PhoneModel'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/", authInternal, getPhoneModelPaginatedAndSearch);

/**
 * @swagger
 * /api/phone_models/create:
 *   post:
 *     summary: Create a new phone model
 *     description: Create a new phone model with image upload (internal staff only)
 *     tags: [Phone Models]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreatePhoneModel'
 *     responses:
 *       201:
 *         description: Phone model created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PhoneModel'
 *       400:
 *         description: Bad request - validation errors
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
 *                   example: "Phone model with this name already exists"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/create", authInternal, uploadCloud.single("image"), createPhoneModel);

/**
 * @swagger
 * /api/phone_models/update/{id}:
 *   put:
 *     summary: Update phone model
 *     description: Update an existing phone model with image upload (internal staff only)
 *     tags: [Phone Models]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone model ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePhoneModel'
 *     responses:
 *       200:
 *         description: Phone model updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PhoneModel'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Phone model not found
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, uploadCloud.single("image"), updatePhoneModel);

module.exports = router;
