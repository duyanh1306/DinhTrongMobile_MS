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
      // 1. Cập nhật: Sử dụng "serviceId" thay vì "repairServiceId" theo Schema mới
      .populate("serviceId", "name price")
      
      // 2. Cập nhật: Populate cho mảng "itemIds" và "targetPhoneId"
      .populate({
        path: "itemIds",
        select: "name serialCode item_type price",
        populate: { 
          path: "item_type", 
          select: "name price" 
        }
      })
      .populate({
        path: "targetPhoneId",
        select: "imei colorName capacity",
        populate: { path: "phoneModelId", select: "name" }
      });

    if (!details || details.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
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