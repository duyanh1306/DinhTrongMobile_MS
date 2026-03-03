const express = require("express");
const router = express.Router();
const {
  getAllRepairOrders,
  getRepairOrderDetailsById
} = require("../controllers/repair_orderController");

router.get("/", getAllRepairOrders);
router.get("/:id/details", getRepairOrderDetailsById);

module.exports = router;