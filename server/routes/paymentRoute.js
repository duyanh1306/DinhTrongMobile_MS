const express = require('express');
const router = express.Router();
const { createVnpayPayment, vnpayReturn, vnpayIpn } = require('../controllers/paymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateVnpayPayment:
 *       type: object
 *       required:
 *         - amountVnd
 *         - orderId
 *       properties:
 *         amountVnd:
 *           type: number
 *           description: Payment amount in Vietnamese Dong
 *           example: 15000000
 *         orderId:
 *           type: string
 *           description: Order ID reference
 *           example: "507f1f77bcf86cd799439011"
 *         orderInfo:
 *           type: string
 *           description: Order description
 *           example: "Course payment"
 *         bankCode:
 *           type: string
 *           description: Bank code for payment method (optional)
 *           example: "VNPAYQR"
 *         locale:
 *           type: string
 *           description: Language locale (vn, en)
 *           example: "vn"
 *     VnpayPaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Payment URL creation status
 *           example: true
 *         paymentUrl:
 *           type: string
 *           description: VNPay payment URL for redirection
 *           example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_Command=pay&vnp_CreateDate=..."
 *     VnpayReturnResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Payment success status
 *           example: true
 *         code:
 *           type: string
 *           description: VNPay response code (00 = success)
 *           example: "00"
 *         data:
 *           type: object
 *           description: VNPay return parameters
 *           properties:
 *             vnp_TxnRef:
 *               type: string
 *               description: Order ID
 *             vnp_ResponseCode:
 *               type: string
 *               description: Response code
 *             vnp_TransactionNo:
 *               type: string
 *               description: Transaction number
 *             vnp_BankCode:
 *               type: string
 *               description: Bank code
 *             vnp_PayDate:
 *               type: string
 *               description: Payment date
 *             vnp_Amount:
 *               type: string
 *               description: Payment amount
 *             vnp_OrderInfo:
 *               type: string
 *               description: Order information
 *     VnpayIpnResponse:
 *       type: object
 *       properties:
 *         RspCode:
 *           type: string
 *           description: Response code (00 = success, 97 = invalid checksum, 99 = unknown error)
 *           example: "00"
 *         Message:
 *           type: string
 *           description: Response message
 *           example: "Confirm Success"
 */

/**
 * @swagger
 * /api/vnpay/create:
 *   post:
 *     summary: Create VNPay payment URL
 *     description: Generate VNPay payment URL for order payment. Returns a payment URL that redirects to VNPay payment gateway.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVnpayPayment'
 *     responses:
 *       200:
 *         description: Payment URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VnpayPaymentResponse'
 *       400:
 *         description: Bad request - missing required parameters
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
 *                   example: "amountVnd and orderId are required"
 *       500:
 *         description: Internal server error - VNPay payment creation failed
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
 *                   example: "Lỗi tạo link thanh toán VNPay"
 */
router.post('/vnpay/create', createVnpayPayment);

/**
 * @swagger
 * /api/vnpay/return:
 *   get:
 *     summary: VNPay payment return callback
 *     description: Handle VNPay payment return callback after payment completion. Verifies payment result and updates order status.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (transaction reference)
 *       - in: query
 *         name: vnp_ResponseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: VNPay response code (00 = success)
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: VNPay transaction number
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Bank code used for payment
 *       - in: query
 *         name: vnp_PayDate
 *         schema:
 *           type: string
 *         description: Payment date
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Payment amount
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Order information
 *       - in: query
 *         name: vnp_SecureHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Security hash for verification
 *     responses:
 *       302:
 *         description: Redirect to client frontend with payment result
 *       400:
 *         description: Invalid checksum or payment verification failed
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
 *                   example: "Invalid checksum"
 *       200:
 *         description: Payment return processed successfully (if no redirect URL configured)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VnpayReturnResponse'
 *       500:
 *         description: Internal server error
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
 *                   example: "Lỗi Return VNPay"
 */
router.get('/vnpay/return', vnpayReturn);

/**
 * @swagger
 * /api/vnpay/ipn:
 *   get:
 *     summary: VNPay Instant Payment Notification (IPN)
 *     description: Handle VNPay IPN callback for server-to-server payment notification. Verifies payment result and confirms payment status.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (transaction reference)
 *       - in: query
 *         name: vnp_ResponseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: VNPay response code (00 = success)
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: VNPay transaction number
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Bank code used for payment
 *       - in: query
 *         name: vnp_PayDate
 *         schema:
 *           type: string
 *         description: Payment date
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Payment amount
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Order information
 *       - in: query
 *         name: vnp_SecureHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Security hash for verification
 *     responses:
 *       200:
 *         description: IPN processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VnpayIpnResponse'
 *       400:
 *         description: Invalid checksum
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 RspCode:
 *                   type: string
 *                   example: "97"
 *                 Message:
 *                   type: string
 *                   example: "Invalid Checksum"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 RspCode:
 *                   type: string
 *                   example: "99"
 *                 Message:
 *                   type: string
 *                   example: "Unknown error"
 */
router.get('/vnpay/ipn', vnpayIpn);

module.exports = router;
