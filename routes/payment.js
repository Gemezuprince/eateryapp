const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
  getMyPayments
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/protect');

router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, adminOnly, getPaymentHistory);
router.get('/mypayments', protect, getMyPayments);

module.exports = router;