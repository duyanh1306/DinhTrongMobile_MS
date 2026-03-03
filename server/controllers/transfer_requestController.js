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
          { path: "itemTypeId", select: "name" }
        ]
      });

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTransferRequests,
  getTransferRequestDetailsById,
};