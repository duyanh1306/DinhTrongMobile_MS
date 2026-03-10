const RepairOrder = require("../models/Repair_order");
const RepairOrderDetail = require("../models/Repair_order_detail");

const getAllRepairOrders = async (req, res) => {
  try {
    const orders = await RepairOrder.find()
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: 1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFilteredRepairOrders = async (req, res) => {
  try {
    const { status, type, storeId } = req.query;
    
    // Build base query
    let query = RepairOrder.find();
    
    // Add status filter if provided
    if (status && status !== 'ALL') {
      query = query.where({ status: status });
    }
    
    // Add store filter if provided
    if (storeId && storeId !== 'ALL') {
      query = query.where({ storeId: storeId });
    }
    
    // Get initial orders with basic population
    let orders = await query
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: 1 });
    
    // If type filter is provided, we need to filter based on repair order details
    if (type && type !== 'ALL') {
      // Get all order IDs that have details with the specified type
      const orderIdsWithType = await RepairOrderDetail.find({ type: type })
        .distinct('repairOrderId');
      
      // Convert orderIdsWithType to strings for comparison
      const orderIdsWithString = orderIdsWithType.map(id => id.toString());
      
      // Filter orders to only include those with the specified type
      orders = orders.filter(order => orderIdsWithString.includes(order._id.toString()));
    }
    
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

const acceptRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Chỉ có thể chấp nhận đơn đang ở trạng thái chờ xử lý" });
    }
    
    order.status = "In Progress";
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã được chấp nhận", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Không thể hủy đơn đã hoàn thành" });
    }
    
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Đơn đã bị hủy trước đó" });
    }
    
    order.status = "Cancelled";
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã bị hủy", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRepairOrders,
  getFilteredRepairOrders,
  getRepairOrderDetailsById,
  acceptRepairOrder,
  cancelRepairOrder,
};
