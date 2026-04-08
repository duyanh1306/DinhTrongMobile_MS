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
 * components:
 *   schemas:
 *     RepairOrder:
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
 *         customerName:
 *           type: string
 *           description: Customer's full name
 *           example: "John Doe"
 *         customerPhone:
 *           type: string
 *           description: Customer's phone number
 *           example: "+1234567890"
 *         totalPrice:
 *           type: number
 *           description: Total price of the repair order
 *           example: 250.00
 *         createdBy:
 *           type: object
 *           description: User who created the repair order
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *               example: "Jane Smith"
 *         repairOrderDate:
 *           type: string
 *           format: date-time
 *           description: Date when the repair order was created
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Cancelled]
 *           description: Current status of the repair order
 *           example: "Pending"
 *         repairType:
 *           type: string
 *           description: Type of repair (calculated from order details)
 *           example: "Sửa chữa"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     RepairOrderDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         repairOrderId:
 *           type: string
 *           description: Repair order ID
 *         serviceId:
 *           type: array
 *           description: List of service IDs
 *           items:
 *             type: string
 *         itemIds:
 *           type: array
 *           description: List of item IDs used in repair
 *           items:
 *             type: string
 *         type:
 *           type: string
 *           enum: [REPAIR, WARRANTY]
 *           description: Type of repair service
 *           example: "REPAIR"
 *         targetPhoneId:
 *           type: string
 *           description: Target phone ID for repair
 *         isInternal:
 *           type: boolean
 *           description: Whether this is an internal repair
 *           example: false
 *         note:
 *           type: string
 *           description: Additional notes about the repair
 *           example: "Screen replacement completed"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Detail creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateRepairOrder:
 *       type: object
 *       required:
 *         - storeId
 *         - customerName
 *       properties:
 *         storeId:
 *           type: string
 *           description: Store ID where the repair order is created
 *           example: "507f1f77bcf86cd799439011"
 *         customerName:
 *           type: string
 *           description: Customer's full name
 *           example: "John Doe"
 *         customerPhone:
 *           type: string
 *           description: Customer's phone number (optional)
 *           example: "+1234567890"
 *         totalPrice:
 *           type: number
 *           description: Total price (defaults to 0)
 *           example: 250.00
 *         createdBy:
 *           type: string
 *           description: User ID creating the repair order
 *           example: "507f1f77bcf86cd799439013"
 *     UpdateRepairOrder:
 *       type: object
 *       properties:
 *         customerName:
 *           type: string
 *           description: Customer's full name
 *           example: "John Doe"
 *         customerPhone:
 *           type: string
 *           description: Customer's phone number
 *           example: "+1234567890"
 *         totalPrice:
 *           type: number
 *           description: Total price
 *           example: 250.00
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Cancelled]
 *           description: Order status
 *           example: "In Progress"
 *     UpdateRepairOrderDetails:
 *       type: object
 *       properties:
 *         serviceId:
 *           type: array
 *           description: List of service IDs
 *           items:
 *             type: string
 *         itemIds:
 *           type: array
 *           description: List of item IDs used in repair
 *           items:
 *             type: string
 *         type:
 *           type: string
 *           enum: [REPAIR, WARRANTY]
 *           description: Type of repair service
 *           example: "REPAIR"
 *         targetPhoneId:
 *           type: string
 *           description: Target phone ID for repair
 *         isInternal:
 *           type: boolean
 *           description: Whether this is an internal repair
 *           example: false
 *         note:
 *           type: string
 *           description: Additional notes about the repair
 *           example: "Screen replacement completed"
 */

/**
 * @swagger
 * /api/repair-orders:
 *   post:
 *     summary: Create a new repair order
 *     description: Create a new repair order for a customer
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRepairOrder'
 *     responses:
 *       201:
 *         description: Repair order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/", createRepairOrder);

/**
 * @swagger
 * /api/repair-orders:
 *   get:
 *     summary: Get all repair orders
 *     description: Retrieve all repair orders for the user's store with repair type information
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *         description: Filter by technician (createdBy user ID)
 *     responses:
 *       200:
 *         description: Repair orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllRepairOrders);

/**
 * @swagger
 * /api/repair-orders/filter:
 *   get:
 *     summary: Get filtered repair orders
 *     description: Retrieve repair orders with filtering by status, type, and store
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Cancelled, ALL]
 *         description: Filter by order status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REPAIR, WARRANTY, ALL]
 *         description: Filter by repair type
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID (use 'ALL' for all stores)
 *     responses:
 *       200:
 *         description: Filtered repair orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/filter", getFilteredRepairOrders);

/**
 * @swagger
 * /api/repair-orders/by-status:
 *   get:
 *     summary: Get repair orders by status (alias for filter endpoint)
 *     description: Retrieve repair orders filtered by status (alias for /filter endpoint)
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Cancelled, ALL]
 *         description: Filter by order status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REPAIR, WARRANTY, ALL]
 *         description: Filter by repair type
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID (use 'ALL' for all stores)
 *     responses:
 *       200:
 *         description: Filtered repair orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/by-status", getFilteredRepairOrders);

/**
 * @swagger
 * /api/repair-orders/{id}/details:
 *   get:
 *     summary: Get repair order details
 *     description: Retrieve detailed information about a specific repair order including services and items
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     responses:
 *       200:
 *         description: Repair order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrderDetail'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/details", getRepairOrderDetailsById);

/**
 * @swagger
 * /api/repair-orders/{id}:
 *   get:
 *     summary: Get repair order by ID
 *     description: Retrieve a specific repair order by its ID
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     responses:
 *       200:
 *         description: Repair order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy đơn sửa chữa"
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getRepairOrderById);

/**
 * @swagger
 * /api/repair-orders/test-auth:
 *   get:
 *     summary: Test authentication endpoint
 *     description: Test endpoint to verify authentication middleware is working
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auth test endpoint"
 *                 user:
 *                   type: string
 *                   example: "User found"
 *                 headers:
 *                   type: object
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
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
 *     description: Update the details of a specific repair order (services, items, etc.)
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRepairOrderDetails'
 *     responses:
 *       200:
 *         description: Repair order details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrderDetail'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/details", updateRepairOrderDetails);

/**
 * @swagger
 * /api/repair-orders/{id}/details-with-transfer:
 *   put:
 *     summary: Update repair order details with transfer
 *     description: Update repair order details and handle inventory transfers if needed
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRepairOrderDetails'
 *     responses:
 *       200:
 *         description: Repair order details updated with transfer handled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrderDetail'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/details-with-transfer", updateRepairOrderDetailsWithTransfer);

/**
 * @swagger
 * /api/repair-orders/{id}/complete:
 *   put:
 *     summary: Complete repair order
 *     description: Mark a repair order as completed
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     responses:
 *       200:
 *         description: Repair order completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/complete", completeRepairOrder);

/**
 * @swagger
 * /api/repair-orders/{id}/accept:
 *   put:
 *     summary: Accept repair order
 *     description: Accept a repair order and change status to "In Progress"
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     responses:
 *       200:
 *         description: Repair order accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/accept", acceptRepairOrder);

/**
 * @swagger
 * /api/repair-orders/{id}/cancel:
 *   put:
 *     summary: Cancel repair order
 *     description: Cancel a repair order
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     responses:
 *       200:
 *         description: Repair order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/cancel", cancelRepairOrder);

/**
 * @swagger
 * /api/repair-orders/{id}:
 *   put:
 *     summary: Update repair order
 *     description: Update basic information of a repair order
 *     tags: [Repair Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRepairOrder'
 *     responses:
 *       200:
 *         description: Repair order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RepairOrder'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair order not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateRepairOrder);

module.exports = router;
