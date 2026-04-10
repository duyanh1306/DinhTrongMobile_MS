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
 * components:
 *   schemas:
 *     PurchaseOrder:
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
 *           description: Total price of the purchase order
 *           example: 1500.00
 *         createdBy:
 *           type: object
 *           description: User who created the order
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *               example: "Jane Smith"
 *             name:
 *               type: string
 *             username:
 *               type: string
 *         purchaseOrderDate:
 *           type: string
 *           format: date-time
 *           description: Date when the purchase order was created
 *         status:
 *           type: string
 *           enum: [Pending_Tech, Pending, Completed, Cancelled]
 *           description: Current status of the purchase order
 *           example: "Pending"
 *         orderType:
 *           type: string
 *           enum: [SALE, PURCHASE]
 *           description: Type of order (sale or purchase)
 *           example: "SALE"
 *         note:
 *           type: string
 *           description: Additional notes about the order
 *           example: "Customer requested express delivery"
 *         tempPhoneData:
 *           type: object
 *           description: Temporary phone data for trade-in orders
 *           properties:
 *             phoneModelId:
 *               type: string
 *               description: Phone model ID
 *             imei:
 *               type: string
 *               description: Phone IMEI number
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     PurchaseOrderDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         purchaseOrderId:
 *           type: string
 *           description: Purchase order ID
 *         phoneId:
 *           type: object
 *           description: Phone information
 *           properties:
 *             _id:
 *               type: string
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
 *             item_type:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Screen"
 *                 price:
 *                   type: number
 *                   example: 150.00
 *         purchasePrice:
 *           type: number
 *           description: Purchase price
 *           example: 500.00
 *         type:
 *           type: string
 *           description: Type of item (PHONE or ITEM)
 *           example: "PHONE"
 *         warranty:
 *           type: boolean
 *           description: Whether warranty is included
 *           example: true
 *         warrantyExpireDate:
 *           type: string
 *           format: date-time
 *           description: Warranty expiration date
 *         note:
 *           type: string
 *           description: Additional notes
 *           example: "Minor scratches on screen"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Detail creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreatePurchaseOrder:
 *       type: object
 *       required:
 *         - storeId
 *         - customerName
 *         - orderType
 *       properties:
 *         storeId:
 *           type: string
 *           description: Store ID
 *           example: "507f1f77bcf86cd799439011"
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
 *           example: 1500.00
 *         createdBy:
 *           type: string
 *           description: User ID creating the order
 *           example: "507f1f77bcf86cd799439013"
 *         orderType:
 *           type: string
 *           enum: [SALE, PURCHASE]
 *           description: Type of order
 *           example: "SALE"
 *         status:
 *           type: string
 *           enum: [Pending_Tech, Pending, Completed, Cancelled]
 *           description: Order status
 *           example: "Pending"
 *         note:
 *           type: string
 *           description: Additional notes
 *           example: "Customer requested express delivery"
 *         tempPhoneData:
 *           type: object
 *           description: Temporary phone data for trade-in orders
 *           properties:
 *             phoneModelId:
 *               type: string
 *               description: Phone model ID
 *             imei:
 *               type: string
 *               description: Phone IMEI number
 *         details:
 *           type: array
 *           description: Order details (phones and items)
 *           items:
 *             type: object
 *             properties:
 *               phoneId:
 *                 type: string
 *                 description: Phone ID
 *               itemId:
 *                 type: string
 *                 description: Item ID
 *               price:
 *                 type: number
 *                 description: Price
 *               note:
 *                 type: string
 *                 description: Item notes
 *               warranty:
 *                 type: boolean
 *                 description: Include warranty
 *                 example: true
 *     UpdatePurchaseOrder:
 *       type: object
 *       properties:
 *         totalPrice:
 *           type: number
 *           description: Total price
 *           example: 1500.00
 *         status:
 *           type: string
 *           enum: [Pending_Tech, Pending, Completed, Cancelled]
 *           description: Order status
 *           example: "Completed"
 *         note:
 *           type: string
 *           description: Additional notes
 *           example: "Customer requested express delivery"
 *         tempPhoneData:
 *           type: object
 *           description: Temporary phone data for trade-in orders
 *           properties:
 *             phoneModelId:
 *               type: string
 *               description: Phone model ID
 *             imei:
 *               type: string
 *               description: Phone IMEI number
 */

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     description: Retrieve all purchase orders with optional filtering by order type and status
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *           enum: [SALE, PURCHASE]
 *         description: Filter by order type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending_Tech, Pending, Completed, Cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Purchase orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PurchaseOrder'
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllPurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/manager/store-purchases:
 *   get:
 *     summary: Get purchase orders for manager's store
 *     description: Retrieve purchase orders for the manager's assigned store (manager only)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store purchase orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PurchaseOrder'
 *       401:
 *         description: Unauthorized - authentication required
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
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
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
 *     description: Create a new purchase order (sale or purchase)
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseOrder'
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
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
 *                   example: "Tài khoản của bạn chưa được gắn vào Cửa hàng nào. Vui lòng liên hệ Admin và Đăng nhập lại!"
 *       500:
 *         description: Internal server error
 */
router.post("/", createPurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}/details:
 *   get:
 *     summary: Get purchase order details
 *     description: Retrieve detailed information about a specific purchase order including phones and items
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PurchaseOrderDetail'
 *       500:
 *         description: Internal server error
 */
router.get("/:id/details", getOrderDetailsById);

/**
 * @swagger
 * /api/purchase-orders/customer/{identifier}:
 *   get:
 *     summary: Get orders by customer phone
 *     description: Retrieve all purchase orders for a specific customer by phone number
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer phone number
 *     responses:
 *       200:
 *         description: Customer orders retrieved successfully
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
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *       500:
 *         description: Internal server error
 */
router.get("/customer/:identifier", getOrdersByCustomer);

/**
 * @swagger
 * /api/purchase-orders/{id}/confirm-payment:
 *   patch:
 *     summary: Confirm payment and complete order
 *     description: Confirm payment, update order status to Completed, and create inventory transaction
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
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
 *                   example: "Xác nhận thành công & Đã ghi log kho"
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       404:
 *         description: Purchase order not found
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
 *                   example: "Không tìm thấy đơn hàng"
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/confirm-payment", confirmPayment);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     description: Update a purchase order (status, price, notes, etc.)
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePurchaseOrder'
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thành công"
 *                 data:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       404:
 *         description: Purchase order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy đơn hàng"
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updatePurchaseOrder);

module.exports = router;
