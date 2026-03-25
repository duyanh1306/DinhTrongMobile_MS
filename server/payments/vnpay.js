const crypto = require('crypto');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        // 🌟 SỬA LỖI SẬP PROTOTYPE CỦA EXPRESS 🌟
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
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

function buildPaymentUrl({ amountVnd, orderId, orderInfo, ipAddr, bankCode, locale = 'vn', returnUrl, vnpUrl, tmnCode, secretKey }) {
    const createDate = formatDateGMT7(new Date());
    const expireDateObj = new Date(new Date().getTime() + 15 * 60 * 1000);
    const expireDate = formatDateGMT7(expireDateObj);

    let validIpAddr = (ipAddr || '127.0.0.1').split(',')[0].trim();
    if (validIpAddr === '::1' || validIpAddr.includes(':')) {
        validIpAddr = '127.0.0.1';
    }

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode.trim(),
        'vnp_Locale': locale || 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': String(orderId),
        'vnp_OrderInfo': String(orderInfo),
        'vnp_OrderType': 'other',
        'vnp_Amount': Math.floor(amountVnd) * 100, 
        'vnp_ReturnUrl': returnUrl.trim(),
        'vnp_IpAddr': validIpAddr,
        'vnp_CreateDate': createDate,
        'vnp_ExpireDate': expireDate
    };

    if (bankCode) vnp_Params['vnp_BankCode'] = bankCode;

    vnp_Params = sortObject(vnp_Params);

    const signData = Object.keys(vnp_Params)
        .map(key => `${key}=${vnp_Params[key]}`)
        .join('&');

    const hmac = crypto.createHmac('sha512', secretKey.trim());
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    vnp_Params['vnp_SecureHash'] = signed;
    
    const queryUrl = Object.keys(vnp_Params)
        .map(key => `${key}=${vnp_Params[key]}`)
        .join('&');

    return `${vnpUrl.trim()}?${queryUrl}`;
}

function verifyReturn(queryObj, secretKey) {
    // 🌟 CLONE OBJECT ĐỂ TRÁNH MẤT DỮ LIỆU ĐẨY VỀ FRONTEND 🌟
    let obj = { ...queryObj }; 
    let vnp_SecureHash = obj['vnp_SecureHash'];
    delete obj['vnp_SecureHash'];
    delete obj['vnp_SecureHashType'];

    let vnp_Params = sortObject(obj);
    const signData = Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');

    const hmac = crypto.createHmac('sha512', secretKey.trim());
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    return signed === vnp_SecureHash;
}

module.exports = { buildPaymentUrl, verifyReturn, formatDateGMT7 };