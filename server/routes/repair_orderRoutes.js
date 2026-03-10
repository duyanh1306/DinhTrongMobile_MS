const express = require("express");
const router = express.Router();
const {
  getAllRepairOrders,
  getRepairOrderById,
  getFilteredRepairOrders,
  getRepairOrderDetailsById,
  updateRepairOrder,
  updateRepairOrderDetails,
  updateRepairOrderDetailsWithTransfer,
  completeRepairOrder,
  acceptRepairOrder,
  cancelRepairOrder
} = require("../controllers/repair_orderController");

router.get("/", getAllRepairOrders);
router.get("/filter", getFilteredRepairOrders);
router.get("/by-status", getFilteredRepairOrders);
router.get("/:id", getRepairOrderById);
router.get("/:id/details", getRepairOrderDetailsById);
router.put("/:id", updateRepairOrder);
router.put("/:id/details", updateRepairOrderDetails);
router.put("/:id/details-with-transfer", updateRepairOrderDetailsWithTransfer);
router.put("/:id/complete", completeRepairOrder);
router.put("/:id/accept", acceptRepairOrder);
router.put("/:id/cancel", cancelRepairOrder);

module.exports = router;
