const TransferRequest = require("../models/Transfer_request");
const TransferRequestDetail = require("../models/Transfer_request_detail");
const Store = require("../models/Store");
const User = require("../models/User");
const { sendTransferRequestCreatedEmail, sendTransferRequestApprovedEmail } = require("../utils/sendEmail"); 
const InventoryTransaction = require("../models/Inventory_transaction"); 
const InventoryTransactionDetail = require("../models/Inventory_transaction_detail"); 
const Item = require("../models/Item");
const Phone = require("../models/Phone");
// Lấy tất cả yêu cầu chuyển kho
const getAllTransferRequests = async (req, res) => {
    try {
        const requests = await TransferRequest.find()
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name")
            .populate({
                path: 'phones',
                select: 'phoneModelId colorName capacity grade',
                populate: {
                    path: 'phoneModelId',
                    select: 'name'
                }
            })
            .sort({createdAt: -1})
            .lean(); 

        const requestIds = requests.map(r => r._id);
        const details = await TransferRequestDetail.find({ transferRequestId: { $in: requestIds } })
            .populate({
                path: 'itemId',
                select: 'name origin item_type',
                populate: { path: 'item_type', select: 'name' }
            });

        const detailMap = {};
        details.forEach(d => {
            detailMap[d.transferRequestId.toString()] = d;
        });

        const finalRequests = requests.map(req => {
            req.specificItems = detailMap[req._id.toString()]?.itemId || [];
            return req;
        });

        res.status(200).json(finalRequests);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};
const getTransferRequestDetailsById = async (req, res) => {
    try {
        const {id} = req.params;

        const details = await TransferRequestDetail.find({transferRequestId: id})
        .populate({
            path: "itemId",
            select: "serialCode item_type itemTypeId origin", 
            populate: [ {path: "item_type", select: "name"} ]
        })
        .populate({
            path: "phoneId",
            select: "serialCode phoneModelId colorName capacity grade",
            populate: { path: "phoneModelId", select: "name" }
        });

        res.status(200).json(details);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};
// Tạo yêu cầu chuyển kho mới
const createTransferRequest = async (req, res) => {
    try {
        const {fromStoreId, toStoreId, requestedBy, itemType, phones, items, note} = req.body;

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
            phones: Array.isArray(phones) ? phones : []
        });

        const savedRequest = await transferRequest.save();

        
        const transferRequestDetail = new TransferRequestDetail({
            transferRequestId: savedRequest._id,
            itemId: Array.isArray(items) ? items : [],     
            phoneId: Array.isArray(phones) ? phones : [],  
            status: "PENDING",
            note: note || ""
        });

        const savedDetail = await transferRequestDetail.save();

        const populatedRequest = await TransferRequest.findById(savedRequest._id)
            .populate("fromStoreId", "name code staff")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName");

       
        try {
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
                phoneId: [],      
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
            .populate("itemType.itemTypes", "name")
            .populate({
                path: 'phones',
                select: 'phoneModelId colorName capacity',
                populate: {
                    path: 'phoneModelId',
                    select: 'name'
                }
            });

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
        const userId = req.body.userId || req.user?._id || req.user?.id;

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
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name")
            .populate({
                path: 'phones',
                select: 'phoneModelId colorName capacity',
                populate: {
                    path: 'phoneModelId',
                    select: 'name'
                }
            });

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
        const userId = req.body.userId || req.user?._id || req.user?.id;

        const transferRequest = await TransferRequest.findById(id);

        if (!transferRequest) {
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu vận chuyển" });
        }

        if (transferRequest.status?.toUpperCase() !== "PENDING") {
            return res.status(400).json({ success: false, message: "Yêu cầu vận chuyển phải trong trạng thái Chờ để từ chối" });
        }

        transferRequest.status = "REJECTED";
        transferRequest.approvedBy = userId; 
        transferRequest.approvedAt = new Date();
        await transferRequest.save();

       const updatedRequest = await TransferRequest.findById(id)
            .populate("fromStoreId", "name code")
            .populate("toStoreId", "name code")
            .populate("requestedBy", "fullName")
            .populate("approvedBy", "fullName")
            .populate("itemType.itemTypes", "name")
            .populate({
                path: 'phones',
                select: 'phoneModelId colorName capacity',
                populate: {
                    path: 'phoneModelId',
                    select: 'name'
                }
            });

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
        await transferRequest.save();


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

            const totalScanned = (items ? items.length : 0) + (phones ? phones.length : 0);
            const newTransaction = await InventoryTransaction.create({
                storeId: transferRequest.fromStoreId,
                transactionType: "OUTBOUND",
                referenceType: "TRANSFER_REQUEST",
                referenceId: transferRequest._id,
                totalItems: totalScanned,
                note: "Xuất kho luân chuyển"
            });

            const transactionDetails = [];

            if (items && items.length > 0) {
                items.forEach(item => {
                    transactionDetails.push({
                        transactionId: newTransaction._id, 
                        itemId: item.id,
                        quantity: 1,
                        note: "Xuất kho luân chuyển"
                    });
                });
            }

            if (phones && phones.length > 0) {
                phones.forEach(phone => {
                    transactionDetails.push({
                        transactionId: newTransaction._id, 
                        phoneId: phone.id,
                        quantity: 1,
                        note: "Xuất kho luân chuyển"
                    });
                });
            }

            if (transactionDetails.length > 0) {
                await InventoryTransactionDetail.insertMany(transactionDetails);
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
            return res.status(400).json({ success: false, message: "Yêu cầu vận chuyển phải trong trạng thái Đang vận chuyển để xác nhận" });
        }

        transferRequest.status = "COMPLETED";
        transferRequest.completedAt = new Date();
        await transferRequest.save();

 

        const details = await TransferRequestDetail.find({ transferRequestId: id });
        

        let totalReceived = 0;
        details.forEach(d => {
            totalReceived += (d.itemId?.length || 0) + (d.phoneId?.length || 0);
        });

        if (totalReceived > 0) {

            const newTransaction = await InventoryTransaction.create({
                storeId: transferRequest.toStoreId, 
                transactionType: "INBOUND",
                referenceType: "TRANSFER_REQUEST",
                referenceId: transferRequest._id,
                totalItems: totalReceived,
                note: "Nhập kho luân chuyển từ " + (transferRequest.fromStoreId?.name || "kho khác")
            });

            const transactionDetails = [];

            for (const detail of details) {
                if (detail.itemId && detail.itemId.length > 0) {
                    await Item.updateMany(
                        { _id: { $in: detail.itemId } },
                        { storeId: transferRequest.toStoreId }
                    );

                    detail.itemId.forEach(itemId => {
                        transactionDetails.push({
                            transactionId: newTransaction._id,
                            itemId: itemId,
                            quantity: 1
                        });
                    });
                }

                if (detail.phoneId && detail.phoneId.length > 0) {
                    await Phone.updateMany(
                        { _id: { $in: detail.phoneId } },
                        { storeId: transferRequest.toStoreId }
                    );

              
                    detail.phoneId.forEach(phoneId => {
                        transactionDetails.push({
                            transactionId: newTransaction._id,
                            phoneId: phoneId,
                            quantity: 1
                        });
                    });
                }
            }
            if (transactionDetails.length > 0) {
                await InventoryTransactionDetail.insertMany(transactionDetails);
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
