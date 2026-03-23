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
            .populate("itemType.itemTypes", "name")
            .sort({createdAt: -1});

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Lấy chi tiết của 1 yêu cầu
const getTransferRequestDetailsById = async (req, res) => {
    try {
        const {id} = req.params;

        const details = await TransferRequestDetail.find({transferRequestId: id})
            .populate({
                path: "itemId",
                select: "serialCode item_type itemTypeId",
                populate: [
                    {path: "item_type", select: "name"},
                    // { path: "itemTypeId", select: "name" }
                ]
            });

        res.status(200).json(details);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Tạo yêu cầu chuyển kho mới
const createTransferRequest = async (req, res) => {
    try {
        const {fromStoreId, toStoreId, requestedBy, items, itemType, note} = req.body;

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
            note: note || "",
            itemType: Array.isArray(itemType) ? itemType : []
        });

        const savedRequest = await transferRequest.save();

        // Create transfer request details
        const details = items.map(item => ({
            transferRequestId: savedRequest._id,
            itemId: [item?.itemId || item],
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

const getTransferRequestById = async (req, res) => {
    try {
        const {id} = req.params;

        const transferRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        res.status(200).json(transferRequest);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Duyệt yêu cầu chuyển kho
const approveTransferRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user?._id || req.user?.id;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Transfer request must be in PENDING status to approve"
            });
        }

        // Update status to APPROVED and set approvedBy
        transferRequest.status = "APPROVED";
        transferRequest.approvedBy = userId;
        await transferRequest.save();

        const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        res.status(200).json({
            success: true,
            message: "Transfer request approved successfully",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Từ chối yêu cầu chuyển kho
const rejectTransferRequest = async (req, res) => {
    try {
        const {id} = req.params;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Transfer request must be in PENDING status to reject"
            });
        }

        // Update status to REJECTED
        transferRequest.status = "REJECTED";
        await transferRequest.save();

        const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        res.status(200).json({
            success: true,
            message: "Transfer request rejected successfully",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Xác nhận gửi hàng (từ cửa hàng gửi)
const confirmShipment = async (req, res) => {
    try {
        const {id} = req.params;
        const {note, items} = req.body; // Get note and items from request body
        const userId = req.user?._id || req.user?.id;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "Transfer request must be in APPROVED status to confirm shipment"
            });
        }

        // Update note if provided
        if (note !== undefined) {
            transferRequest.note = note;
        }

        // Update status to IN PROGRESS and set approvedBy
        transferRequest.status = "IN PROGRESS";
        transferRequest.approvedBy = userId;
        await transferRequest.save();

        // Create or update transfer request details with the items
        const TransferRequestDetail = require("../models/Transfer_request_detail");
        
        if (items && items.length > 0) {
            // Check if details already exist
            let existingDetails = await TransferRequestDetail.findOne({transferRequestId: id});
            
            if (existingDetails) {
                // Update existing details
                existingDetails.itemId = items.map(item => item.id);
                if (note !== undefined) {
                    existingDetails.note = note;
                }
                existingDetails.status = "IN PROGRESS";
                await existingDetails.save();
            } else {
                // Create new details
                await TransferRequestDetail.create({
                    transferRequestId: id,
                    itemId: items.map(item => item.id),
                    note: note || "",
                    status: "IN PROGRESS"
                });
            }
        }

        const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        res.status(200).json({
            success: true,
            message: "Shipment confirmed successfully",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Xác nhận nhận hàng (từ cửa hàng nhận)
const confirmReceipt = async (req, res) => {
    try {
        const {id} = req.params;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "IN PROGRESS") {
            return res.status(400).json({
                success: false,
                message: "Transfer request must be in IN PROGRESS status to confirm receipt"
            });
        }

        // Update status to COMPLETED
        transferRequest.status = "COMPLETED";
        await transferRequest.save();

        // Update all items' storeId to the receiving store
        const TransferRequestDetail = require("../models/Transfer_request_detail");
        const Item = require("../models/Item");

        const details = await TransferRequestDetail.find({transferRequestId: id});

        for (const detail of details) {
            if (detail.itemId) {
                await Item.updateMany(
                    {_id: {$in: detail.itemId}},
                    {storeId: transferRequest.toStoreId}
                );
            }
        }

        const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        res.status(200).json({
            success: true,
            message: "Receipt confirmed successfully",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

module.exports = {
    getAllTransferRequests,
    getTransferRequestDetailsById,
    createTransferRequest,
    createTransferRequestForRepairOrder,
    getTransferRequestById,
    confirmShipment,
    confirmReceipt,
    approveTransferRequest,
    rejectTransferRequest
};
