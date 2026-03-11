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
      storeId,
      customerName,
      customerPhone,
      totalPrice,
      createdBy,
      orderType,
      status,
      details,
      note,
      tempPhoneData,
    } = req.body;

    const newOrder = new Purchase_order({
      storeId,
      customerName,
      customerPhone,
      totalPrice,
      createdBy,
      orderType,
      status,
      note,
      tempPhoneData,
    });

    const savedOrder = await newOrder.save();

    if (details && details.length > 0) {
      for (const item of details) {
        const detailData = {
          purchaseOrderId: savedOrder._id,
          note: item.note || "",
          warranty: item.warranty || true,
        };

        if (item.price !== undefined) detailData.purchasePrice = item.price;
        if (item.phoneId) detailData.phoneId = item.phoneId;
        if (item.itemId) detailData.itemId = item.itemId;

        const orderDetail = new Purchase_order_detail(detailData);
        await orderDetail.save();

        const newStatus = orderType === "SALE" ? "sold" : "in_stock";
        if (item.phoneId)
          await Phone.findByIdAndUpdate(item.phoneId, { status: newStatus });
        if (item.itemId)
          await Item.findByIdAndUpdate(item.itemId, { status: newStatus });
      }
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message,
        errorDetails: error.stack,
      });
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
      { new: true },
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const details = await Purchase_order_detail.find({ purchaseOrderId: id });

    for (const detail of details) {
      const isSale = updatedOrder.orderType === "SALE";
      const newStatus = isSale ? "sold" : "waiting_for_tech_decision";

      if (detail.phoneId) {
        await Phone.findByIdAndUpdate(detail.phoneId, { status: newStatus });
      }
      if (detail.itemId) {
        await Item.findByIdAndUpdate(detail.itemId, { status: newStatus });
      }

      const transactionData = {
        storeId: updatedOrder.storeId,
        transactionType: isSale ? "OUTBOUND" : "INBOUND",
        referenceType: isSale ? "SaleOrder" : "PurchaseOrder",
        referenceId: updatedOrder._id,
        phoneId: detail.phoneId || undefined,
        itemId: detail.itemId || undefined,
        note: isSale
          ? "Xuất bán máy cho khách hàng"
          : "Nhập hàng từ khách/nhà cung cấp chờ Kỹ thuật duyệt",
      };

      const newTransaction = new InventoryTransaction(transactionData);
      await newTransaction.save();
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Xác nhận thành công",
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

    if (status === "Cancelled" && order.orderType === "SALE") {
      const details = await Purchase_order_detail.find({ purchaseOrderId: id });

      const phoneIds = details.filter((d) => d.phoneId).map((d) => d.phoneId);
      const itemIds = details.filter((d) => d.itemId).map((d) => d.itemId);

      if (phoneIds.length > 0) {
        await Phone.updateMany(
          { _id: { $in: phoneIds } },
          { status: "in_stock" },
        );
      }
      if (itemIds.length > 0) {
        await Item.updateMany(
          { _id: { $in: itemIds } },
          { status: "in_stock" },
        );
      }
    }

    order.totalPrice =
      totalPrice !== undefined ? Number(totalPrice) : order.totalPrice;
    order.status = status;
    order.note = note !== undefined ? note : order.note;
    
    if (tempPhoneData) {
        order.tempPhoneData = tempPhoneData;
    }

    await order.save();

    if (status === "Pending" || status === "Pending_Payment") {
      const existingDetail = await Purchase_order_detail.findOne({
        purchaseOrderId: id,
      });

      if (!existingDetail && order.tempPhoneData && order.tempPhoneData.imei) {
        const newPhone = new Phone({
          imei: order.tempPhoneData.imei,
          phoneModelId: order.tempPhoneData.phoneModelId,
          storeId: order.storeId,
          importPrice: Number(totalPrice),
          sellingPrice: 0,
          status: "waiting_for_tech_decision",
          source: "customer_trade_in",
          capacity: "N/A",
          colorName: "Đang cập nhật",
        });
        const savedPhone = await newPhone.save();

        const newDetail = new Purchase_order_detail({
          purchaseOrderId: order._id,
          phoneId: savedPhone._id,
          purchasePrice: Number(totalPrice),
          type: "PHONE",
          note: note,
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