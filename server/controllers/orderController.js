const Order = require("../models/Order");
const { PayOS } = require("@payos/node");
const Phone = require("../models/Phone"); 
const Item = require("../models/Item");
const User = require("../models/User");
const InventoryTransaction = require("../models/Inventory_transaction");
const InventoryTransactionDetail = require("../models/Inventory_transaction_detail"); 
const { sendConfirmRequestEmail, sendIssueReportEmail } = require("../utils/sendEmail");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID.trim(),
    apiKey: process.env.PAYOS_API_KEY.trim(),
    checksumKey: process.env.PAYOS_CHECKSUM_KEY.trim()
});

const autoCompleteOverdueOrders = async () => {

    try {

        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        await Order.updateMany(

            {
                orderStatus: 'Delivering',
                shippedAt: { $lte: sevenDaysAgo }

            },
            {
                $set: { orderStatus: 'Completed' }
            }
        );
    } catch (error) {

        console.error("Lỗi cập nhật thụ động 7 ngày:", error);

    }

};
const createOrder = async (req, res) => {
    try {
        const { userId, storeId, items, totalAmount, shippingInfo, paymentMethod } = req.body;
        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));

        const newOrder = new Order({
            userId,
            storeId: storeId || "65f123456789012345678901", 
            items,
            totalAmount,
            shippingInfo,
            paymentMethod: paymentMethod || 'PAYOS',
            paymentStatus: 'Pending',
            orderStatus: 'Pending',
            orderCode: payosOrderCode.toString() 
        });

        const savedOrder = await newOrder.save();

        if (paymentMethod === 'PAYOS') {
            const body = {
                orderCode: payosOrderCode,
                amount: totalAmount,
                description: `DTM${payosOrderCode}`,
                returnUrl: `${process.env.VNP_CLIENT_RETURN_URL}?vnp_ResponseCode=00&vnp_Amount=${totalAmount*100}`,
                cancelUrl: `${process.env.VNP_CLIENT_RETURN_URL}?vnp_ResponseCode=99`
            };

            const paymentLinkRes = await payos.paymentRequests.create(body);

            return res.status(201).json({ 
                success: true, 
                data: savedOrder, 
                orderId: savedOrder._id,
                checkoutUrl: paymentLinkRes.checkoutUrl 
            });
        }

        res.status(201).json({ success: true, data: savedOrder, orderId: savedOrder._id });
    } catch (error) {
        console.error(" LỖI TẠO ĐƠN HÀNG PAYOS:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const payosWebhook = async (req, res) => {
    try {
        const webhookData = payos.webhooks.verify(req.body);
        if (webhookData && webhookData.orderCode) {
            await Order.findOneAndUpdate(
                { orderCode: webhookData.orderCode.toString() },
                { paymentStatus: 'Paid', orderStatus: 'Processing' }
            );
            console.log(` Ting Ting! PayOS báo đã nhận tiền cho đơn: ${webhookData.orderCode}`);
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi Webhook:", error.message);
        res.json({ success: false });
    }
};

const getOrdersByUser = async (req, res) => {
    try {
        
        await autoCompleteOverdueOrders();

        const { userId } = req.params;
        const orders = await Order.find({ userId })
            .populate('storeId', 'name address')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
       
        await autoCompleteOverdueOrders();

        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('items.selectedParts', 'name price serialCode warrantyPeriod') 
            .populate('storeId', 'name address phone'); 
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const fulfillOnlineOrder = async (req, res) => {
    try {
        const { id } = req.params; 
        const { assignedSerials } = req.body; 

        if (!assignedSerials || !Array.isArray(assignedSerials) || assignedSerials.length === 0) {
            return res.status(400).json({ success: false, message: "Vui lòng quét ít nhất 1 mã Serial để xuất kho!" });
        }

        const order = await Order.findById(id).populate('userId', 'name email');
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

        const newTransaction = new InventoryTransaction({
            storeId: order.storeId,
            transactionType: "OUTBOUND",
            referenceType: "WEB_ORDER",
            referenceId: order._id,
            totalItems: assignedSerials.length,
            note: `Xuất kho giao đơn Web: ${order.orderCode || order._id}`
        });
        await newTransaction.save();

        const transactionDetails = [];

        for (let serial of assignedSerials) {
            let foundPhone = await Phone.findOne({ serialCode: serial, status: "reserved" });
            let foundItem = await Item.findOne({ serialCode: serial, status: "reserved" });

            if (!foundPhone && !foundItem) {
                foundPhone = await Phone.findOne({ serialCode: serial, status: "in_stock" });
                foundItem = await Item.findOne({ serialCode: serial, status: "in_stock" });
            }

            if (!foundPhone && !foundItem) {
                await InventoryTransaction.findByIdAndDelete(newTransaction._id);
                return res.status(400).json({ success: false, message: `Mã Serial ${serial} không tồn tại hoặc đã bị xuất kho!` });
            }

            if (foundPhone) {
                foundPhone.status = 'sold';
                await foundPhone.save();
                transactionDetails.push({
                    transactionId: newTransaction._id,
                    phoneId: foundPhone._id,
                    quantity: 1,
                    note: "Xuất điện thoại"
                });
            } else if (foundItem) {
                foundItem.status = 'assembled_and_sold'; 
                await foundItem.save();
                transactionDetails.push({
                    transactionId: newTransaction._id,
                    itemId: foundItem._id,
                    quantity: 1,
                    note: "Xuất linh kiện"
                });
            }
        }

        if (transactionDetails.length > 0) {
            await InventoryTransactionDetail.insertMany(transactionDetails);
        }

        order.orderStatus = 'Delivering';
        order.shippedAt = new Date(); 
        await order.save();

        const customerEmail = order.userId?.email || order.shippingInfo?.email || "email_khach@gmail.com";
        const customerName = order.shippingInfo?.fullName || order.userId?.name || "Quý khách";
        sendConfirmRequestEmail(customerEmail, order, customerName);

        res.status(200).json({ success: true, message: "Xuất kho đi ship thành công!", data: order });
    } catch (error) {
        console.error("Lỗi xuất kho đơn Web:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
    
        await autoCompleteOverdueOrders();

        const orders = await Order.find({})
            .populate('storeId', 'name address location phone')
            .populate('items.selectedParts', 'name serialCode') 
            .populate('items.phoneId', 'serialCode')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Lỗi lấy danh sách tất cả đơn hàng:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const customerConfirmReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByIdAndUpdate(id, { orderStatus: 'Completed' }, { new: true });
        res.status(200).json({ success: true, message: "Cảm ơn bạn đã xác nhận!", data: order });
    } catch (error) { 
        console.error("Lỗi customerConfirmReceipt:", error);
        res.status(500).json({ success: false, message: error.message }); 
    }
};

const customerReportIssue = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findByIdAndUpdate(id, { orderStatus: 'Issue_Reported' }, { new: true })
            .populate({
                path: 'storeId',
                populate: { path: 'staff', model: 'User', select: 'email' }
            });
        
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });

        let staffEmails = [];
        if (order.storeId && order.storeId.staff) {
            staffEmails = order.storeId.staff.map(user => user.email).filter(Boolean);
        }
        
        const customerName = order.shippingInfo?.fullName || "Khách hàng";
        const customerPhone = order.shippingInfo?.phone || "N/A";
        
        sendIssueReportEmail(staffEmails, order, customerName, customerPhone);

        res.status(200).json({ success: true, message: "Đã báo cáo khẩn cấp cho cửa hàng!" });
    } catch (error) { 
        console.error("Lỗi customerReportIssue:", error);
        res.status(500).json({ success: false, message: error.message }); 
    }
};

module.exports = { 
    createOrder, getOrdersByUser, getOrderById, payosWebhook, fulfillOnlineOrder, getAllOrders,
    customerConfirmReceipt, customerReportIssue
};