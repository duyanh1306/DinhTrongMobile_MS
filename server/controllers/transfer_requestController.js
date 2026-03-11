const TransferRequest = require("../models/Transfer_request");
const TransferRequestDetail = require("../models/Transfer_request_detail");

// Lấy tất cả yêu cầu chuyển kho
const getAllTransferRequests = async (req, res) => {
  try {
    const requests = await TransferRequest.find()
      .populate("fromStoreId", "name code")
      .populate("toStoreId", "name code")
      .populate("requestedBy", "fullName")
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết của 1 yêu cầu
const getTransferRequestDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const details = await TransferRequestDetail.find({ transferRequestId: id })
      .populate({
        path: "itemId",
        select: "serialCode item_type itemTypeId",
        populate: [
          { path: "item_type", select: "name" },
          // { path: "itemTypeId", select: "name" }
        ]
      });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo yêu cầu chuyển kho mới
const createTransferRequest = async (req, res) => {
  try {
    const { fromStoreId, toStoreId, requestedBy, items, note } = req.body;

    // Validate required fields
    if (!fromStoreId || !toStoreId || !requestedBy || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: fromStoreId, toStoreId, requestedBy, items"
      });
    }

    // Check if fromStore and toStore are different
    if (fromStoreId === toStoreId) {
      return res.status(400).json({
        success: false,
        message: "From store and to store must be different"
      });
    }

    // Create transfer request
    const transferRequest = new TransferRequest({
      fromStoreId,
      toStoreId,
      requestedBy,
      status: "PENDING",
      note: note || ""
    });

    const savedRequest = await transferRequest.save();

    // Create transfer request details
    const details = items.map(item => ({
      transferRequestId: savedRequest._id,
      itemId: item.itemId,
      status: "PENDING",
      note: item.note || ""
    }));

    const savedDetails = await TransferRequestDetail.insertMany(details);

    // Populate and return the complete request
    const populatedRequest = await TransferRequest.findById(savedRequest._id)
        .populate("fromStoreId", "name code")
        .populate("toStoreId", "name code")
        .populate("requestedBy", "fullName");

    res.status(201).json({
      success: true,
      message: "Transfer request created successfully",
      data: populatedRequest,
      details: savedDetails
    });
  } catch (error) {
    console.error("Error creating transfer request:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Tạo yêu cầu chuyển kho tự động cho repair order
const createTransferRequestForRepairOrder = async (repairOrderId, selectedItems, currentStoreId, requestedBy) => {
  try {
    // Group items by their store
    const itemsByStore = {};

    selectedItems.forEach(item => {
      const itemStoreId = item.storeId?._id || item.storeId;
      if (itemStoreId && itemStoreId !== currentStoreId) {
        if (!itemsByStore[itemStoreId]) {
          itemsByStore[itemStoreId] = [];
        }
        itemsByStore[itemStoreId].push(item);
      }
    });

    const transferRequests = [];

    // Create transfer request for each store
    for (const [fromStoreId, items] of Object.entries(itemsByStore)) {
      const transferRequest = new TransferRequest({
        fromStoreId,
        toStoreId: currentStoreId,
        requestedBy,
        status: "PENDING",
        note: `Tự động tạo cho đơn sửa chữa #${repairOrderId}`
      });

      const savedRequest = await transferRequest.save();

      // Create transfer request details
      const details = items.map(item => ({
        transferRequestId: savedRequest._id,
        itemId: item._id,
        status: "PENDING",
        note: `Linh kiện: ${item.name} (${item.serialCode})`
      }));

      const savedDetails = await TransferRequestDetail.insertMany(details);

      const populatedRequest = await TransferRequest.findById(savedRequest._id)
          .populate("fromStoreId", "name code")
          .populate("toStoreId", "name code")
          .populate("requestedBy", "fullName");

      transferRequests.push({
        request: populatedRequest,
        details: savedDetails
      });
    }

    return transferRequests;
  } catch (error) {
    console.error("Error creating automatic transfer requests:", error);
    throw error;
  }
};

module.exports = {
  getAllTransferRequests,
  getTransferRequestDetailsById,
  createTransferRequest,
  createTransferRequestForRepairOrder
};