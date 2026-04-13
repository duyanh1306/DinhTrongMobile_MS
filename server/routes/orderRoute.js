const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         orderCode:
 *           type: string
 *           description: Unique order code
 *           example: "DTM-123456"
 *         userId:
 *           type: object
 *           description: User information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
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
 *             location:
 *               type: string
 *               example: "Ho Chi Minh City"
 *             phone:
 *               type: string
 *               example: "0123456789"
 *         shippingInfo:
 *           type: object
 *           description: Shipping information
 *           properties:
 *             deliveryMethod:
 *               type: string
 *               enum: [home, store]
 *               description: Delivery method
 *               example: "home"
 *             fullName:
 *               type: string
 *               description: Recipient full name
 *               example: "John Doe"
 *             phone:
 *               type: string
 *               description: Recipient phone number
 *               example: "0123456789"
 *             province:
 *               type: string
 *               description: Province/City
 *               example: "Ho Chi Minh City"
 *             district:
 *               type: string
 *               description: District
 *               example: "District 1"
 *             ward:
 *               type: string
 *               description: Ward
 *               example: "Ben Nghe Ward"
 *             address:
 *               type: string
 *               description: Street address
 *               example: "123 Nguyen Hue Street"
 *             note:
 *               type: string
 *               description: Additional shipping notes
 *               example: "Ring doorbell twice"
 *         items:
 *           type: array
 *           description: Order items
 *           items:
 *             type: object
 *             properties:
 *               productType:
 *                 type: string
 *                 enum: [PHONE, CUSTOM_BUILD]
 *                 description: Product type
 *                 example: "PHONE"
 *               phoneModelId:
 *                 type: string
 *                 description: Phone model ID
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "iPhone 13"
 *               colorName:
 *                 type: string
 *                 description: Color name
 *                 example: "Midnight Black"
 *               capacity:
 *                 type: string
 *                 description: Storage capacity
 *                 example: "128GB"
 *               grade:
 *                 type: string
 *                 description: Phone grade
 *                 example: "Cũ Đẹp"
 *               selectedParts:
 *                 type: array
 *                 description: Selected parts for custom build
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: "Screen"
 *                     price:
 *                       type: number
 *                       example: 150.00
 *                     serialCode:
 *                       type: string
 *                       example: "SN-123456"
 *                     warrantyPeriod:
 *                       type: number
 *                       example: 12
 *               image:
 *                 type: string
 *                 description: Product image URL
 *                 example: "https://example.com/product.jpg"
 *               price:
 *                 type: number
 *                 description: Item price
 *                 example: 1200.00
 *               phoneId:
 *                 type: object
 *                 description: Assigned phone information
 *                 properties:
 *                   _id:
 *                     type: string
 *                   serialCode:
 *                     type: string
 *                     example: "SN-123456789"
 *               quantity:
 *                 type: integer
 *                 description: Item quantity
 *                 example: 1
 *               warrantyPeriod:
 *                 type: integer
 *                 description: Warranty period in months
 *                 example: 12
 *         totalAmount:
 *           type: number
 *           description: Total order amount
 *           example: 1500.00
 *         paymentMethod:
 *           type: string
 *           enum: [PAYOS, VNPAY]
 *           description: Payment method
 *           example: "PAYOS"
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid, Failed, Refunded]
 *           description: Payment status
 *           example: "Pending"
 *         orderStatus:
 *           type: string
 *           enum: [Pending, Processing, Delivering, Waiting_Confirm, Completed, Cancelled, Issue_Reported]
 *           description: Order status
 *           example: "Pending"
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           description: Delivery timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateOrder:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - totalAmount
 *         - shippingInfo
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *           example: "507f1f77bcf86cd799439011"
 *         storeId:
 *           type: string
 *           description: Store ID
 *           example: "507f1f77bcf86cd799439012"
 *         items:
 *           type: array
 *           description: Order items
 *           items:
 *             type: object
 *             required:
 *               - productType
 *               - name
 *               - price
 *             properties:
 *               productType:
 *                 type: string
 *                 enum: [PHONE, CUSTOM_BUILD]
 *                 example: "PHONE"
 *               phoneModelId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *               name:
 *                 type: string
 *                 example: "iPhone 13"
 *               colorName:
 *                 type: string
 *                 example: "Midnight Black"
 *               capacity:
 *                 type: string
 *                 example: "128GB"
 *               grade:
 *                 type: string
 *                 example: "Cũ Đẹp"
 *               selectedParts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
 *               image:
 *                 type: string
 *                 example: "https://example.com/product.jpg"
 *               price:
 *                 type: number
 *                 example: 1200.00
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               warrantyPeriod:
 *                 type: integer
 *                 example: 12
 *         totalAmount:
 *           type: number
 *           description: Total order amount
 *           example: 1500.00
 *         shippingInfo:
 *           type: object
 *           required:
 *             - fullName
 *             - phone
 *           properties:
 *             deliveryMethod:
 *               type: string
 *               enum: [home, store]
 *               example: "home"
 *             fullName:
 *               type: string
 *               example: "John Doe"
 *             phone:
 *               type: string
 *               example: "0123456789"
 *             province:
 *               type: string
 *               example: "Ho Chi Minh City"
 *             district:
 *               type: string
 *               example: "District 1"
 *             ward:
 *               type: string
 *               example: "Ben Nghe Ward"
 *             address:
 *               type: string
 *               example: "123 Nguyen Hue Street"
 *             note:
 *               type: string
 *               example: "Ring doorbell twice"
 *         paymentMethod:
 *           type: string
 *           enum: [PAYOS, VNPAY]
 *           description: Payment method
 *           example: "PAYOS"
 *     FulfillOrder:
 *       type: object
 *       required:
 *         - assignedSerials
 *       properties:
 *         assignedSerials:
 *           type: array
 *           description: Array of serial codes to assign to order items
 *           items:
 *             type: string
 *           example: ["SN-123456789", "SN-987654321"]
 */

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     summary: Get all orders
 *     description: Retrieve all orders with full details (internal staff only)
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.get("/all", orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Get orders by user
 *     description: Retrieve all orders for a specific user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
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
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.get("/user/:userId", orderController.getOrdersByUser);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve a specific order by its ID with full details
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
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
router.get("/:id", orderController.getOrderById);

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order with PayOS payment integration
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 orderId:
 *                   type: string
 *                   description: Created order ID
 *                 checkoutUrl:
 *                   type: string
 *                   description: PayOS checkout URL (if PAYOS payment method)
 *                   example: "https://payos.vn/checkout/..."
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Internal server error
 */
router.post('/create', orderController.createOrder);

/**
 * @swagger
 * /api/orders/payos-webhook:
 *   post:
 *     summary: PayOS webhook handler
 *     description: Handle PayOS payment webhook for payment confirmation
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: PayOS webhook data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 */
router.post('/payos-webhook', orderController.payosWebhook);

/**
 * @swagger
 * /api/orders/{id}/fulfill:
 *   put:
 *     summary: Fulfill online order
 *     description: Fulfill online order by assigning serial codes to items and updating inventory (internal staff only)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FulfillOrder'
 *     responses:
 *       200:
 *         description: Order fulfilled successfully
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
 *                   example: "Xuất kho đi ship thành công!"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request - invalid serial codes
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
 *                   example: "Vui lòng quét ít nhất 1 mã Serial để xuất kho!"
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/fulfill', orderController.fulfillOnlineOrder);


/**
 * @swagger
 * /api/orders/{id}/customer-confirm:
 *   put:
 *     summary: Customer confirms receipt
 *     description: Customer confirms receipt of order and marks it as completed
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Receipt confirmed successfully
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
 *                   example: "Cảm ơn bạn đã xác nhận!"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 */
router.put('/:id/customer-confirm', orderController.customerConfirmReceipt);

/**
 * @swagger
 * /api/orders/{id}/customer-report-issue:
 *   put:
 *     summary: Customer reports issue
 *     description: Customer reports issue with delivered order and notifies store staff
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Issue reported successfully
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
 *                   example: "Đã báo cáo khẩn cấp cho cửa hàng!"
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/customer-report-issue', orderController.customerReportIssue);

module.exports = router;
