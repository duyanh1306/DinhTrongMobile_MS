const RepairOrder = require("../models/Repair_order");
const RepairOrderDetail = require("../models/Repair_order_detail");

const getAllRepairOrders = async (req, res) => {
  try {
    const orders = await RepairOrder.find()
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRepairOrderDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    const details = await RepairOrderDetail.find({ repairOrderId: id })

      .populate("repairServiceId", "name price")

      .populate({
        path: "itemId",
        select: "name serialCode item_type itemTypeId",
        populate: [
          { path: "item_type", select: "name price" },
          { path: "itemTypeId", select: "name price" },
        ],
      });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRepairOrders,
  getRepairOrderDetailsById,
};
