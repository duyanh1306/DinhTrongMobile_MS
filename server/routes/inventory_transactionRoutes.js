const express = require("express");
const router = express.Router();

const { 
  getAllTransactions, 
  getTransactionDetails 
} = require("../controllers/inventory_transactionController"); 

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryTransaction:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         storeId:
 *           type: object
 *           description: Store information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Main Store"
 *             code:
 *               type: string
 *               example: "STORE001"
 *             address:
 *               type: string
 *               example: "123 Main St"
 *         transactionType:
 *           type: string
 *           enum: [INBOUND, OUTBOUND, REPAIR_CONSUMPTION]
 *           description: Type of inventory transaction
 *           example: "INBOUND"
 *         referenceType:
 *           type: string
 *           description: Type of reference (e.g., IMPORT_BATCH, ORDER_SALE, WEB_ORDER, SALE_ORDER, PURCHASE_ORDER)
 *           example: "IMPORT_BATCH"
 *         referenceId:
 *           type: string
 *           description: ID of the referenced document (order, batch, etc.)
 *           example: "507f1f77bcf86cd799439011"
 *         totalItems:
 *           type: integer
 *           description: Total number of items in this transaction
 *           example: 10
 *         note:
 *           type: string
 *           description: Additional notes about the transaction
 *           example: "Nhập kho lô hàng mới"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Transaction creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     InventoryTransactionDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         transactionId:
 *           type: string
 *           description: Parent transaction ID
 *           example: "507f1f77bcf86cd799439011"
 *         phoneId:
 *           type: object
 *           description: Phone information
 *           properties:
 *             _id:
 *               type: string
 *             imei:
 *               type: string
 *               description: Phone IMEI number
 *             serialCode:
 *               type: string
 *               description: Phone serial code
 *               example: "SN-123456789"
 *             status:
 *               type: string
 *               description: Phone status
 *               example: "in_stock"
 *             phoneModelId:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "iPhone 13"
 *         itemId:
 *           type: object
 *           description: Item information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               description: Item name
 *               example: "iPhone 13 Screen"
 *             serialCode:
 *               type: string
 *               description: Item serial code
 *               example: "SCR-010426-1234-001"
 *             item_type:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Item type name
 *                   example: "Screen"
 *             baseCost:
 *               type: number
 *               description: Base cost
 *               example: 100.00
 *             price:
 *               type: number
 *               description: Selling price
 *               example: 150.00
 *         quantity:
 *           type: integer
 *           description: Quantity of items
 *           example: 1
 *         note:
 *           type: string
 *           description: Additional notes about the item
 *           example: "New item in stock"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Detail creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/inventory-transactions:
 *   get:
 *     summary: Get all inventory transactions
 *     description: Retrieve all inventory transactions with store information (internal staff only)
 *     tags: [Inventory Transactions]
 *     responses:
 *       200:
 *         description: Inventory transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryTransaction'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/", getAllTransactions);

/**
 * @swagger
 * /api/inventory-transactions/{id}/details:
 *   get:
 *     summary: Get inventory transaction details
 *     description: Retrieve detailed information about a specific inventory transaction including phones and items
 *     tags: [Inventory Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryTransactionDetail'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/:id/details", getTransactionDetails);

module.exports = router;
