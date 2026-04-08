const express = require("express");
const router = express.Router();
const {
    getAllTransferRequests,
    getTransferRequestDetailsById,
    createTransferRequest,
    getTransferRequestById,
    confirmShipment,
    confirmReceipt,
    approveTransferRequest,
    rejectTransferRequest
} = require("../controllers/transfer_requestController");

/**
 * @swagger
 * components:
 *   schemas:
 *     TransferRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         fromStoreId:
 *           type: object
 *           description: Source store information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Main Store"
 *             code:
 *               type: string
 *               example: "STORE001"
 *         toStoreId:
 *           type: object
 *           description: Destination store information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Branch Store"
 *             code:
 *               type: string
 *               example: "STORE002"
 *         requestedBy:
 *           type: object
 *           description: User who created the transfer request
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *               example: "John Doe"
 *         approvedBy:
 *           type: object
 *           description: User who approved the transfer request
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *               example: "Jane Smith"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, DELIVERING, COMPLETED]
 *           description: Current status of the transfer request
 *           example: "PENDING"
 *         note:
 *           type: string
 *           description: Additional notes about the transfer request
 *           example: "Urgent transfer for repair order"
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was approved
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the transfer was completed
 *         itemType:
 *           type: array
 *           description: List of item types to transfer
 *           items:
 *             type: object
 *             properties:
 *               itemTypes:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     example: "Screen"
 *               quantity:
 *                 type: integer
 *                 example: 5
 *         phoneModel:
 *           type: array
 *           description: List of phone models to transfer
 *           items:
 *             type: object
 *             properties:
 *               phoneModels:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     example: "iPhone 13"
 *               quantity:
 *                 type: integer
 *                 example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Request creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     TransferRequestDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         transferRequestId:
 *           type: string
 *           description: Transfer request ID
 *         itemId:
 *           type: array
 *           description: List of item IDs
 *           items:
 *             type: string
 *         phoneId:
 *           type: array
 *           description: List of phone IDs
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [PENDING, DELIVERING, COMPLETED]
 *           description: Detail status
 *           example: "PENDING"
 *         note:
 *           type: string
 *           description: Detail notes
 *           example: "Items for repair order"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Detail creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateTransferRequest:
 *       type: object
 *       required:
 *         - fromStoreId
 *         - toStoreId
 *         - requestedBy
 *       properties:
 *         fromStoreId:
 *           type: string
 *           description: Source store ID
 *           example: "507f1f77bcf86cd799439011"
 *         toStoreId:
 *           type: string
 *           description: Destination store ID
 *           example: "507f1f77bcf86cd799439012"
 *         requestedBy:
 *           type: string
 *           description: User ID creating the request
 *           example: "507f1f77bcf86cd799439013"
 *         itemType:
 *           type: array
 *           description: List of item types to transfer
 *           items:
 *             type: object
 *             properties:
 *               itemTypes:
 *                 type: string
 *                 description: Item type ID
 *               quantity:
 *                 type: integer
 *                 description: Quantity
 *         phoneModel:
 *           type: array
 *           description: List of phone models to transfer
 *           items:
 *             type: object
 *             properties:
 *               phoneModels:
 *                 type: string
 *                 description: Phone model ID
 *               quantity:
 *                 type: integer
 *                 description: Quantity
 *         note:
 *           type: string
 *           description: Additional notes
 *           example: "Urgent transfer for repair order"
 *     ConfirmShipmentRequest:
 *       type: object
 *       properties:
 *         note:
 *           type: string
 *           description: Shipment notes
 *           example: "Items packaged and ready for delivery"
 *         items:
 *           type: array
 *           description: List of items being shipped
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Item ID
 *         phones:
 *           type: array
 *           description: List of phones being shipped
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Phone ID
 */

/**
 * @swagger
 * /transfer-requests:
 *   get:
 *     summary: Get all transfer requests
 *     description: Retrieve a list of all transfer requests with populated store and user information
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transfer requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequest'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No token provided"
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: Requires one of roles [ADMIN, MANAGER, SALE_STAFF, TECHNICIAN]"
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllTransferRequests);

/**
 * @swagger
 * /api/transfer-requests/{id}/details:
 *   get:
 *     summary: Get transfer request details
 *     description: Retrieve detailed items and phones for a specific transfer request
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer request ID
 *     responses:
 *       200:
 *         description: Transfer request details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TransferRequestDetail'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/:id/details", getTransferRequestDetailsById);

/**
 * @swagger
 * /transfer-requests:
 *   post:
 *     summary: Create a new transfer request
 *     description: Create a new transfer request between stores
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransferRequest'
 *     responses:
 *       201:
 *         description: Transfer request created successfully
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
 *                   example: "Tạo yêu cầu thành công"
 *                 data:
 *                   $ref: '#/components/schemas/TransferRequest'
 *                 detail:
 *                   $ref: '#/components/schemas/TransferRequestDetail'
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
 *                   example: "Thiếu trường bắt buộc"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/", createTransferRequest);

/**
 * @swagger
 * /api/transfer-requests/{id}:
 *   get:
 *     summary: Get transfer request by ID
 *     description: Retrieve a specific transfer request by its ID
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer request ID
 *     responses:
 *       200:
 *         description: Transfer request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferRequest'
 *       404:
 *         description: Transfer request not found
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
 *                   example: "Không tìm thấy yêu cầu vận chuyển"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getTransferRequestById);

/**
 * @swagger
 * /api/transfer-requests/{id}/shipment:
 *   put:
 *     summary: Confirm shipment
 *     description: Confirm that items have been shipped and create outbound inventory transactions
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfirmShipmentRequest'
 *     responses:
 *       200:
 *         description: Shipment confirmed successfully
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
 *                   example: "Vận chuyển thành công"
 *                 data:
 *                   $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: Bad request - invalid status
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
 *                   example: "Yêu cầu vận chuyển phải trong trạng thái Duyệt để xác nhận vận chuyển"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Transfer request not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/shipment", confirmShipment);

/**
 * @swagger
 * /api/transfer-requests/{id}/receipt:
 *   put:
 *     summary: Confirm receipt
 *     description: Confirm receipt of transferred items and update inventory
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer request ID
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
 *                   example: "Xác nhận nhận hàng và cập nhật kho thành công"
 *                 data:
 *                   $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: Bad request - invalid status
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
 *                   example: "Yêu cầu vận chuyện phải trong trạng thái Đang vận chuyển để xác nhận"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Transfer request not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/receipt", confirmReceipt);

/**
 * @swagger
 * /api/transfer-requests/{id}/approve:
 *   put:
 *     summary: Approve transfer request
 *     description: Approve a pending transfer request
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer request ID
 *     responses:
 *       200:
 *         description: Transfer request approved successfully
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
 *                   example: "Yêu cầu vận chuyển đã duyệt"
 *                 data:
 *                   $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: Bad request - invalid status
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
 *                   example: "Trạng thái không hợp lệ"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Transfer request not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/approve", approveTransferRequest);

/**
 * @swagger
 * /api/transfer-requests/{id}/reject:
 *   put:
 *     summary: Reject transfer request
 *     description: Reject a pending transfer request
 *     tags: [Transfer Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer request ID
 *     responses:
 *       200:
 *         description: Transfer request rejected successfully
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
 *                   example: "Yêu cầu vận chuyển đã từ chối"
 *                 data:
 *                   $ref: '#/components/schemas/TransferRequest'
 *       400:
 *         description: Bad request - invalid status
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
 *                   example: "Yêu cầu vận chuyển phải trong trạng thái Chờ để từ chối"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Transfer request not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/reject", rejectTransferRequest);

module.exports = router;
