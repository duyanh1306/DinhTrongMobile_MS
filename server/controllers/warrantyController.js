const Warranty = require("../models/Warranty");
const Phone = require("../models/Phone");
const RepairOrder = require("../models/Repair_order");
const RepairOrderDetail = require("../models/Repair_order_detail");
const mongoose = require("mongoose");

const getAllWarrantyRequests = async (req, res) => {
  try {
    const { status, storeId } = req.query;
    
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
    
    let query = Warranty.find();
    
    if (userStoreId) {
      query = query.where({ storeId: userStoreId });
    } else if (storeId && storeId !== 'ALL') {
      query = query.where({ storeId: storeId });
    }
    
    if (status && status !== 'ALL') {
      query = query.where({ status: status });
    }
    
    const warranties = await query
      .populate("storeId", "name code")
      .populate("phoneId", "serialCode colorName capacity")
      .populate("createdBy", "fullName")
      .populate("processedBy", "fullName")
      .populate("repairOrderId", "customerName status")
      .sort({ createdAt: -1 });

    res.status(200).json(warranties);
  } catch (error) {
    console.error('Error in getAllWarrantyRequests:', error);
    res.status(500).json({ error: error.message });
  }
};

const getWarrantyRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warranty = await Warranty.findById(id)
      .populate("storeId", "name code")
      .populate("phoneId", "serialCode colorName capacity")
      .populate("createdBy", "fullName")
      .populate("processedBy", "fullName")
      .populate("repairOrderId", "customerName status");

    if (!warranty) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu bảo hành" });
    }

    res.status(200).json(warranty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createWarrantyRequest = async (req, res) => {
  try {
    const { 
      storeId, 
      customerName, 
      customerPhone, 
      phoneId, 
      phoneModel, 
      serialCode, 
      purchaseDate, 
      issueDescription,
      createdBy 
    } = req.body;
    if (!storeId || !customerName || !phoneModel || !serialCode || !purchaseDate || !issueDescription || !createdBy) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    const purchaseDateTime = new Date(purchaseDate);
    const now = new Date();
    const daysSincePurchase = Math.floor((now - purchaseDateTime) / (1000 * 60 * 60 * 24));
    
    let isNewDevice = false;
    let notes = `Máy tự ráp/Linh kiện (Nguồn: Không xác định). Đã mua ${daysSincePurchase} ngày. Bảo hành sửa chữa.`;


    if (phoneId) {
      const phone = await Phone.findById(phoneId);
      if (phone) {
        isNewDevice = phone.source === 'supplier';
        notes = isNewDevice
          ? `Máy mới chính hãng (Nguồn: Nhập từ NCC). Đã mua ${daysSincePurchase} ngày. Bảo hành sửa chữa.`
          : `Máy cũ/Lắp ráp (Nguồn: ${phone.source === 'assembled' ? 'Tự ráp' : 'Thu cũ'}). Đã mua ${daysSincePurchase} ngày. Bảo hành sửa chữa.`;
      }
    }

    const warrantyType = "REPAIR";

    const newWarranty = new Warranty({
      storeId,
      customerName,
      customerPhone: customerPhone || "",
      phoneId: phoneId || null,
      phoneModel,
      serialCode,
      purchaseDate: purchaseDateTime,
      issueDescription,
      isNewDevice,
      warrantyType,
      status: "Pending",
      createdBy,
      notes: notes
    });

    await newWarranty.save();

    const populatedWarranty = await Warranty.findById(newWarranty._id)
      .populate("storeId", "name code")
      .populate("phoneId", "serialCode colorName capacity")
      .populate("createdBy", "fullName");

    res.status(201).json({
      message: "Đã tạo yêu cầu bảo hành thành công",
      data: populatedWarranty
    });
  } catch (error) {
    console.error("Error creating warranty request:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateWarrantyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status } = req.body;
    
    const warranty = await Warranty.findById(id);
    
    if (!warranty) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu bảo hành" });
    }
    
    if (notes !== undefined) {
      warranty.notes = notes;
    }
    
    if (status !== undefined) {
      warranty.status = status;
    }
    
    await warranty.save();
    
    res.status(200).json({ message: "Yêu cầu bảo hành đã được cập nhật", warranty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const processWarrantyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    
    const warranty = await Warranty.findById(id);
    
    if (!warranty) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu bảo hành" });
    }
    
    if (warranty.status !== "Pending") {
      return res.status(400).json({ message: "Chỉ có thể xử lý yêu cầu đang ở trạng thái chờ xử lý" });
    }
    
    if (action !== "repair") {
      return res.status(400).json({
        message: "Chỉ hỗ trợ bảo hành sửa chữa. Vui lòng chọn hành động sửa chữa."
      });
    }
    
    if (action === "repair") {
      const newRepairOrder = new RepairOrder({
        storeId: warranty.storeId,
        customerName: warranty.customerName,
        customerPhone: warranty.customerPhone || "",
        totalPrice: 0,
        createdBy: req.user.id,
        status: "Pending"
      });
      
      await newRepairOrder.save();
      
      const newRepairOrderDetail = new RepairOrderDetail({
        repairOrderId: newRepairOrder._id,
        serviceId: [],
        itemIds: [],
        type: "WARRANTY",
        targetPhoneId: warranty.phoneId || null, 
        isInternal: true,
        note: warranty.issueDescription
      });
      
      await newRepairOrderDetail.save();
      
      warranty.repairOrderId = newRepairOrder._id;
      warranty.status = "In Progress";
      warranty.processedBy = req.user.id;
      warranty.processedAt = new Date();
      warranty.notes = notes || warranty.notes;
      
      await warranty.save();
      
      res.status(200).json({ 
        message: "Đã tạo đơn sửa chữa bảo hành", 
        warranty,
        repairOrderId: newRepairOrder._id
      });
    }
  } catch (error) {
    console.error("Error processing warranty request:", error);
    res.status(500).json({ error: error.message });
  }
};

const completeWarrantyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warranty = await Warranty.findById(id);
    
    if (!warranty) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu bảo hành" });
    }
    
    if (warranty.status === "Completed") {
      return res.status(400).json({ message: "Yêu cầu bảo hành đã hoàn thành" });
    }
    
    if (warranty.status === "Rejected") {
      return res.status(400).json({ message: "Không thể hoàn thành yêu cầu đã bị từ chối" });
    }
    
    if (warranty.status !== "In Progress") {
      return res.status(400).json({ message: "Chỉ có thể hoàn thành yêu cầu đang trong tiến trình" });
    }
    
    warranty.status = "Completed";
    warranty.completedAt = new Date();
    await warranty.save();
    
    res.status(200).json({ message: "Yêu cầu bảo hành đã được hoàn thành", warranty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteWarrantyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warranty = await Warranty.findById(id);
    
    if (!warranty) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu bảo hành" });
    }
    
    if (warranty.status === "In Progress") {
      return res.status(400).json({ message: "Không thể xóa yêu cầu đang trong tiến trình" });
    }
    
    await Warranty.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Yêu cầu bảo hành đã bị xóa" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllWarrantyRequests,
  getWarrantyRequestById,
  createWarrantyRequest,
  updateWarrantyRequest,
  processWarrantyRequest,
  completeWarrantyRequest,
  deleteWarrantyRequest,
};