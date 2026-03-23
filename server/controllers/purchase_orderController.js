// 3. Backend - controllers/purchase_orderController.js
const mongoose = require("mongoose");
const Purchase_order = require("../models/Purchase_order");
const Purchase_order_detail = require("../models/Purchase_order_detail");
const Phone = require("../models/Phone");
const Item = require("../models/Item");
const InventoryTransaction = require("../models/Inventory_transaction");

const getAllPurchaseOrders = async (req, res) => {
  try {
    const { orderType, status } = req.query;
    let query = {};
    if (orderType) query.orderType = orderType;
    if (status) query.status = status;

    const purchase_orders = await Purchase_order.find(query)
      .populate("storeId", "name code")
      .populate("createdBy", "fullName name username")
      .populate({
        path: "tempPhoneData.phoneModelId",
        select: "name",
      });

    res.status(200).json(purchase_orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrderDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await Purchase_order_detail.find({ purchaseOrderId: id })
      .populate({
        path: "phoneId",
        populate: { path: "phoneModelId", select: "name" },
      })
      .populate({
        path: "itemId",
        populate: { path: "item_type", select: "name price" },
      })
      .populate({
        path: "items.itemId",
        populate: { path: "item_type", select: "name price" },
      });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const {
      storeId, customerName, customerPhone, totalPrice, createdBy,
      orderType, status, details, note, tempPhoneData,
    } = req.body;

    // 1. CHẶN LỖI THIẾU CỬA HÀNG
    if (!storeId || storeId === "undefined" || storeId === "null") {
        return res.status(400).json({ 
            success: false,
            message: "Tài khoản của bạn chưa được gắn vào Cửa hàng nào. Vui lòng liên hệ Admin và Đăng nhập lại!" 
        });
    }

    const newOrder = new Purchase_order({
      storeId, customerName, customerPhone, totalPrice: Number(totalPrice) || 0, createdBy,
      orderType, status: status || "Pending", note: note || "", tempPhoneData: tempPhoneData || null,
    });

    const savedOrder = await newOrder.save();

    if (details && Array.isArray(details) && details.length > 0) {
      const detailPromises = details.map(async (item) => {
        const detailData = {
          purchaseOrderId: savedOrder._id,
          note: item.note || "",
          warranty: item.warranty !== undefined ? item.warranty : true,
          type: item.phoneId ? "PHONE" : "ITEM",
          purchasePrice: item.price ? Number(item.price) : 0
        };

        if (item.phoneId) detailData.phoneId = item.phoneId;
        if (item.itemId) detailData.itemId = item.itemId;

        const orderDetail = new Purchase_order_detail(detailData);
        await orderDetail.save();

        if (orderType === "SALE") {
          if (item.phoneId) await Phone.findByIdAndUpdate(item.phoneId, { status: "sold" });
          if (item.itemId) await Item.findByIdAndUpdate(item.itemId, { status: "sold" });
        }
      });
      await Promise.all(detailPromises);
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    console.error("🔥 LỖI TẠO ĐƠN HÀNG:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const getOrdersByCustomer = async (req, res) => {
  try {
    const { identifier } = req.params;

    const orders = await Purchase_order.find({ customerPhone: identifier })
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

    const updatedOrder = await Purchase_order.findByIdAndUpdate(
      id,
      { status: "Completed" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const details = await Purchase_order_detail.find({ purchaseOrderId: id });

    // Tạo mảng lưu log giao dịch
    const transactionLogs = [];

    for (const detail of details) {
      const isSale = updatedOrder.orderType === "SALE";
      // Bán ra -> Xuất (sold). Mua vào -> Chờ Tech (waiting_for_tech_decision)
      const newStatus = isSale ? "sold" : "waiting_for_tech_decision";

      if (detail.phoneId) {
        await Phone.findByIdAndUpdate(detail.phoneId, { status: newStatus });
      }
      if (detail.itemId) {
        await Item.findByIdAndUpdate(detail.itemId, { status: newStatus });
      }

      // Chuẩn bị dữ liệu ghi Log
      transactionLogs.push({
        storeId: updatedOrder.storeId,
        transactionType: isSale ? "OUTBOUND" : "INBOUND", // Bán -> XUẤT, Mua -> NHẬP
        referenceType: isSale ? "SALE_ORDER" : "PURCHASE_ORDER",
        referenceId: updatedOrder._id,
        phoneId: detail.phoneId || undefined,
        itemId: detail.itemId || undefined,
        note: isSale ? `Xuất kho bán cho khách: ${updatedOrder.customerName}` : `Nhập kho thu mua máy của khách`
      });
    }

    // Insert một lượt toàn bộ log vào DB
    if (transactionLogs.length > 0) {
      await InventoryTransaction.insertMany(transactionLogs);
    }

    res.status(200).json({
        success: true,
        message: "Xác nhận thành công & Đã ghi log kho",
        data: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPrice, status, note, tempPhoneData } = req.body;

    const order = await Purchase_order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // XỬ LÝ KHI ĐƠN BỊ HỦY
    if (status === "Cancelled") {
      const details = await Purchase_order_detail.find({ purchaseOrderId: id });
      const phoneIds = details.filter((d) => d.phoneId).map((d) => d.phoneId);
      const itemIds = details.filter((d) => d.itemId).map((d) => d.itemId);

      if (order.orderType === "SALE") {
        // Đơn bán ra bị hủy -> Trả hàng lại kho
        if (phoneIds.length > 0) await Phone.updateMany({ _id: { $in: phoneIds } }, { status: "in_stock" });
        if (itemIds.length > 0) await Item.updateMany({ _id: { $in: itemIds } }, { status: "in_stock" });
      } else if (order.orderType === "PURCHASE") {
        // Đơn thu mua bị hủy (Khách chê giá rẻ không bán nữa) -> Xóa luôn cái điện thoại vừa tạo ảo
        if (phoneIds.length > 0) await Phone.deleteMany({ _id: { $in: phoneIds } });
      }
    }

    order.totalPrice = totalPrice !== undefined ? Number(totalPrice) : order.totalPrice;
    order.status = status;
    order.note = note !== undefined ? note : order.note;
    
    if (tempPhoneData) {
        order.tempPhoneData = tempPhoneData;
    }

    await order.save();

    // XỬ LÝ KHI TECH CHỐT GIÁ (Tạo máy vào kho chờ)
    if (status === "Pending" || status === "Pending_Payment") {
      const existingDetail = await Purchase_order_detail.findOne({
        purchaseOrderId: id,
      });

      // KHÔNG check IMEI nữa, check phoneModelId
      if (!existingDetail && order.tempPhoneData && order.tempPhoneData.phoneModelId) {
        const newPhone = new Phone({
          phoneModelId: order.tempPhoneData.phoneModelId,
          storeId: order.storeId,
          importPrice: Number(totalPrice),
          sellingPrice: 0,
          status: "waiting_for_tech_decision",
          source: "customer_trade_in",
          capacity: order.tempPhoneData.capacity || "N/A",
          colorName: order.tempPhoneData.colorName || "Đang cập nhật",
        });
        const savedPhone = await newPhone.save();

        const newDetail = new Purchase_order_detail({
          purchaseOrderId: order._id,
          phoneId: savedPhone._id,
          purchasePrice: Number(totalPrice),
          type: "PHONE",
          note: note, // Ghi chú báo cáo tình trạng máy sẽ lưu vào đây
        });
        await newDetail.save();
      }
    }

    res.status(200).json({ message: "Cập nhật thành công", data: order });
  } catch (error) {
    console.log("Lỗi UPDATE Purchase Order:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getOrderDetailsById,
  createPurchaseOrder,
  getOrdersByCustomer,
  confirmPayment,
  updatePurchaseOrder,
};