const express = require("express");
const router = express.Router();
const { getAllTransactions } = require("../controllers/inventory_transactionController");

router.get("/", getAllTransactions);

module.exports = router;