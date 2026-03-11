const RepairOrder = require("../models/Repair_order");
const RepairOrderDetail = require("../models/Repair_order_detail");
const mongoose = require("mongoose");

const getAllRepairOrders = async (req, res) => {
  try {
    const orders = await RepairOrder.find()
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: 1 });

    // Add repair type to each order
    const ordersWithType = await Promise.all(
      orders.map(async (order) => {
        const details = await RepairOrderDetail.findOne({ repairOrderId: order._id });
        return {
          ...order.toObject(),
          repairType: details ? (details.type === "REPAIR" ? "Sửa chữa" : "Bảo hành") : "N/A"
        };
      })
    );

    res.status(200).json(ordersWithType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRepairOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id)
      .populate("storeId", "name code")
      .populate("createdBy", "fullName");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }

    res.status(200).json(order);
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
    
    // Add repair type to each order
    const ordersWithType = await Promise.all(
      orders.map(async (order) => {
        const details = await RepairOrderDetail.findOne({ repairOrderId: order._id });
        return {
          ...order.toObject(),
          repairType: details ? (details.type === "REPAIR" ? "Sửa chữa" : "Bảo hành") : "N/A"
        };
      })
    );
    
    res.status(200).json(ordersWithType);
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

const updateRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPrice } = req.body;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (totalPrice !== undefined) {
      order.totalPrice = totalPrice;
    }
    
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã được cập nhật", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRepairOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds } = req.body;
    
    // Find and update the repair order details
    const details = await RepairOrderDetail.findOne({ repairOrderId: id });
    
    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
    }
    
    if (itemIds !== undefined) {
      details.itemIds = itemIds;
    }
    
    await details.save();
    
    res.status(200).json({ message: "Chi tiết đơn sửa chữa đã được cập nhật", details });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update repair order details with transfer request creation
const updateRepairOrderDetailsWithTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds, items } = req.body; // items contains full item objects
    
    // Find the repair order to get store information
    const repairOrder = await RepairOrder.findById(id);
    if (!repairOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    // Find and update the repair order details
    const details = await RepairOrderDetail.findOne({ repairOrderId: id });
    
    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
    }
    
    if (itemIds !== undefined) {
      details.itemIds = itemIds;
    }
    
    await details.save();
    
    // Create transfer requests for items not in current store
    let transferRequests = [];
    if (items && items.length > 0) {
      console.log('Items received for transfer request creation:', items);
      console.log('Current store ID:', repairOrder.storeId);
      
      // Check which items need transfer
      const itemsNeedingTransfer = items.filter(item => {
        const itemStoreId = item.storeId?._id || item.storeId;
        const needsTransfer = itemStoreId && itemStoreId !== repairOrder.storeId;
        console.log(`Item ${item.name} - Store: ${itemStoreId}, Current: ${repairOrder.storeId}, Needs Transfer: ${needsTransfer}`);
        return needsTransfer;
      });
      
      console.log(`Items needing transfer: ${itemsNeedingTransfer.length}`);
      
      if (itemsNeedingTransfer.length > 0) {
        const { createTransferRequestForRepairOrder } = require("./transfer_requestController");
        
        try {
          // Use a default user ID if no authenticated user (for system-generated requests)
          const requestedBy = req.user?.id || repairOrder.createdBy || new mongoose.Types.ObjectId();
          
          transferRequests = await createTransferRequestForRepairOrder(
            id,
            itemsNeedingTransfer,
            repairOrder.storeId,
            requestedBy
          );
          console.log(`Created ${transferRequests.length} transfer requests for repair order ${id}`);
        } catch (transferError) {
          console.error('Transfer request creation failed:', transferError);
          // Continue with order update even if transfer fails
        }
      } else {
        console.log('No items need transfer - all items are in current store');
      }
    } else {
      console.log('No items provided for transfer request creation');
    }
    
    res.status(200).json({ 
      message: "Chi tiết đơn sửa chữa đã được cập nhật", 
      details,
      transferRequests: transferRequests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete repair order
const completeRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Đơn sửa chữa đã hoàn thành" });
    }
    
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Không thể hoàn thành đơn đã bị hủy" });
    }
    
    if (order.status !== "In Progress") {
      return res.status(400).json({ message: "Chỉ có thể hoàn thành đơn đang trong tiến trình" });
    }
    
    order.status = "Completed";
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã được hoàn thành", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRepairOrders,
  getRepairOrderById,
  getFilteredRepairOrders,
  getRepairOrderDetailsById,
  updateRepairOrder,
  updateRepairOrderDetails,
  updateRepairOrderDetailsWithTransfer,
  completeRepairOrder,
  acceptRepairOrder,
  cancelRepairOrder,
};
