const express = require("express");
const router = express.Router();
const {authInternal} = require("../middlewares/auth");
const {
    createItem, 
    updateItem, 
    getAllItems,
    getItemsPaginatedAndSearch,
    getItemById,
    deleteItem,
    generateItemQRCode,
    importBatch
} = require("../controllers/itemController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         name:
 *           type: string
 *           description: Item name
 *           example: "iPhone 13 Screen"
 *         serialCode:
 *           type: string
 *           description: Unique serial code for the item
 *           example: "SCR-010426-1234-001"
 *         item_type:
 *           type: object
 *           description: Item type information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Screen"
 *             code:
 *               type: string
 *               example: "SCR"
 *         status:
 *           type: string
 *           description: Current status of the item
 *           example: "in_stock"
 *         origin:
 *           type: string
 *           enum: [new, disassembled]
 *           description: Origin of the item
 *           example: "new"
 *         sourceDevice:
 *           type: string
 *           description: Source device if disassembled
 *           example: "iPhone 12"
 *         quality:
 *           type: string
 *           description: Quality grade
 *           example: "A+"
 *         baseCost:
 *           type: number
 *           description: Base cost of the item
 *           example: 100.00
 *         price:
 *           type: number
 *           description: Selling price
 *           example: 150.00
 *         repairOrderId:
 *           type: string
 *           description: Associated repair order ID
 *         storeId:
 *           type: object
 *           description: Store information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Main Store"
 *             location:
 *               type: string
 *               example: "Ho Chi Minh City"
 *         warrantyPeriod:
 *           type: integer
 *           description: Warranty period in months
 *           example: 12
 *         ram:
 *           type: string
 *           description: RAM specification
 *           example: "8GB"
 *         capacity:
 *           type: string
 *           description: Storage capacity
 *           example: "256GB"
 *         color:
 *           type: string
 *           description: Color
 *           example: "Black"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Item creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateItem:
 *       type: object
 *       required:
 *         - name
 *         - serialCode
 *         - item_type
 *       properties:
 *         name:
 *           type: string
 *           description: Item name
 *           example: "iPhone 13 Screen"
 *         serialCode:
 *           type: string
 *           description: Unique serial code
 *           example: "SCR-010426-1234-001"
 *         status:
 *           type: string
 *           description: Current status
 *           example: "in_stock"
 *         item_type:
 *           type: string
 *           description: Item type ID
 *           example: "507f1f77bcf86cd799439011"
 *         storeId:
 *           type: string
 *           description: Store ID
 *           example: "507f1f77bcf86cd799439012"
 *         origin:
 *           type: string
 *           enum: [new, disassembled]
 *           description: Origin of the item
 *           example: "new"
 *         sourceDevice:
 *           type: string
 *           description: Source device if disassembled
 *           example: "iPhone 12"
 *         quality:
 *           type: string
 *           description: Quality grade
 *           example: "A+"
 *         baseCost:
 *           type: number
 *           description: Base cost
 *           example: 100.00
 *         price:
 *           type: number
 *           description: Selling price
 *           example: 150.00
 *         warrantyPeriod:
 *           type: integer
 *           description: Warranty period in months
 *           example: 12
 *         ram:
 *           type: string
 *           description: RAM specification
 *           example: "8GB"
 *         capacity:
 *           type: string
 *           description: Storage capacity
 *           example: "256GB"
 *         color:
 *           type: string
 *           description: Color
 *           example: "Black"
 *     UpdateItem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Item name
 *           example: "iPhone 13 Screen"
 *         serialCode:
 *           type: string
 *           description: Unique serial code
 *           example: "SCR-010426-1234-001"
 *         status:
 *           type: string
 *           description: Current status
 *           example: "in_stock"
 *         item_type:
 *           type: string
 *           description: Item type ID
 *           example: "507f1f77bcf86cd799439011"
 *         storeId:
 *           type: string
 *           description: Store ID
 *           example: "507f1f77bcf86cd799439012"
 *         origin:
 *           type: string
 *           enum: [new, disassembled]
 *           description: Origin of the item
 *           example: "new"
 *         sourceDevice:
 *           type: string
 *           description: Source device if disassembled
 *           example: "iPhone 12"
 *         quality:
 *           type: string
 *           description: Quality grade
 *           example: "A+"
 *         baseCost:
 *           type: number
 *           description: Base cost
 *           example: 100.00
 *         price:
 *           type: number
 *           description: Selling price
 *           example: 150.00
 *         warrantyPeriod:
 *           type: integer
 *           description: Warranty period in months
 *           example: 12
 *         ram:
 *           type: string
 *           description: RAM specification
 *           example: "8GB"
 *         capacity:
 *           type: string
 *           description: Storage capacity
 *           example: "256GB"
 *         color:
 *           type: string
 *           description: Color
 *           example: "Black"
 *     ImportBatch:
 *       type: object
 *       required:
 *         - batches
 *       properties:
 *         batches:
 *           type: array
 *           description: Array of item batches to import
 *           items:
 *             type: object
 *             required:
 *               - item_type
 *               - quantity
 *             properties:
 *               item_type:
 *                 type: string
 *                 description: Item type ID
 *                 example: "507f1f77bcf86cd799439011"
 *               quantity:
 *                 type: integer
 *                 description: Number of items to import
 *                 example: 10
 *               origin:
 *                 type: string
 *                 description: Origin of items
 *                 example: "new"
 *               baseCost:
 *                 type: number
 *                 description: Base cost per item
 *                 example: 100.00
 *               price:
 *                 type: number
 *                 description: Selling price per item
 *                 example: 150.00
 *               warrantyPeriod:
 *                 type: integer
 *                 description: Warranty period in months
 *                 example: 12
 *               storeId:
 *                 type: string
 *                 description: Store ID
 *                 example: "507f1f77bcf86cd799439012"
 *               color:
 *                 type: string
 *                 description: Color
 *                 example: "Black"
 *               capacity:
 *                 type: string
 *                 description: Storage capacity
 *                 example: "256GB"
 *               ram:
 *                 type: string
 *                 description: RAM specification
 *                 example: "8GB"
 *               quality:
 *                 type: string
 *                 description: Quality grade
 *                 example: "A+"
 *               sourceDevice:
 *                 type: string
 *                 description: Source device if disassembled
 *                 example: "iPhone 12"
 *               batchSuffix:
 *                 type: string
 *                 description: Custom batch suffix for serial codes
 *                 example: "BATCH001"
 *         isFirst:
 *           type: boolean
 *           description: Whether this is the first batch in a multi-batch import
 *           example: true
 *         totalCombinedItems:
 *           type: integer
 *           description: Total number of items across all batches
 *           example: 50
 *         transactionId:
 *           type: string
 *           description: Existing transaction ID for multi-batch imports
 *           example: "507f1f77bcf86cd799439013"
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get items with pagination and search
 *     description: Retrieve items with pagination, search by name or serial code, and filtering (internal staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or serial code (case-insensitive)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: item_type
 *         schema:
 *           type: string
 *         description: Filter by item type ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID
 *     responses:
 *       200:
 *         description: Items retrieved successfully
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
 *                     $ref: '#/components/schemas/Item'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/", authInternal, getItemsPaginatedAndSearch);

/**
 * @swagger
 * /api/items/all:
 *   get:
 *     summary: Get all items
 *     description: Retrieve all items without pagination (public endpoint)
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Items retrieved successfully
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
 *                     $ref: '#/components/schemas/Item'
 *       500:
 *         description: Internal server error
 */
router.get("/all",  getAllItems);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve a specific item by its ID (internal staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Item not found
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
 *                   example: "Item not found"
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authInternal, getItemById);

/**
 * @swagger
 * /api/items/create:
 *   post:
 *     summary: Create a new item
 *     description: Create a new item (internal staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItem'
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request - validation errors or duplicate serial code
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
router.post("/create", authInternal, createItem);

/**
 * @swagger
 * /api/items/update/{id}:
 *   put:
 *     summary: Update item
 *     description: Update an existing item (internal staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateItem'
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thành công"
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request - duplicate serial code
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
 *                   example: "Mã Serial Code đã tồn tại"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, updateItem);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete item
 *     description: Delete an item (internal staff only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Item deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Item'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authInternal, deleteItem);

/**
 * @swagger
 * /api/items/{id}/qr:
 *   get:
 *     summary: Generate item QR code
 *     description: Generate QR code for an item based on serial code
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: QR code image generated successfully
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Item not found
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
 *                   example: "Item not found"
 *       500:
 *         description: Internal server error
 */
router.get("/:id/qr", generateItemQRCode);

/**
 * @swagger
 * /api/items/import-batch:
 *   post:
 *     summary: Import batch items
 *     description: Import multiple items at once with automatic serial code generation and inventory transaction logging
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImportBatch'
 *     responses:
 *       201:
 *         description: Batch import successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã nhập thành công 50 linh kiện."
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 *                 transactionId:
 *                   type: string
 *                   description: Inventory transaction ID
 *                   example: "507f1f77bcf86cd799439013"
 *       400:
 *         description: Bad request - validation errors or duplicate serial codes
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
 *                   example: "Danh sách nhập kho trống!"
 *       500:
 *         description: Internal server error
 */
router.post('/import-batch', importBatch);

module.exports = router;
