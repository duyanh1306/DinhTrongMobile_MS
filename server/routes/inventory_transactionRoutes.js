const express = require("express");
const router = express.Router();
const { getAllTransactions } = require("../controllers/inventory_transactionController");

/**
 * @swagger
 * tags:
 *   name: Inventory Transactions
 *   description: Inventory transaction management endpoints
 */

/**
 * @swagger
 * /api/inventory-transactions:
 *   get:
 *     summary: Get all inventory transactions
 *     tags: [Inventory Transactions]
 *     responses:
 *       200:
 *         description: List of all inventory transactions
 */
router.get("/", getAllTransactions);

module.exports = router;