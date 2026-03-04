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
      // 1. Lấy thông tin dịch vụ sửa chữa (Tên và Giá dịch vụ)
      .populate("repairServiceId", "name price")
      // 2. Lấy thông tin linh kiện thay thế (SerialCode và Tên/Giá từ ItemType)
      .populate({
        path: "itemId",
        select: "name serialCode item_type",
        populate: { 
          path: "item_type", 
          select: "name price" 
        }
      });

    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn" });
    }

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  getAllRepairOrders,
  getRepairOrderDetailsById,
};
