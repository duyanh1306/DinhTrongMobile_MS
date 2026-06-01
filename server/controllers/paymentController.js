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
                }
            }
        }

        if (isUpdated) {
            await order.save();
        }
    } catch (error) {
        console.error(' Lỗi khóa kho:', error);
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
		console.error(' VNPay create error:', e);
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
                
                reserveInventoryForOrder(updatedOrder).catch(err => console.error(err));
            }
        } else {
        
 
            await Order.findByIdAndUpdate(
                orderId,
                { paymentStatus: 'Failed', orderStatus: 'Cancelled' } 
            );

           
        }

		const clientReturn = process.env.VNP_CLIENT_RETURN_URL || process.env.VNP_FRONTEND_RETURN_URL;
		if (clientReturn) {
			const qs = querystring.stringify(req.query);
			const sep = clientReturn.includes('?') ? '&' : '?';
			return res.redirect(302, `${clientReturn}${sep}${qs}`);
		}

		return res.status(200).json({ success: code === '00', code, data: req.query });
	} catch (e) {
		console.error(' VNPay return error:', e);
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
		console.error(' VNPay IPN error:', e);
		return res.json({ RspCode: '99', Message: 'Unknown error' });
	}
};
exports.payosReturn = async (req, res) => {
    try {
        const { code, cancel, status, orderCode } = req.query;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'; 

        if (cancel === 'true' || status === 'CANCELLED' || code !== '00') {
            
            if (orderCode) {
                await Order.findOneAndDelete({ orderCode: Number(orderCode), paymentStatus: { $ne: 'Paid' } });
            }
            
            return res.redirect(`${clientUrl}/payos-return?code=${code}&cancel=true&status=CANCELLED`);
        }

        if (code === '00' || status === 'PAID') {
            return res.redirect(`${clientUrl}/payos-return?code=00&status=PAID`);
        }

        return res.redirect(`${clientUrl}/payos-return`);
        
    } catch (error) {
        console.error('Lỗi PayOS return:', error);
        return res.status(500).json({ success: false, message: 'Lỗi xử lý PayOS Return' });
    }
};

exports.payosWebhook = async (req, res) => {
    try {
   
        const { code, data, success } = req.body;
        
        
        if (success && code === '00' && data && data.orderCode) {
            const updatedOrder = await Order.findOneAndUpdate(
                { orderCode: Number(data.orderCode), paymentStatus: { $ne: 'Paid' } }, 
                { paymentStatus: 'Paid', orderStatus: 'Processing' },
                { new: true }
            );

            if (updatedOrder) {
                const user = await User.findById(updatedOrder.userId);
                const userEmail = user?.email || "email_du_phong@gmail.com";
                const userName = updatedOrder.shippingInfo?.fullName || user?.name || "Quý khách";
                
                sendInvoiceEmail(userEmail, updatedOrder, userName).catch(err => console.error(err));
                reserveInventoryForOrder(updatedOrder).catch(err => console.error('Lỗi khóa kho PayOS Webhook:', err));
            }
        } 

        return res.json({ success: true, message: 'Webhook nhận thành công' });
    } catch (error) {
        console.error('Lỗi PayOS Webhook:', error);
        return res.json({ success: false, message: 'Lỗi xử lý Webhook' });
    }
};