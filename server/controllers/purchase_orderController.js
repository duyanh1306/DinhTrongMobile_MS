// controllers/purchase_orderController.js
const PurchaseOrder = require("../models/Purchase_order");
const PurchaseOrderDetail = require("../models/Purchase_order_detail");

const getAllPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ purchaseOrderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getOrderDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await PurchaseOrderDetail.find({ purchaseOrderId: id })
      .populate({
        path: "itemId",
        populate: { path: "item_type", select: "name price" } 
      })
      .populate({
        path: "phoneId", 
        populate: { path: "phoneModelId", select: "name" } 
      });
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const { storeId, customerName, customerPhone, totalPrice, createdBy, orderType, status, details } = req.body;

    const newOrder = new PurchaseOrder({
      storeId,
      customerName,
      customerPhone,
      totalPrice,
      createdBy,
      orderType,
      status: status || "Completed",
      purchaseOrderDate: new Date()
    });
    const savedOrder = await newOrder.save();

    if (details && details.length > 0) {
      const orderDetailsToSave = details.map(detail => ({
        purchaseOrderId: savedOrder._id,
        itemId: detail.itemId,
        warranty: detail.warranty,
        note: detail.note,
        warrantyExpireDate: detail.warrantyExpireDate
      }));
      await PurchaseOrderDetail.insertMany(orderDetailsToSave);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getOrdersByCustomer = async (req, res) => {
  try {
    const { identifier } = req.params; // identifier có thể là số điện thoại hoặc ID
    
    // Tìm các đơn hàng khớp với số điện thoại khách hàng
    const orders = await PurchaseOrder.find({ customerPhone: identifier })
      .populate("storeId", "name code")
      .sort({ purchaseOrderDate: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getOrderDetailsById,
  createPurchaseOrder,
  getOrdersByCustomer
};