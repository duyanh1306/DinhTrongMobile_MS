const TransferRequest = require("../models/Transfer_request");
const TransferRequestDetail = require("../models/Transfer_request_detail");
const Store = require("../models/Store");
const User = require("../models/User");
const { sendTransferRequestCreatedEmail, sendTransferRequestApprovedEmail } = require("../utils/sendEmail"); 
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
        const {fromStoreId, toStoreId, requestedBy, itemType, phoneModel, note} = req.body;

        if (!fromStoreId || !toStoreId || !requestedBy) {
            return res.status(400).json({ success: false, message: "Thiếu trường bắt buộc" });
        }

        if (fromStoreId === toStoreId) {
            return res.status(400).json({ success: false, message: "Cửa hàng đến và đi phải khác nhau" });
        }

        const transferRequest = new TransferRequest({
            fromStoreId,
            toStoreId,
            requestedBy,
            status: "PENDING",
            note: note || "",
            itemType: Array.isArray(itemType) ? itemType : [],
            phoneModel: Array.isArray(phoneModel) ? phoneModel : [] // Lưu cả phone model theo mảng mới
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
            .populate("fromStoreId", "name code staff")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName");

       
            try {
                // Populate thêm roleId nếu sau này bạn cần dùng tên role
                const fromStore = await Store.findById(fromStoreId).populate({
                    path: 'staff',
                    populate: { path: 'roleId' } 
                });
                const toStore = await Store.findById(toStoreId);
                
                const managerEmails = fromStore.staff
                    .filter(u => {
                        if (!u || !u.roleId) return false;
                     
                        const roleIdStr = u.roleId._id ? u.roleId._id.toString() : u.roleId.toString();
                    
                        return roleIdStr === '65b900000000000000000005' || roleIdStr === '65b900000000000000000001';
                    })
                    .map(u => u.email)
                    .filter(Boolean); 
    
                console.log("Tìm thấy các Manager email:", managerEmails); 
    
                if (managerEmails.length > 0) {
                    await sendTransferRequestCreatedEmail(managerEmails, savedRequest, fromStore.name, toStore.name);
                }
            } catch (mailError) {
                console.error("Lỗi khi gửi mail thông báo Request:", mailError);
            }

        res.status(201).json({
            success: true,
            message: "Tạo yêu cầu thành công",
            data: populatedRequest,
            detail: savedDetail
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
        }

        if (transferRequest.status?.toUpperCase() !== "PENDING") {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        transferRequest.status = "APPROVED";
        transferRequest.approvedBy = userId;
        transferRequest.approvedAt = new Date();
        await transferRequest.save();

        const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code");

            try {
                const fromStore = await Store.findById(transferRequest.fromStoreId).populate({
                    path: 'staff',
                    populate: { path: 'roleId' }
                });
                const toStore = await Store.findById(transferRequest.toStoreId);
                
                const saleEmails = fromStore.staff
                    .filter(u => {
                        if (!u || !u.roleId) return false;
                        
                        const roleIdStr = u.roleId._id ? u.roleId._id.toString() : u.roleId.toString();
                    
                        return roleIdStr === '65b900000000000000000002';
                    })
                    .map(u => u.email)
                    .filter(Boolean);
    
                console.log("Tìm thấy các Sale email:", saleEmails); 
    
                if (saleEmails.length > 0) {
                    await sendTransferRequestApprovedEmail(saleEmails, transferRequest, fromStore.name, toStore.name);
                }
            } catch (mailError) {
                console.error("Lỗi khi gửi mail báo Sale xuất kho:", mailError);
            }

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
        const {note, items, phones} = req.body; 
        const userId = req.user?._id || req.user?.id;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu vận chuyển" });
        }

        if (transferRequest.status?.toUpperCase() !== "APPROVED") {
            return res.status(400).json({ success: false, message: "Yêu cầu vận chuyển phải trong trạng thái Duyệt để xác nhận vận chuyển" });
        }

        if (note !== undefined) {
            transferRequest.note = note;
        }

        transferRequest.status = "DELIVERING";
        transferRequest.approvedBy = userId;
        await transferRequest.save();

        const TransferRequestDetail = require("../models/Transfer_request_detail");
        // 🌟 GỌI MODEL INVENTORY_TRANSACTION
        const InventoryTransaction = require("../models/Inventory_transaction"); 

        if ((items && items.length > 0) || (phones && phones.length > 0)) {
            let existingDetails = await TransferRequestDetail.findOne({transferRequestId: id});
            
            if (existingDetails) {
                if (items) existingDetails.itemId = items.map(item => item.id);
                if (phones) existingDetails.phoneId = phones.map(phone => phone.id);
                if (note !== undefined) {
                    existingDetails.note = note;
                }
                existingDetails.status = "DELIVERING";
                await existingDetails.save();
            } else {
                await TransferRequestDetail.create({
                    transferRequestId: id,
                    itemId: items ? items.map(item => item.id) : [],
                    phoneId: phones ? phones.map(phone => phone.id) : [],
                    note: note || "",
                    status: "DELIVERING"
                });
            }

            // 🌟 LOGIC TẠO LỊCH SỬ GIAO DỊCH XUẤT KHO (OUTBOUND)
            const transactions = [];

            if (items && items.length > 0) {
                items.forEach(item => {
                    transactions.push({
                        storeId: transferRequest.fromStoreId, // Lấy từ cửa hàng xuất
                        transactionType: "OUTBOUND",
                        referenceType: "TRANSFER_REQUEST",
                        referenceId: transferRequest._id,
                        itemId: item.id,
                        note: "Xuất kho luân chuyển"
                    });
                });
            }

            if (phones && phones.length > 0) {
                phones.forEach(phone => {
                    transactions.push({
                        storeId: transferRequest.fromStoreId, // Lấy từ cửa hàng xuất
                        transactionType: "OUTBOUND",
                        referenceType: "TRANSFER_REQUEST",
                        referenceId: transferRequest._id,
                        phoneId: phone.id,
                        note: "Xuất kho luân chuyển"
                    });
                });
            }

            // Lưu toàn bộ giao dịch vào Database
            if (transactions.length > 0) {
                await InventoryTransaction.insertMany(transactions);
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

const confirmReceipt = async (req, res) => {
    try {
        const { id } = req.params;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu vận chuyển" });
        }
        if (transferRequest.status?.toUpperCase() !== "DELIVERING") {
            return res.status(400).json({ success: false, message: "Yêu cầu vận chuyện phải trong trạng thái Đang vận chuyển để xác nhận" });
        }

        transferRequest.status = "COMPLETED";
        transferRequest.completedAt = new Date();
        await transferRequest.save();

        const TransferRequestDetail = require("../models/Transfer_request_detail");
        const Item = require("../models/Item");
        const Phone = require("../models/Phone");
        const InventoryTransaction = require("../models/Inventory_transaction");

        const details = await TransferRequestDetail.find({ transferRequestId: id });
        const transactions = [];

        for (const detail of details) {
            // 1. Xử lý Linh kiện
            if (detail.itemId && detail.itemId.length > 0) {
                // Chuyển kho sang toStoreId
                await Item.updateMany(
                    { _id: { $in: detail.itemId } },
                    { storeId: transferRequest.toStoreId }
                );

                // Tạo log Nhập kho (INBOUND) cho từng linh kiện
                detail.itemId.forEach(itemId => {
                    transactions.push({
                        storeId: transferRequest.toStoreId, // Cửa hàng nhận
                        transactionType: "INBOUND",
                        referenceType: "TRANSFER_REQUEST",
                        referenceId: transferRequest._id,
                        itemId: itemId,
                        note: "Nhập kho luân chuyển từ " + (transferRequest.fromStoreId?.name || "kho khác")
                    });
                });
            }

            // 2. Xử lý Điện thoại
            if (detail.phoneId && detail.phoneId.length > 0) {
                // Chuyển kho sang toStoreId
                await Phone.updateMany(
                    { _id: { $in: detail.phoneId } },
                    { storeId: transferRequest.toStoreId }
                );

                // Tạo log Nhập kho (INBOUND) cho từng điện thoại
                detail.phoneId.forEach(phoneId => {
                    transactions.push({
                        storeId: transferRequest.toStoreId, // Cửa hàng nhận
                        transactionType: "INBOUND",
                        referenceType: "TRANSFER_REQUEST",
                        referenceId: transferRequest._id,
                        phoneId: phoneId,
                        note: "Nhập kho luân chuyển từ " + (transferRequest.fromStoreId?.name || "kho khác")
                    });
                });
            }
        }

     
        if (transactions.length > 0) {
            await InventoryTransaction.insertMany(transactions);
        }

        const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name");

        res.status(200).json({
            success: true,
            message: "Xác nhận nhận hàng và cập nhật kho thành công",
            data: updatedRequest
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
