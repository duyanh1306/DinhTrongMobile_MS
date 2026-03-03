
const express = require("express");
const router = express.Router();
const { getAllTransferRequests, getTransferRequestDetailsById } = require("../controllers/transfer_requestController");

router.get("/", getAllTransferRequests);
router.get("/:id/details", getTransferRequestDetailsById);

module.exports = router;