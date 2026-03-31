const express = require("express");
const router = express.Router();
const {
  getAllWarrantyRequests,
  getWarrantyRequestById,
  createWarrantyRequest,
  updateWarrantyRequest,
  processWarrantyRequest,
  completeWarrantyRequest,
  deleteWarrantyRequest
} = require("../controllers/warrantyController");

router.post("/create", createWarrantyRequest);
router.get("/", getAllWarrantyRequests);
router.get("/:id", getWarrantyRequestById);
router.put("/:id", updateWarrantyRequest);
router.put("/:id/process", processWarrantyRequest);
router.put("/:id/complete", completeWarrantyRequest);
router.delete("/:id", deleteWarrantyRequest);

module.exports = router;
