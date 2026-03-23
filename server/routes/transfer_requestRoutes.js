
const express = require("express");
const router = express.Router();
const {
    getAllTransferRequests,
    getTransferRequestDetailsById,
    createTransferRequest,
    getTransferRequestById,
    confirmShipment,
    confirmReceipt,
    approveTransferRequest,
    rejectTransferRequest
} = require("../controllers/transfer_requestController");

router.get("/", getAllTransferRequests);
router.get("/:id/details", getTransferRequestDetailsById);
router.post("/", createTransferRequest);
router.get("/:id", getTransferRequestById);
router.put("/:id/confirm-shipment", confirmShipment);
router.put("/:id/confirm-receipt", confirmReceipt);
router.put("/:id/approve", approveTransferRequest);
router.put("/:id/reject", rejectTransferRequest);


module.exports = router;