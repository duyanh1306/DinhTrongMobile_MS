const express = require("express");
const router = express.Router();
const {
  getAllWarrantyRequests,
  getWarrantyRequestById,
  createWarrantyRequest,
  updateWarrantyRequest,
  processWarrantyRequest,
  completeWarrantyRequest,
  deleteWarrantyRequest
} = require("../controllers/warrantyController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Warranty:
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
 *             code:
 *               type: string
 *         customerName:
 *           type: string
 *           description: Customer's full name
 *           example: "John Doe"
 *         customerPhone:
 *           type: string
 *           description: Customer's phone number
 *           example: "+1234567890"
 *         phoneId:
 *           type: object
 *           description: Phone information
 *           properties:
 *             _id:
 *               type: string
 *             serialCode:
 *               type: string
 *             colorName:
 *               type: string
 *             capacity:
 *               type: string
 *         phoneModel:
 *           type: string
 *           description: Phone model name
 *           example: "iPhone 13 Pro"
 *         serialCode:
 *           type: string
 *           description: Phone serial code
 *           example: "XYZ123ABC456"
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: Purchase date of the phone
 *           example: "2023-01-15"
 *         issueDescription:
 *           type: string
 *           description: Description of the issue
 *           example: "Screen not responding properly"
 *         isNewDevice:
 *           type: boolean
 *           description: Whether the device is new or used
 *           example: true
 *         warrantyType:
 *           type: string
 *           enum: [REPLACEMENT, REPAIR]
 *           description: Type of warranty service
 *           example: "REPLACEMENT"
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Rejected]
 *           description: Current status of the warranty request
 *           example: "Pending"
 *         createdBy:
 *           type: object
 *           description: User who created the request
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *         processedBy:
 *           type: object
 *           description: User who processed the request
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was processed
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was completed
 *         notes:
 *           type: string
 *           description: Additional notes about the warranty request
 *           example: "Customer reported screen issues after dropping the phone"
 *         replacementPhoneId:
 *           type: object
 *           description: Replacement phone information
 *           properties:
 *             _id:
 *               type: string
 *             serialCode:
 *               type: string
 *             colorName:
 *               type: string
 *             capacity:
 *               type: string
 *         repairOrderId:
 *           type: object
 *           description: Associated repair order information
 *           properties:
 *             _id:
 *               type: string
 *             customerName:
 *               type: string
 *             status:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Request creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateWarrantyRequest:
 *       type: object
 *       required:
 *         - storeId
 *         - customerName
 *         - phoneId
 *         - phoneModel
 *         - serialCode
 *         - purchaseDate
 *         - issueDescription
 *         - createdBy
 *       properties:
 *         storeId:
 *           type: string
 *           description: Store ID where the request is made
 *           example: "507f1f77bcf86cd799439011"
 *         customerName:
 *           type: string
 *           description: Customer's full name
 *           example: "John Doe"
 *         customerPhone:
 *           type: string
 *           description: Customer's phone number (optional)
 *           example: "+1234567890"
 *         phoneId:
 *           type: string
 *           description: Phone ID from inventory
 *           example: "507f1f77bcf86cd799439012"
 *         phoneModel:
 *           type: string
 *           description: Phone model name
 *           example: "iPhone 13 Pro"
 *         serialCode:
 *           type: string
 *           description: Phone serial code
 *           example: "XYZ123ABC456"
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: Purchase date of the phone
 *           example: "2023-01-15"
 *         issueDescription:
 *           type: string
 *           description: Description of the issue
 *           example: "Screen not responding properly"
 *         createdBy:
 *           type: string
 *           description: User ID creating the request
 *           example: "507f1f77bcf86cd799439013"
 *     ProcessWarrantyRequest:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [replace, repair]
 *           description: Action to take on the warranty request
 *           example: "replace"
 *         replacementPhoneId:
 *           type: string
 *           description: Phone ID for replacement (required if action is replace)
 *           example: "507f1f77bcf86cd799439014"
 *         notes:
 *           type: string
 *           description: Additional processing notes
 *           example: "Approved for replacement due to manufacturing defect"
 *     UpdateWarrantyRequest:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           description: Additional notes about the warranty request
 *           example: "Customer contacted for additional information"
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Rejected]
 *           description: Update the status of the warranty request
 *           example: "In Progress"
 */

/**
 * @swagger
 * /api/warranty/create:
 *   post:
 *     summary: Create a new warranty request
 *     description: Create a new warranty request for a phone device
 *     tags: [Warranty]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWarrantyRequest'
 *     responses:
 *       201:
 *         description: Warranty request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đã tạo yêu cầu bảo hành thành công"
 *                 data:
 *                   $ref: '#/components/schemas/Warranty'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vui lòng điền đầy đủ thông tin bắt buộc"
 *       404:
 *         description: Phone not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy thiết bị"
 *       500:
 *         description: Internal server error
 */
router.post("/create", createWarrantyRequest);

/**
 * @swagger
 * /warranty:
 *   get:
 *     summary: Get all warranty requests
 *     description: Retrieve a list of all warranty requests with filtering options. Requires internal staff authentication.
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Rejected, ALL]
 *         description: Filter by warranty status
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID (use 'ALL' for all stores)
 *     responses:
 *       200:
 *         description: List of warranty requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warranty'
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
router.get("/", getAllWarrantyRequests);

/**
 * @swagger
 * /api/warranty/{id}:
 *   get:
 *     summary: Get warranty request by ID
 *     description: Retrieve a specific warranty request by its MongoDB ID. Requires internal staff authentication.
 *     tags: [Warranty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB warranty request ID
 *     responses:
 *       200:
 *         description: Warranty request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warranty'
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
 *       404:
 *         description: Warranty request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy yêu cầu bảo hành"
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getWarrantyRequestById);

/**
 * @swagger
 * /api/warranty/{id}:
 *   put:
 *     summary: Update warranty request
 *     description: Update a specific warranty request's notes or status
 *     tags: [Warranty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB warranty request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWarrantyRequest'
 *     responses:
 *       200:
 *         description: Warranty request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Yêu cầu bảo hành đã được cập nhật"
 *                 warranty:
 *                   $ref: '#/components/schemas/Warranty'
 *       404:
 *         description: Warranty request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy yêu cầu bảo hành"
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateWarrantyRequest);

/**
 * @swagger
 * /api/warranty/{id}/process:
 *   put:
 *     summary: Process warranty request
 *     description: Process a pending warranty request (approve replacement or create repair order)
 *     tags: [Warranty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB warranty request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessWarrantyRequest'
 *     responses:
 *       200:
 *         description: Warranty request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Đã phê duyệt thay thế thiết bị mới"
 *                     warranty:
 *                       $ref: '#/components/schemas/Warranty'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Đã tạo đơn sửa chữa bảo hành"
 *                     warranty:
 *                       $ref: '#/components/schemas/Warranty'
 *                     repairOrderId:
 *                       type: string
 *                       description: ID of the created repair order
 *       400:
 *         description: Bad request - invalid status or action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chỉ có thể xử lý yêu cầu đang ở trạng thái chờ xử lý"
 *       404:
 *         description: Warranty request or replacement phone not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy yêu cầu bảo hành"
 *       500:
 *         description: Internal server error
 */
router.put("/:id/process", processWarrantyRequest);

/**
 * @swagger
 * /api/warranty/{id}/complete:
 *   put:
 *     summary: Complete warranty request
 *     description: Mark a warranty request as completed
 *     tags: [Warranty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB warranty request ID
 *     responses:
 *       200:
 *         description: Warranty request completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Yêu cầu bảo hành đã được hoàn thành"
 *                 warranty:
 *                   $ref: '#/components/schemas/Warranty'
 *       400:
 *         description: Bad request - invalid status for completion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chỉ có thể hoàn thành yêu cầu đang trong tiến trình"
 *       404:
 *         description: Warranty request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy yêu cầu bảo hành"
 *       500:
 *         description: Internal server error
 */
router.put("/:id/complete", completeWarrantyRequest);

/**
 * @swagger
 * /api/warranty/{id}:
 *   delete:
 *     summary: Delete warranty request
 *     description: Delete a warranty request (only if not in progress)
 *     tags: [Warranty]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB warranty request ID
 *     responses:
 *       200:
 *         description: Warranty request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Yêu cầu bảo hành đã bị xóa"
 *       400:
 *         description: Bad request - cannot delete request in progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không thể xóa yêu cầu đang trong tiến trình"
 *       404:
 *         description: Warranty request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy yêu cầu bảo hành"
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteWarrantyRequest);

module.exports = router;
