const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/user/:userId", orderController.getOrdersByUser);
router.get("/:id", orderController.getOrderById);
router.post('/create', orderController.createOrder);
router.post('/payos-webhook', orderController.payosWebhook);
module.exports = router;