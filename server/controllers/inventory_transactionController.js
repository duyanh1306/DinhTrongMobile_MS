const InventoryTransaction = require("../models/Inventory_transaction");

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      // 1. Populate đúng trường storeId có trong Schema Inventory_transaction
      .populate("storeId", "name code address")
      
      // 2. Populate phoneId và nối tiếp sang phoneModelId để lấy Tên máy
      .populate({
        path: "phoneId",
        select: "imei status", 
        populate: { path: "phoneModelId", select: "name" }
      })
      
      // 3. Populate itemId và nối tiếp sang item_type để lấy Tên linh kiện
      .populate({
        path: "itemId",
        select: "name serialCode item_type baseCost price",
        populate: { path: "item_type", select: "name" }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("LỖI GET TRANSACTIONS:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTransactions,
};