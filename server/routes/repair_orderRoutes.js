const express = require("express");
const router = express.Router();
const {
  getAllRepairOrders,
  getRepairOrderById,
  getFilteredRepairOrders,
  getRepairOrderDetailsById,
  updateRepairOrder,
  updateRepairOrderDetails,
  updateRepairOrderDetailsWithTransfer,
  completeRepairOrder,
  acceptRepairOrder,
  cancelRepairOrder,
  createRepairOrder
} = require("../controllers/repair_orderController");

/**
 * @swagger
 * tags:
 *   name: Repair Orders
 *   description: Repair order management endpoints
 */

/**
 * @swagger
 * /api/repair-orders:
 *   post:
 *     summary: Create a new repair order
 *     tags: [Repair Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               phoneId:
 *                 type: string
 *               issueDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Repair order created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", createRepairOrder);

/**
 * @swagger
 * /api/repair-orders:
 *   get:
 *     summary: Get all repair orders
 *     tags: [Repair Orders]
 *     responses:
 *       200:
 *         description: List of repair orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/", getAllRepairOrders);

/**
 * @swagger
 * /api/repair-orders/filter:
 *   get:
 *     summary: Get filtered repair orders
 *     tags: [Repair Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Filtered repair orders
 */
router.get("/filter", getFilteredRepairOrders);

/**
 * @swagger
 * /api/repair-orders/by-status:
 *   get:
 *     summary: Get repair orders by status
 *     tags: [Repair Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair orders with specified status
 */
router.get("/by-status", getFilteredRepairOrders);

/**
 * @swagger
 * /api/repair-orders/{id}/details:
 *   get:
 *     summary: Get repair order details by ID
 *     tags: [Repair Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair order details
 *       404:
 *         description: Repair order not found
 */
router.get("/:id/details", getRepairOrderDetailsById);

/**
 * @swagger
 * /api/repair-orders/{id}:
 *   get:
 *     summary: Get repair order by ID
 *     tags: [Repair Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair order details
 *       404:
 *         description: Repair order not found
 */
router.get("/:id", getRepairOrderById);

// Test endpoint to check auth middleware
/**
 * @swagger
 * /api/repair-orders/test-auth:
 *   get:
 *     summary: Test authentication middleware
 *     tags: [Repair Orders]
 *     responses:
 *       200:
 *         description: Auth test successful
 *       401:
 *         description: Unauthorized
 */
router.get("/test-auth", (req, res) => {
  try {
    res.status(200).json({ 
      message: "Auth test endpoint",
      user: req.user ? "User found" : "No user",
      headers: req.headers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/repair-orders/{id}/details:
 *   put:
 *     summary: Update repair order details
 *     tags: [Repair Orders]
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
 *         description: Repair order details updated successfully
 */
router.put("/:id/details", updateRepairOrderDetails);

/**
 * @swagger
 * /api/repair-orders/{id}/details-with-transfer:
 *   put:
 *     summary: Update repair order details with transfer
 *     tags: [Repair Orders]
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
 *         description: Repair order details updated with transfer
 */
router.put("/:id/details-with-transfer", updateRepairOrderDetailsWithTransfer);

/**
 * @swagger
 * /api/repair-orders/{id}/complete:
 *   put:
 *     summary: Complete a repair order
 *     tags: [Repair Orders]
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
 *         description: Repair order completed successfully
 */
router.put("/:id/complete", completeRepairOrder);

/**
 * @swagger
 * /api/repair-orders/{id}/accept:
 *   put:
 *     summary: Accept a repair order
 *     tags: [Repair Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair order accepted successfully
 */
router.put("/:id/accept", acceptRepairOrder);

/**
 * @swagger
 * /api/repair-orders/{id}/cancel:
 *   put:
 *     summary: Cancel a repair order
 *     tags: [Repair Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair order cancelled successfully
 */
router.put("/:id/cancel", cancelRepairOrder);

/**
 * @swagger
 * /api/repair-orders/{id}:
 *   put:
 *     summary: Update repair order
 *     tags: [Repair Orders]
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
 *         description: Repair order updated successfully
 */
router.put("/:id", updateRepairOrder);

module.exports = router;
