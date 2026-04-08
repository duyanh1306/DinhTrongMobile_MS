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

router.get("/", getAllPurchaseOrders);
router.get(
  "/manager/store-purchases",
  authManager,
  getPurchaseOrdersForManagerStore
);
router.post("/", createPurchaseOrder);
router.get("/:id/details", getOrderDetailsById);
router.get("/customer/:identifier", getOrdersByCustomer);
router.patch("/:id/confirm-payment", confirmPayment);
router.put('/:id', updatePurchaseOrder);
module.exports = router;