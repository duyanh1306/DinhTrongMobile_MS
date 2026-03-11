
const express = require("express");
const router = express.Router();
const { getAllTransferRequests, getTransferRequestDetailsById, createTransferRequest } = require("../controllers/transfer_requestController");

router.get("/", getAllTransferRequests);
router.get("/:id/details", getTransferRequestDetailsById);
router.post("/", createTransferRequest);

module.exports = router;