
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
 * tags:
 *   name: Transfer Requests
 *   description: Transfer request management endpoints
 */

/**
 * @swagger
 * /api/transfer-requests:
 *   get:
 *     summary: Get all transfer requests
 *     tags: [Transfer Requests]
 *     responses:
 *       200:
 *         description: List of transfer requests
 */
router.get("/", getAllTransferRequests);

/**
 * @swagger
 * /api/transfer-requests/{id}/details:
 *   get:
 *     summary: Get transfer request details by ID
 *     tags: [Transfer Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer request details
 *       404:
 *         description: Transfer request not found
 */
router.get("/:id/details", getTransferRequestDetailsById);

/**
 * @swagger
 * /api/transfer-requests:
 *   post:
 *     summary: Create a new transfer request
 *     tags: [Transfer Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromStoreId:
 *                 type: string
 *               toStoreId:
 *                 type: string
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Transfer request created successfully
 */
router.post("/", createTransferRequest);

/**
 * @swagger
 * /api/transfer-requests/{id}:
 *   get:
 *     summary: Get transfer request by ID
 *     tags: [Transfer Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer request details
 *       404:
 *         description: Transfer request not found
 */
router.get("/:id", getTransferRequestById);

/**
 * @swagger
 * /api/transfer-requests/{id}/confirm-shipment:
 *   put:
 *     summary: Confirm shipment of transfer request
 *     tags: [Transfer Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipment confirmed successfully
 */
router.put("/:id/confirm-shipment", confirmShipment);

/**
 * @swagger
 * /api/transfer-requests/{id}/confirm-receipt:
 *   put:
 *     summary: Confirm receipt of transfer request
 *     tags: [Transfer Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt confirmed successfully
 */
router.put("/:id/confirm-receipt", confirmReceipt);

/**
 * @swagger
 * /api/transfer-requests/{id}/approve:
 *   put:
 *     summary: Approve transfer request
 *     tags: [Transfer Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer request approved successfully
 */
router.put("/:id/approve", approveTransferRequest);

/**
 * @swagger
 * /api/transfer-requests/{id}/reject:
 *   put:
 *     summary: Reject transfer request
 *     tags: [Transfer Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer request rejected successfully
 */
router.put("/:id/reject", rejectTransferRequest);


module.exports = router;