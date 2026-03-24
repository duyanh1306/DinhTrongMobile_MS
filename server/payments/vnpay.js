const crypto = require('crypto');

function sortObject(obj) {
	const sorted = {};
	const keys = Object.keys(obj).sort();
	for (const k of keys) {
		sorted[k] = obj[k];
	}
	return sorted;
}

function formatDateGMT7(date = new Date()) {
	const tzOffsetMs = 7 * 60 * 60 * 1000;
	const gmt7 = new Date(date.getTime() + tzOffsetMs);
	const yyyy = gmt7.getUTCFullYear();
	const mm = String(gmt7.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(gmt7.getUTCDate()).padStart(2, '0');
	const HH = String(gmt7.getUTCHours()).padStart(2, '0');
	const MM = String(gmt7.getUTCMinutes()).padStart(2, '0');
	const SS = String(gmt7.getUTCSeconds()).padStart(2, '0');
	return `${yyyy}${mm}${dd}${HH}${MM}${SS}`;
}

function buildExpireDateGMT7(minutes = 15) {
	const now = new Date();
	now.setMinutes(now.getMinutes() + minutes);
	return formatDateGMT7(now);
}

// Build string for signing: keys sorted, values encoded and spaces mapped to '+' (per VNPay sample sortObject)
function buildSignData(params) {
	const keys = Object.keys(params).sort();
	return keys
		.map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
		.join('&');
}

// Build final redirect query with standard URL encoding
function buildQueryString(params) {
	const keys = Object.keys(params);
	return keys
		.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
		.join('&');
}

function buildPaymentUrl({ amountVnd, orderId, orderInfo, ipAddr, bankCode, locale = 'vn', returnUrl, vnpUrl, tmnCode, secretKey }) {
	const createDate = formatDateGMT7();
	const expireDate = buildExpireDateGMT7(15);
	const vnp_Params = {
		vnp_Version: '2.1.0',
		vnp_Command: 'pay',
		vnp_TmnCode: tmnCode,
		vnp_Locale: locale,
		vnp_CurrCode: 'VND',
		vnp_TxnRef: orderId,
		vnp_OrderInfo: orderInfo,
		vnp_OrderType: 'other',
		vnp_Amount: Math.round(Number(amountVnd || 0)) * 100,
		vnp_ReturnUrl: returnUrl,
		vnp_IpAddr: (ipAddr || '127.0.0.1').split(',')[0].trim(),
		vnp_CreateDate: createDate,
		vnp_ExpireDate: expireDate,
	};
	if (bankCode) vnp_Params.vnp_BankCode = bankCode;

	const sorted = sortObject(vnp_Params);
	const signData = buildSignData(sorted);
	const hmac = crypto.createHmac('sha512', secretKey);
	const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
	const redirectParams = {
		...sorted,
		vnp_SecureHashType: 'SHA512',
		vnp_SecureHash: signed,
	};
	const query = buildQueryString(redirectParams);
	return `${vnpUrl}?${query}`;
}

function verifyReturn(queryObj, secretKey) {
	const { vnp_SecureHash, vnp_SecureHashType, ...rest } = queryObj;
	const sorted = sortObject(rest);
	const signData = buildSignData(sorted);
	const hmac = crypto.createHmac('sha512', secretKey);
	const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
	return signed === vnp_SecureHash;
}

module.exports = { buildPaymentUrl, verifyReturn, formatDateGMT7 };