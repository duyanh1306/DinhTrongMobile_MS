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
 * tags:
 *   name: Items
 *   description: Item management endpoints
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get items with pagination and search (authenticated)
 *     tags: [Items]
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
 *         description: Paginated list of items
 *       401:
 *         description: Unauthorized
 */
router.get("/", authInternal, getItemsPaginatedAndSearch);

/**
 * @swagger
 * /api/items/all:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: List of all items
 */
router.get("/all",  getAllItems);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID (authenticated)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.get("/:id", authInternal, getItemById);

/**
 * @swagger
 * /api/items/create:
 *   post:
 *     summary: Create a new item (authenticated)
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Item created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, createItem);

/**
 * @swagger
 * /api/items/update/{id}:
 *   put:
 *     summary: Update an item (authenticated)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, updateItem);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item (authenticated)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authInternal, deleteItem);

/**
 * @swagger
 * /api/items/{id}/qr:
 *   get:
 *     summary: Generate QR code for an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code generated
 *       404:
 *         description: Item not found
 */
router.get("/:id/qr", generateItemQRCode);

/**
 * @swagger
 * /api/items/import-batch:
 *   post:
 *     summary: Import batch of items
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Batch imported successfully
 */
router.post('/import-batch', importBatch);

module.exports = router;
