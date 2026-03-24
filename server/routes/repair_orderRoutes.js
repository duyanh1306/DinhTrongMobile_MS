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
  cancelRepairOrder,
  createRepairOrder
} = require("../controllers/repair_orderController");

router.post("/", createRepairOrder);
router.get("/", getAllRepairOrders);
router.get("/filter", getFilteredRepairOrders);
router.get("/by-status", getFilteredRepairOrders);
router.get("/:id", getRepairOrderById);
router.get("/:id/details", getRepairOrderDetailsById);

// Test endpoint to check auth middleware
router.get("/test-auth", (req, res) => {
  try {
    res.status(200).json({ 
      message: "Auth test endpoint",
      user: req.user ? "User found" : "No user",
      headers: req.headers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/:id", updateRepairOrder);
router.put("/:id/details", updateRepairOrderDetails);
router.put("/:id/details-with-transfer", updateRepairOrderDetailsWithTransfer);
router.put("/:id/complete", completeRepairOrder);
router.put("/:id/accept", acceptRepairOrder);
router.put("/:id/cancel", cancelRepairOrder);

module.exports = router;
