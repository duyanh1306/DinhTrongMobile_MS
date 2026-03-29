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

        if (!fromStoreId || !toStoreId || !requestedBy) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: fromStoreId, toStoreId, requestedBy"
            });
        }

        if (fromStoreId === toStoreId) {
            return res.status(400).json({
                success: false,
                message: "Cửa hàng đến và đi phải khác nhau"
            });
        }

        const transferRequest = new TransferRequest({
            fromStoreId,
            toStoreId,
            requestedBy,
            status: "PENDING",
            note: note || "",
            itemType: Array.isArray(itemType) ? itemType : []
        });

        const savedRequest = await transferRequest.save();

        const transferRequestDetail = new TransferRequestDetail({
            transferRequestId: savedRequest._id,
            itemId: [],
            phoneId: [],
            status: "PENDING",
            note: note || ""
        });

        const savedDetail = await transferRequestDetail.save();

        const populatedRequest = await TransferRequest.findById(savedRequest._id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        res.status(201).json({
            success: true,
            message: "Transfer request created successfully",
            data: populatedRequest,
            detail: savedDetail
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Tạo yêu cầu chuyển kho tự động cho repair order
const createTransferRequestForRepairOrder = async (repairOrderId, selectedItems, currentStoreId, requestedBy) => {
    try {
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

        for (const [fromStoreId, items] of Object.entries(itemsByStore)) {
            const transferRequest = new TransferRequest({
                fromStoreId,
                toStoreId: currentStoreId,
                requestedBy,
                status: "PENDING",
                note: `Tự động tạo cho đơn sửa chữa #${repairOrderId}`
            });

            const savedRequest = await transferRequest.save();

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
                message: "Không tìm thấy yêu cầu vận chuyển"
            });
        }

        res.status(200).json(transferRequest);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const approveTransferRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user?._id || req.user?.id;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu vận chuyển"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Yêu cầu vận chuyển phải trong trạng thái Chờ để được duyệt"
            });
        }

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
            message: "Yêu cầu vận chuyển đã duyệt",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const rejectTransferRequest = async (req, res) => {
    try {
        const {id} = req.params;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu vận chuyển"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Yêu cầu vận chuyển phải trong trạng thái Chờ để từ chối"
            });
        }

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
            message: "Yêu cầu vận chuyển đã từ chối",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const confirmShipment = async (req, res) => {
    try {
        const {id} = req.params;
        const {note, items} = req.body;
        const userId = req.user?._id || req.user?.id;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu vận chuyển"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "APPROVED") {
            return res.status(400).json({
                success: false,
                message: "Yêu cầu vận chuyển phải trong trạng thái Duyệt để xác nhận vận chuyển"
            });
        }

        if (note !== undefined) {
            transferRequest.note = note;
        }

        transferRequest.status = "IN PROGRESS";
        transferRequest.approvedBy = userId;
        await transferRequest.save();

        const TransferRequestDetail = require("../models/Transfer_request_detail");
        
        if (items && items.length > 0) {
            let existingDetails = await TransferRequestDetail.findOne({transferRequestId: id});
            
            if (existingDetails) {
                existingDetails.itemId = items.map(item => item.id);
                if (note !== undefined) {
                    existingDetails.note = note;
                }
                existingDetails.status = "IN PROGRESS";
                await existingDetails.save();
            } else {
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
            message: "Vận chuyển thành công",
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
                message: "Không tìm thấy yêu cầu vận chuyển"
            });
        }

        if (transferRequest.status?.toUpperCase() !== "IN PROGRESS") {
            return res.status(400).json({
                success: false,
                message: "Yêu cầu vận chuyện phải trong trạng thái Đang vận chuyển để xác nhận"
            });
        }

        transferRequest.status = "COMPLETED";
        await transferRequest.save();

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
