// routes/purchase_orderRoutes.js
const express = require("express");
const router = express.Router();
const { authManager } = require("../middlewares/auth");
const {
  getAllPurchaseOrders,
  getPurchaseOrdersForManagerStore,
  getOrderDetailsById,
  createPurchaseOrder,
  getOrdersByCustomer,
  confirmPayment,
  updatePurchaseOrder,
} = require("../controllers/purchase_orderController");

/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Purchase order management endpoints
 */

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchase Orders]
 *     responses:
 *       200:
 *         description: List of purchase orders
 */
router.get("/", getAllPurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/manager/store-purchases:
 *   get:
 *     summary: Get purchase orders for manager's store (authenticated)
 *     tags: [Purchase Orders]
 *     responses:
 *       200:
 *         description: List of purchase orders for manager's store
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/manager/store-purchases",
  authManager,
  getPurchaseOrdersForManagerStore
);

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *               totalAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 */
router.post("/", createPurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}/details:
 *   get:
 *     summary: Get purchase order details by ID
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order details
 *       404:
 *         description: Purchase order not found
 */
router.get("/:id/details", getOrderDetailsById);

/**
 * @swagger
 * /api/purchase-orders/customer/{identifier}:
 *   get:
 *     summary: Get purchase orders by customer identifier
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customer purchase orders
 */
router.get("/customer/:identifier", getOrdersByCustomer);

/**
 * @swagger
 * /api/purchase-orders/{id}/confirm-payment:
 *   patch:
 *     summary: Confirm payment for purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 */
router.patch("/:id/confirm-payment", confirmPayment);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     tags: [Purchase Orders]
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
 *         description: Purchase order updated successfully
 */
router.put('/:id', updatePurchaseOrder);

module.exports = router;