const express = require("express");
const router = express.Router();
const { authInternal, authTechnician } = require("../middlewares/auth");
const uploadCloud = require("../config/cloudinary");

const {
    getPhonesPaginatedAndSearch,
    getAllPhones,
    createPhone,
    updatePhone,
    deletePhone,
    createAssembledPhone,
    getPhonesGroupedByBrand,
    handleTechDecision,
    generatePhoneQRCode,
    importBatchPhone
} = require("../controllers/phoneController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Phone:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         serialCode:
 *           type: string
 *           description: Unique serial code for the phone
 *           example: "SN-123456789"
 *         phoneModelId:
 *           type: object
 *           description: Phone model information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "iPhone 13"
 *             brand:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Apple"
 *         colorName:
 *           type: string
 *           description: Color name
 *           example: "Midnight Black"
 *         capacity:
 *           type: string
 *           description: Storage capacity
 *           example: "128GB"
 *         grade:
 *           type: string
 *           enum: [Mới, Đã kích hoạt, Cũ Đẹp, Trầy Xước, Xước Cấn]
 *           description: Phone condition grade
 *           example: "Cũ Đẹp"
 *         storeId:
 *           type: object
 *           description: Store information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Main Store"
 *             address:
 *               type: string
 *               example: "123 Main St"
 *         status:
 *           type: string
 *           enum: [in_stock, sold, repairing, defective, waiting_for_tech_decision]
 *           description: Current status of the phone
 *           example: "in_stock"
 *         importPrice:
 *           type: number
 *           description: Import price
 *           example: 800.00
 *         sellingPrice:
 *           type: number
 *           description: Selling price
 *           example: 1200.00
 *         warrantyPeriod:
 *           type: integer
 *           description: Warranty period in months
 *           example: 12
 *         source:
 *           type: string
 *           enum: [supplier, customer_trade_in, assembled]
 *           description: Source of the phone
 *           example: "supplier"
 *         notes:
 *           type: string
 *           description: Additional notes
 *           example: "Minor scratches on back"
 *         specificImages:
 *           type: array
 *           description: Array of image URLs
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Phone creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreatePhone:
 *       type: object
 *       required:
 *         - serialCode
 *         - phoneModelId
 *         - colorName
 *         - capacity
 *         - storeId
 *         - importPrice
 *         - sellingPrice
 *       properties:
 *         serialCode:
 *           type: string
 *           description: Unique serial code
 *           example: "SN-123456789"
 *         phoneModelId:
 *           type: string
 *           description: Phone model ID
 *           example: "507f1f77bcf86cd799439011"
 *         colorName:
 *           type: string
 *           description: Color name
 *           example: "Midnight Black"
 *         capacity:
 *           type: string
 *           description: Storage capacity
 *           example: "128GB"
 *         storeId:
 *           type: string
 *           description: Store ID
 *           example: "507f1f77bcf86cd799439012"
 *         importPrice:
 *           type: number
 *           description: Import price
 *           example: 800.00
 *         sellingPrice:
 *           type: number
 *           description: Selling price
 *           example: 1200.00
 *         warrantyPeriod:
 *           type: integer
 *           description: Warranty period in months
 *           example: 12
 *         source:
 *           type: string
 *           enum: [supplier, customer_trade_in, assembled]
 *           description: Source of the phone
 *           example: "supplier"
 *         notes:
 *           type: string
 *           description: Additional notes
 *           example: "Minor scratches on back"
 *         images:
 *           type: array
 *           description: Phone images (multipart/form-data)
 *           items:
 *             type: string
 *             format: binary
 *     UpdatePhone:
 *       type: object
 *       properties:
 *         serialCode:
 *           type: string
 *           description: Unique serial code
 *           example: "SN-123456789"
 *         phoneModelId:
 *           type: string
 *           description: Phone model ID
 *           example: "507f1f77bcf86cd799439011"
 *         colorName:
 *           type: string
 *           description: Color name
 *           example: "Midnight Black"
 *         capacity:
 *           type: string
 *           description: Storage capacity
 *           example: "128GB"
 *         grade:
 *           type: string
 *           enum: [Mới, Đã kích hoạt, Cũ Đẹp, Trầy Xước, Xước Cấn]
 *           description: Phone condition grade
 *           example: "Cũ Đẹp"
 *         storeId:
 *           type: string
 *           description: Store ID
 *           example: "507f1f77bcf86cd799439012"
 *         status:
 *           type: string
 *           enum: [in_stock, sold, repairing, defective, waiting_for_tech_decision]
 *           description: Current status of the phone
 *           example: "in_stock"
 *         importPrice:
 *           type: number
 *           description: Import price
 *           example: 800.00
 *         sellingPrice:
 *           type: number
 *           description: Selling price
 *           example: 1200.00
 *         warrantyPeriod:
 *           type: integer
 *           description: Warranty period in months
 *           example: 12
 *         source:
 *           type: string
 *           enum: [supplier, customer_trade_in, assembled]
 *           description: Source of the phone
 *           example: "supplier"
 *         notes:
 *           type: string
 *           description: Additional notes
 *           example: "Minor scratches on back"
 *         images:
 *           type: array
 *           description: Phone images (multipart/form-data)
 *           items:
 *             type: string
 *             format: binary
 */

/**
 * @swagger
 * /api/phones/all:
 *   get:
 *     summary: Get all phones
 *     description: Retrieve all phones without pagination (public endpoint)
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: Phones retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Phone'
 *       500:
 *         description: Internal server error
 */
router.get("/all", getAllPhones);

/**
 * @swagger
 * /api/phones/{id}/tech-decision:
 *   put:
 *     summary: Handle technician decision
 *     description: Process technician decision for phone status
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: Technician decision processed successfully
 *       404:
 *         description: Phone not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/tech-decision", handleTechDecision);

/**
 * @swagger
 * /api/phones:
 *   get:
 *     summary: Get phones with pagination and search
 *     description: Retrieve phones with pagination, search by serial code, and filtering (internal staff only)
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by serial code (case-insensitive)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_stock, sold, repairing, defective, waiting_for_tech_decision]
 *         description: Filter by status
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID
 *     responses:
 *       200:
 *         description: Phones retrieved successfully
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
 *                     $ref: '#/components/schemas/Phone'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/", authInternal, getPhonesPaginatedAndSearch);

/**
 * @swagger
 * /api/phones/grouped-by-brand:
 *   get:
 *     summary: Get phones grouped by brand
 *     description: Retrieve phones grouped by phone brand
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: Phones grouped by brand retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/grouped-by-brand', getPhonesGroupedByBrand);

/**
 * @swagger
 * /api/phones/create:
 *   post:
 *     summary: Create a new phone
 *     description: Create a new phone with image upload (internal staff only)
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreatePhone'
 *     responses:
 *       201:
 *         description: Phone created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Phone'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/create", authInternal, uploadCloud.array("images", 5), createPhone);

/**
 * @swagger
 * /api/phones/update/{id}:
 *   put:
 *     summary: Update phone
 *     description: Update an existing phone with image upload (internal staff only)
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePhone'
 *     responses:
 *       200:
 *         description: Phone updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Phone'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Phone not found
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, uploadCloud.array("images", 5), updatePhone);

/**
 * @swagger
 * /api/phones/{id}:
 *   delete:
 *     summary: Delete phone
 *     description: Delete a phone (internal staff only)
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: Phone deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Phone not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authInternal, deletePhone);

/**
 * @swagger
 * /api/phones/assemble:
 *   post:
 *     summary: Create assembled phone
 *     description: Create a new assembled phone from components (technician only)
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneModelId:
 *                 type: string
 *                 description: Phone model ID
 *               storeId:
 *                 type: string
 *                 description: Store ID
 *               capacity:
 *                 type: string
 *                 description: Storage capacity
 *               colorName:
 *                 type: string
 *                 description: Color name
 *               importPrice:
 *                 type: number
 *                 description: Import price
 *               sellingPrice:
 *                 type: number
 *                 description: Selling price
 *               notes:
 *                 type: string
 *                 description: Assembly notes
 *     responses:
 *       201:
 *         description: Assembled phone created successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/assemble', authTechnician, createAssembledPhone);

/**
 * @swagger
 * /api/phones/qrcode/{id}:
 *   get:
 *     summary: Generate phone QR code
 *     description: Generate QR code for a phone based on serial code
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: QR code image generated successfully
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Phone not found
 *       500:
 *         description: Internal server error
 */
router.get('/qrcode/:id', generatePhoneQRCode);

/**
 * @swagger
 * /api/phones/import-batch:
 *   post:
 *     summary: Import batch phones
 *     description: Import multiple phones at once with image upload
 *     tags: [Phones]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               phones:
 *                 type: string
 *                 description: JSON array of phone data
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Batch import successful
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Internal server error
 */
router.post('/import-batch', uploadCloud.array('images', 5), importBatchPhone);

module.exports = router;
