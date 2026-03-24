const { buildPaymentUrl, verifyReturn } = require('../payments/vnpay');
const querystring = require('querystring');

function getClientIp(req) {
	const xff = req.headers['x-forwarded-for'];
	if (xff) return xff.split(',')[0].trim();
	return req.connection.remoteAddress || req.socket.remoteAddress || req.ip || '127.0.0.1';
}

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
		console.error('VNPay create error', e);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

exports.vnpayReturn = async (req, res) => {
	try {
		const valid = verifyReturn(req.query, process.env.VNP_HASH_SECRET);
		if (!valid) {
			return res.status(400).json({ success: false, message: 'Invalid checksum' });
		}
		const code = req.query.vnp_ResponseCode;

		// If a client return URL is configured, redirect to it with the original querystring
		const clientReturn = process.env.VNP_CLIENT_RETURN_URL || process.env.VNP_FRONTEND_RETURN_URL;
		if (clientReturn) {
			const qs = querystring.stringify(req.query);
			const sep = clientReturn.includes('?') ? '&' : '?';
			return res.redirect(302, `${clientReturn}${sep}${qs}`);
		}

		return res.status(200).json({ success: code === '00', code, data: req.query });
	} catch (e) {
		console.error('VNPay return error', e);
		return res.status(500).json({ success: false, message: 'Internal server error' });
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
		console.error('VNPay IPN error', e);
		return res.json({ RspCode: '99', Message: 'Unknown error' });
	}
};