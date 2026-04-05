const express = require("express");
const router = express.Router();

const { 
  getAllTransactions, 
  getTransactionDetails 
} = require("../controllers/inventory_transactionController"); 


router.get("/", getAllTransactions);

router.get("/:id/details", getTransactionDetails);

module.exports = router;