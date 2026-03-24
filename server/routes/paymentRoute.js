const express = require('express');
const router = express.Router();
const { createVnpayPayment, vnpayReturn, vnpayIpn } = require('../controllers/paymentController');

router.post('/vnpay/create', createVnpayPayment);
router.get('/vnpay/return', vnpayReturn);
router.get('/vnpay/ipn', vnpayIpn);

module.exports = router;