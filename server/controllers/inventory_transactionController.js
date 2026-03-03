const InventoryTransaction = require("../models/Inventory_transaction");

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate({
        path: "itemId",
        select: "serialCode item_type itemTypeId",
        populate: [
          { path: "item_type", select: "name" },
          { path: "itemTypeId", select: "name" }
        ]
      })
      .populate("fromStoreId", "name code")
      .populate("toStoreId", "name code")
      .populate("performedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTransactions,
};