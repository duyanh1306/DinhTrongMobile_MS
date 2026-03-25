const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/all", orderController.getAllOrders);
router.get("/user/:userId", orderController.getOrdersByUser);
router.get("/:id", orderController.getOrderById);
router.post('/create', orderController.createOrder);
router.post('/payos-webhook', orderController.payosWebhook);
router.put('/:id/fulfill', orderController.fulfillOnlineOrder);
router.put('/:id/mark-delivered', orderController.markAsDeliveredBySale);
router.put('/:id/customer-confirm', orderController.customerConfirmReceipt);
router.put('/:id/customer-report-issue', orderController.customerReportIssue);
module.exports = router;