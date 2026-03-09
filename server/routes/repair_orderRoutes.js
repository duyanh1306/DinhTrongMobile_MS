const express = require("express");
const router = express.Router();
const {
  getAllRepairOrders,
  getFilteredRepairOrders,
  getRepairOrderDetailsById,
  acceptRepairOrder,
  cancelRepairOrder
} = require("../controllers/repair_orderController");

router.get("/", getAllRepairOrders);
router.get("/filter", getFilteredRepairOrders);
router.get("/:id/details", getRepairOrderDetailsById);
router.put("/:id/accept", acceptRepairOrder);
router.put("/:id/cancel", cancelRepairOrder);

module.exports = router;
