const InventoryTransaction = require("../models/Inventory_transaction");
const InventoryTransactionDetail = require("../models/Inventory_transaction_detail");

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate("storeId", "name code address")
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await InventoryTransactionDetail.find({ transactionId: id })
      .populate({
        path: "phoneId",
        select: "imei serialCode status", 
        populate: { path: "phoneModelId", select: "name" }
      })
      .populate({
        path: "itemId",
        select: "name serialCode item_type baseCost price",
        populate: { path: "item_type", select: "name" }
      });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionDetails 
};