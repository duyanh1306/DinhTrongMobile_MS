// routes/purchase_orderRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllPurchaseOrders,
  getOrderDetailsById,
  createPurchaseOrder
} = require("../controllers/purchase_orderController");

router.get("/", getAllPurchaseOrders);
router.post("/", createPurchaseOrder);
router.get("/:id/details", getOrderDetailsById);

module.exports = router;