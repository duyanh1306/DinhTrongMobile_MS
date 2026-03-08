// controllers/purchase_orderController.js
const mongoose = require("mongoose");
const PurchaseOrder = require("../models/Purchase_order");
const PurchaseOrderDetail = require("../models/Purchase_order_detail");
const Phone = require("../models/Phone");
const Item = require("../models/Item");
const InventoryTransaction = require("../models/Inventory_transaction");
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
        path: "phoneId",
        populate: { path: "phoneModelId", select: "name" }
      })

      .populate({
        path: "itemId",
        populate: { path: "item_type", select: "name price" }
      })

      .populate({
        path: "items.itemId",
        populate: { path: "item_type", select: "name price" }
      });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const { storeId, customerName, customerPhone, totalPrice, createdBy, orderType, details } = req.body;

    const newOrder = new PurchaseOrder({
      storeId,
      customerName,
      customerPhone,
      totalPrice,
      createdBy,
      orderType,
      status: "Pending",
      purchaseOrderDate: new Date()
    });

    const savedOrder = await newOrder.save();

    for (const item of details) {
      const detailData = {
        purchaseOrderId: savedOrder._id,
        note: item.note || "",
        warranty: item.warranty || true
      };
      
      if (item.price !== undefined) detailData.purchasePrice = item.price;
      if (item.phoneId) detailData.phoneId = item.phoneId;
      if (item.itemId) detailData.itemId = item.itemId;

      const orderDetail = new PurchaseOrderDetail(detailData);
      await orderDetail.save();

      const newStatus = orderType === "SALE" ? "sold" : "in_stock";
      if (item.phoneId) await Phone.findByIdAndUpdate(item.phoneId, { status: newStatus });
      if (item.itemId) await Item.findByIdAndUpdate(item.itemId, { status: newStatus });
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, errorDetails: error.stack });
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

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status: "Completed" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const details = await PurchaseOrderDetail.find({ purchaseOrderId: id });

    for (const detail of details) {
      const isSale = updatedOrder.orderType === "SALE";
      const newStatus = isSale ? "sold" : "in_stock";

      // 1. Cập nhật trạng thái sản phẩm
      if (detail.phoneId) {
        await Phone.findByIdAndUpdate(detail.phoneId, { status: newStatus });
      }
      if (detail.itemId) {
        await Item.findByIdAndUpdate(detail.itemId, { status: newStatus });
      }

      // 2. Tạo Inventory Transaction chuẩn theo schema DB
      const transactionData = {
        storeId: updatedOrder.storeId,
        transactionType: isSale ? "OUTBOUND" : "INBOUND",
        referenceType: isSale ? "SaleOrder" : "PurchaseOrder",
        referenceId: updatedOrder._id,
        phoneId: detail.phoneId || undefined,
        itemId: detail.itemId || undefined,
        note: isSale ? "Xuất bán máy cho khách hàng" : "Nhập hàng từ khách/nhà cung cấp"
      };

      const newTransaction = new InventoryTransaction(transactionData);
      await newTransaction.save();
    }

    res.status(200).json({ success: true, message: "Xác nhận thành công", data: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getOrderDetailsById,
  createPurchaseOrder,
  getOrdersByCustomer,
  confirmPayment,
};