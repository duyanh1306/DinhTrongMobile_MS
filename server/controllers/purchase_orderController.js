const mongoose = require("mongoose");
const Purchase_order = require("../models/Purchase_order");
const Purchase_order_detail = require("../models/Purchase_order_detail");
const Phone = require("../models/Phone");
const Item = require("../models/Item");
const InventoryTransaction = require("../models/Inventory_transaction");
const InventoryTransactionDetail = require("../models/Inventory_transaction_detail"); 
const Store = require("../models/Store");

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

const getPurchaseOrdersForManagerStore = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const store = await Store.findOne({ staff: userId });
    if (!store) {
      return res.status(200).json([]);
    }

    const purchase_orders = await Purchase_order.find({
      storeId: store._id,
    })
      .populate("storeId", "name code")
      .populate("createdBy", "fullName name username")
      .populate({
        path: "tempPhoneData.phoneModelId",
        select: "name",
      })
      .sort({ purchaseOrderDate: -1 });

    res.status(200).json(purchase_orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    console.error(" LỖI TẠO ĐƠN HÀNG:", error);
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

    const orderToConfirm = await Purchase_order.findById(id);
    if (!orderToConfirm) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const isSale = orderToConfirm.orderType === "SALE";

    if (!isSale && orderToConfirm.tempPhoneData && orderToConfirm.tempPhoneData.phoneModelId) {
      const existingDetail = await Purchase_order_detail.findOne({ purchaseOrderId: id });

      if (!existingDetail) {
        const tempPhoneData = orderToConfirm.tempPhoneData;
        const autoSerialCode = `PH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;

        const newPhone = new Phone({
          serialCode: autoSerialCode, 
          phoneModelId: tempPhoneData.phoneModelId,
          storeId: orderToConfirm.storeId,
          importPrice: Number(orderToConfirm.totalPrice),
          sellingPrice: 0,
          status: "waiting_for_tech_decision", 
          source: "customer_trade_in",
          capacity: tempPhoneData.capacity || "Chưa rõ",
          colorName: tempPhoneData.colorName || "Chưa rõ",
          ram: tempPhoneData.ram || "Chưa rõ", // <-- FIX SÓT RAM CỦA TAO NHÉ
          grade: "Cũ Đẹp",
          notes: orderToConfirm.note,
          checklistData: orderToConfirm.checklistData // <-- FIX: ĐEM CHECKLIST SANG BẢNG PHONE
        });
        
        const savedPhone = await newPhone.save();

        const newDetail = new Purchase_order_detail({
          purchaseOrderId: orderToConfirm._id,
          phoneId: savedPhone._id,
          purchasePrice: Number(orderToConfirm.totalPrice),
          type: "PHONE",
          note: orderToConfirm.note, 
        });
        await newDetail.save();
      }
    }

    const updatedOrder = await Purchase_order.findByIdAndUpdate(
      id,
      { status: "Completed" },
      { new: true }
    );

    const details = await Purchase_order_detail.find({ purchaseOrderId: id });

    const newTransaction = new InventoryTransaction({
        storeId: updatedOrder.storeId,
        transactionType: isSale ? "OUTBOUND" : "INBOUND", 
        referenceType: isSale ? "SALE_ORDER" : "PURCHASE_ORDER",
        referenceId: updatedOrder._id,
        totalItems: details.length,
        note: isSale ? `Xuất kho bán cho khách: ${updatedOrder.customerName}` : `Nhập kho thu mua máy của khách`
    });
    await newTransaction.save();

    const transactionDetails = [];

    for (const detail of details) {
      const newStatus = isSale ? "sold" : "waiting_for_tech_decision";

      if (detail.phoneId) {
        await Phone.findByIdAndUpdate(detail.phoneId, { status: newStatus });
      }
      if (detail.itemId) {
        await Item.findByIdAndUpdate(detail.itemId, { status: newStatus });
      }

      transactionDetails.push({
        transactionId: newTransaction._id,
        phoneId: detail.phoneId || null,
        itemId: detail.itemId || null,
        quantity: 1,
        note: isSale ? "Bán ra" : "Thu mua vào"
      });
    }

    if (transactionDetails.length > 0) {
      await InventoryTransactionDetail.insertMany(transactionDetails);
    }

    res.status(200).json({
        success: true,
        message: "Xác nhận thành công & Đã tạo máy vào kho",
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
    const { totalPrice, status, note, tempPhoneData, checklistData } = req.body; // <-- NHẬN CHECKLIST

    const order = await Purchase_order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (status === "Cancelled") {
      const details = await Purchase_order_detail.find({ purchaseOrderId: id });
      const phoneIds = details.filter((d) => d.phoneId).map((d) => d.phoneId);
      const itemIds = details.filter((d) => d.itemId).map((d) => d.itemId);

      if (order.orderType === "SALE") {
        if (phoneIds.length > 0) await Phone.updateMany({ _id: { $in: phoneIds } }, { status: "in_stock" });
        if (itemIds.length > 0) await Item.updateMany({ _id: { $in: itemIds } }, { status: "in_stock" });
      } else if (order.orderType === "PURCHASE") {
        if (phoneIds.length > 0) await Phone.deleteMany({ _id: { $in: phoneIds } });
      }
    }

    order.totalPrice = totalPrice !== undefined ? Number(totalPrice) : order.totalPrice;
    order.status = status;
    order.note = note !== undefined ? note : order.note;
    
    if (tempPhoneData) {
        order.tempPhoneData = tempPhoneData;
        order.markModified('tempPhoneData');
    }
    
    if (checklistData) { // <-- LƯU VÀO DB
        order.checklistData = checklistData;
    }

    await order.save();

    res.status(200).json({ message: "Cập nhật thành công", data: order });
  } catch (error) {
    console.log(" Lỗi UPDATE Purchase Order:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrdersForManagerStore,
  getOrderDetailsById,
  createPurchaseOrder,
  getOrdersByCustomer,
  confirmPayment,
  updatePurchaseOrder,
};