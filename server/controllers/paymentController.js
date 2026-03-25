const { buildPaymentUrl, verifyReturn } = require('../payments/vnpay');
const querystring = require('querystring');
const Order = require('../models/Order'); 
const User = require('../models/User');
const Phone = require('../models/Phone'); 
const Item = require('../models/Item');   
const { sendInvoiceEmail } = require('../utils/sendEmail'); 

function getClientIp(req) {
	const xff = req.headers['x-forwarded-for'];
	if (xff) return xff.split(',')[0].trim();
	return req.connection.remoteAddress || req.socket.remoteAddress || req.ip || '127.0.0.1';
}

// 🌟 HÀM MỚI: Tạm giữ hàng (Khóa kho) thay vì xuất kho
const reserveInventoryForOrder = async (order) => {
    try {
        let isUpdated = false;

        for (let item of order.items) {
            if (item.productType === 'PHONE') {
                const availablePhone = await Phone.findOneAndUpdate(
                    {
                        phoneModelId: item.phoneModelId,
                        capacity: item.capacity,
                        colorName: item.colorName,
                        status: 'in_stock'
                    },
                    { status: 'reserved' }, 
                    { new: true }
                );

                if (availablePhone) {
                    item.phoneId = availablePhone._id;
                    item.assignedSerial = availablePhone.serialCode; 
                    isUpdated = true;
                }
            } 
            else if (item.productType === 'CUSTOM_BUILD') {
                for (let partId of item.selectedParts) {
                    const part = await Item.findOneAndUpdate(
                        { _id: partId, status: 'in_stock' },
                        { status: 'reserved' }, 
                        { new: true }
                    );
                    if (part) {
                        console.log(`🔒 Đã khóa linh kiện Serial: ${part.serialCode} cho máy ráp`);
                    }
                }
            }
        }

        if (isUpdated) {
            await order.save();
        }
    } catch (error) {
        console.error('❌ Lỗi khóa kho:', error);
    }
};

exports.createVnpayPayment = async (req, res) => {
	try {
		const { amountVnd, orderId, orderInfo = 'Course payment', bankCode, locale } = req.body;

		if (!amountVnd || !orderId) {
			return res.status(400).json({ success: false, message: 'amountVnd and orderId are required' });
		}

		const url = buildPaymentUrl({
			amountVnd,
			orderId,
			orderInfo,
			bankCode,
			locale,
			ipAddr: getClientIp(req),
			returnUrl: process.env.VNP_RETURN_URL,
			vnpUrl: process.env.VNP_PAYMENT_URL,
			tmnCode: process.env.VNP_TMN_CODE,
			secretKey: process.env.VNP_HASH_SECRET,
		});

		return res.status(200).json({ success: true, paymentUrl: url });
	} catch (e) {
		console.error('❌ VNPay create error:', e);
		return res.status(500).json({ success: false, message: 'Lỗi tạo link thanh toán VNPay' });
	}
};

exports.vnpayReturn = async (req, res) => {
	try {
		const valid = verifyReturn(req.query, process.env.VNP_HASH_SECRET);
		if (!valid) {
			return res.status(400).json({ success: false, message: 'Invalid checksum' });
		}
        
		const code = req.query.vnp_ResponseCode;
        const orderId = req.query.vnp_TxnRef;

        if (code === '00') {
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                { paymentStatus: 'Paid', orderStatus: 'Processing' },
                { new: true }
            );

            if (updatedOrder) {
                const user = await User.findById(updatedOrder.userId);
                const userEmail = user?.email || "email_du_phong@gmail.com";
                const userName = updatedOrder.shippingInfo?.fullName || user?.name || "Quý khách";
                
                sendInvoiceEmail(userEmail, updatedOrder, userName).catch(err => console.error(err));

                // 🌟 GỌI HÀM KHÓA KHO BẢO VỆ HÀNG (Thay vì xuất thẳng)
                reserveInventoryForOrder(updatedOrder).catch(err => console.error(err));
            }
        }

		const clientReturn = process.env.VNP_CLIENT_RETURN_URL || process.env.VNP_FRONTEND_RETURN_URL;
		if (clientReturn) {
			const qs = querystring.stringify(req.query);
			const sep = clientReturn.includes('?') ? '&' : '?';
			return res.redirect(302, `${clientReturn}${sep}${qs}`);
		}

		return res.status(200).json({ success: code === '00', code, data: req.query });
	} catch (e) {
		console.error('❌ VNPay return error:', e);
		return res.status(500).json({ success: false, message: 'Lỗi Return VNPay' });
	}
};

exports.vnpayIpn = async (req, res) => {
	try {
		const valid = verifyReturn(req.query, process.env.VNP_HASH_SECRET);
		if (!valid) {
			return res.json({ RspCode: '97', Message: 'Invalid Checksum' });
		}
		return res.json({ RspCode: '00', Message: 'Confirm Success' });
	} catch (e) {
		console.error('❌ VNPay IPN error:', e);
		return res.json({ RspCode: '99', Message: 'Unknown error' });
	}
};