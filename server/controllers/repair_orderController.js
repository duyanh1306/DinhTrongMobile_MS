const RepairOrder = require("../models/Repair_order");
const RepairOrderDetail = require("../models/Repair_order_detail");
const mongoose = require("mongoose");

const getAllRepairOrders = async (req, res) => {
  try {
    const { technicianId } = req.query;
    let userStoreId = null;
    
    if (req.user && req.user.storeId) {
      userStoreId = req.user.storeId;
    }
    
    const User = require("../models/User");
    const userDoc = await User.findById(req.user.id);
    
    if (userDoc && userDoc.storeId) {
      userStoreId = userDoc.storeId;
    }
    
    if (!userStoreId) {
      const Store = require("../models/Store");
      const userId = new mongoose.Types.ObjectId(req.user?.id);
      
      const allStores = await Store.find({});
      const userStore = await Store.findOne({ staff: userId });
      
      if (userStore) {
        userStoreId = userStore._id;
      }
    }
    
    let query = RepairOrder.find();
    if (userStoreId) {
      query = query.where({ storeId: userStoreId });
    }
    if (technicianId) {
      query = query.where({ technicianId: technicianId });
    }

    const orders = await query
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: -1 });

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
    let userStoreId = null;
    
    if (req.user && req.user.storeId) {
      userStoreId = req.user.storeId;
    }
    
    const User = require("../models/User");
    const userDoc = await User.findById(req.user.id);
    
    if (userDoc && userDoc.storeId) {
      userStoreId = userDoc.storeId;
    }
    
    if (!userStoreId) {
      const Store = require("../models/Store");
      const userId = new mongoose.Types.ObjectId(req.user?.id);
      const userStore = await Store.findOne({ staff: userId });
      
      if (userStore) {
        userStoreId = userStore._id;
      }
    }
    
    let query = RepairOrder.find();
    
    if (status && status !== 'ALL') {
      query = query.where({ status: status });
    }
    
    if (userStoreId) {
      query = query.where({ storeId: userStoreId });
    } else if (storeId && storeId !== 'ALL') {
      query = query.where({ storeId: storeId });
    }
    
    let orders = await query
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .populate("phoneModelId", "name")
      .sort({ repairOrderDate: 1 });
    
    if (type && type !== 'ALL') {
      const orderIdsWithType = await RepairOrderDetail.find({ type: type }).distinct('repairOrderId');
      const orderIdsWithString = orderIdsWithType.map(id => id.toString());
      orders = orders.filter(order => orderIdsWithString.includes(order._id.toString()));
    }
    
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
      .populate("serviceId", "name price")
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
        select: "imei colorName capacity serialCode",
        populate: { path: "phoneModelId", select: "name" }
      });

    res.status(200).json(details || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId, itemIds, totalPrice, phoneModelId } = req.body;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Chỉ có thể chấp nhận đơn đang ở trạng thái chờ xử lý" });
    }
    
    order.status = "In Progress";
    order.technicianId = req.user?.id || req.user?._id || null;
    if (totalPrice !== undefined) order.totalPrice = totalPrice;
    if (phoneModelId !== undefined) order.phoneModelId = phoneModelId;
    await order.save();

    if (serviceId !== undefined || itemIds !== undefined) {
      const details = await RepairOrderDetail.findOne({ repairOrderId: id });
      if (details) {
        if (serviceId !== undefined) {
          details.serviceId = Array.isArray(serviceId) ? serviceId : (serviceId ? [serviceId] : []);
        }
        if (itemIds !== undefined) {
          details.itemIds = itemIds;
        }
        await details.save();
      }
    }
    
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
    const { totalPrice, phoneModelId } = req.body;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (totalPrice !== undefined) {
      order.totalPrice = totalPrice;
    }
    if (phoneModelId !== undefined) {
      order.phoneModelId = phoneModelId;
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

const updateRepairOrderDetailsWithTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds, items, serviceId } = req.body;

    const repairOrder = await RepairOrder.findById(id);
    if (!repairOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }

    const details = await RepairOrderDetail.findOne({ repairOrderId: id });

    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
    }

    if (itemIds !== undefined) {
      details.itemIds = itemIds;
    }

    if (serviceId !== undefined) {
      if (Array.isArray(serviceId)) {
        details.serviceId = serviceId;
      } else if (serviceId) {
        details.serviceId = [serviceId];
      } else {
        details.serviceId = [];
      }
    }

    await details.save();

    let transferRequests = [];
    if (items && items.length > 0) {
      const itemsNeedingTransfer = items.filter(item => {
        const itemStoreId = item.storeId?._id || item.storeId;
        const needsTransfer = itemStoreId && itemStoreId.toString() !== repairOrder.storeId.toString();
        return needsTransfer;
      });

      if (itemsNeedingTransfer.length > 0) {
        const { createTransferRequestForRepairOrder } = require("./transfer_requestController");

        try {
          const requestedBy = req.user?.id || repairOrder.createdBy || new mongoose.Types.ObjectId();
          transferRequests = await createTransferRequestForRepairOrder(
              id,
              itemsNeedingTransfer,
              repairOrder.storeId,
              requestedBy
          );
        } catch (transferError) {}
      }
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

const completeRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId, itemIds, totalPrice, phoneModelId } = req.body;
    
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
    if (totalPrice !== undefined) order.totalPrice = totalPrice;
    if (phoneModelId !== undefined) order.phoneModelId = phoneModelId;
    await order.save();

    const details = await RepairOrderDetail.findOne({ repairOrderId: id });
    let finalItemIds = [];

    if (details) {
      if (serviceId !== undefined) {
        details.serviceId = Array.isArray(serviceId) ? serviceId : (serviceId ? [serviceId] : []);
      }
      if (itemIds !== undefined) {
        details.itemIds = itemIds;
      }
      await details.save();
      finalItemIds = itemIds !== undefined ? itemIds : details.itemIds;
    }

    if (finalItemIds && finalItemIds.length > 0) {
      const Item = require("../models/Item");
      const InventoryTransaction = require("../models/Inventory_transaction");

      const itemsToConsume = await Item.find({ _id: { $in: finalItemIds } });

      if (itemsToConsume.length > 0) {
        await Item.updateMany(
          { _id: { $in: finalItemIds } },
          { $set: { status: 'sold' } }
        );

        const newTransaction = new InventoryTransaction({
          storeId: order.storeId,
          transactionType: "REPAIR_CONSUMPTION",
          referenceType: "RepairOrder",
          referenceId: order._id,
          quantity: itemsToConsume.length,
          note: `Xuất kho ${itemsToConsume.length} linh kiện cho Đơn sửa chữa #${order._id.toString().substring(order._id.toString().length - 6).toUpperCase()}`,
          createdBy: req.user?.id || req.user?._id || order.createdBy
        });
        
        await newTransaction.save();
      }
    }
    
    res.status(200).json({ message: "Đơn sửa chữa đã được hoàn thành", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRepairOrder = async (req, res) => {
  try {
    const { storeId, customerName, customerPhone, repairServiceId, technicianId, customerNote, createdBy } = req.body;

    if (!storeId || !customerName || !createdBy) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    const newRepairOrder = new RepairOrder({
      storeId,
      customerName,
      customerPhone: customerPhone || "",
      totalPrice: 0,
      createdBy,
      status: "Pending",
      technicianId: null
    });

    await newRepairOrder.save();

    const newRepairOrderDetail = new RepairOrderDetail({
        repairOrderId: newRepairOrder._id,
        serviceId: [repairServiceId],
        itemIds: [],
        type: "REPAIR",
        targetPhoneId: null,
        isInternal: false,
        note: customerNote || ""
      });

    await newRepairOrderDetail.save();

    const populatedOrder = await RepairOrder.findById(newRepairOrder._id)
      .populate("storeId", "name code")
      .populate("createdBy", "fullName");

    res.status(201).json({
      message: "Đã tạo đơn sửa chữa thành công",
      data: populatedOrder
    });
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
  createRepairOrder,
};