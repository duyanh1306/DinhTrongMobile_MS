// routes/purchase_orderRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllPurchaseOrders,
  getOrderDetailsById,
  createPurchaseOrder,
  getOrdersByCustomer
} = require("../controllers/purchase_orderController");

router.get("/", getAllPurchaseOrders);
router.post("/", createPurchaseOrder);
router.get("/:id/details", getOrderDetailsById);
router.get("/customer/:identifier", getOrdersByCustomer);
module.exports = router;