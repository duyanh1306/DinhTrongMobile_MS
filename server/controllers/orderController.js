const Order = require("../models/Order");
const { PayOS } = require("@payos/node");
const sendInvoiceEmail = require("../utils/sendEmail");
// Bỏ qua cảnh báo chặn mạng ở môi trường Localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// 🌟 ĐÃ CẬP NHẬT: Khởi tạo PayOS bản mới yêu cầu dấu ngoặc nhọn { }
const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID.trim(),
    apiKey: process.env.PAYOS_API_KEY.trim(),
    checksumKey: process.env.PAYOS_CHECKSUM_KEY.trim()
});

const createOrder = async (req, res) => {
    try {
        const { userId, storeId, items, totalAmount, shippingInfo, paymentMethod } = req.body;
        
        // Tạo mã đơn ngẫu nhiên (chỉ bao gồm số cho hợp lệ với PayOS)
        const payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900));

        const newOrder = new Order({
            userId,
            storeId: storeId || "65f123456789012345678901", // Dự phòng nếu Frontend thiếu storeId
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

            // 🌟 ĐÃ CẬP NHẬT: Hàm tạo link thanh toán của PayOS bản mới nhất
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
        console.error("❌ LỖI TẠO ĐƠN HÀNG PAYOS:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const payosWebhook = async (req, res) => {
    try {
        // 🌟 ĐÃ CẬP NHẬT: Hàm kiểm tra Webhook của PayOS bản mới nhất
        const webhookData = payos.webhooks.verify(req.body);

        if (webhookData && webhookData.orderCode) {
            await Order.findOneAndUpdate(
                { orderCode: webhookData.orderCode.toString() },
                { paymentStatus: 'Paid', orderStatus: 'Processing' }
            );
            console.log(`✅ Ting Ting! PayOS báo đã nhận tiền cho đơn: ${webhookData.orderCode}`);
        }
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Lỗi Webhook:", error.message);
        res.json({ success: false });
    }
};

const getOrdersByUser = async (req, res) => {
    try {
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

module.exports = { createOrder, getOrdersByUser, getOrderById, payosWebhook };