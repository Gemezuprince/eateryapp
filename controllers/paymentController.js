const axios = require('axios');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// POST /api/payments/initiate
exports.initiatePayment = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
  email: req.user.email,
  amount: order.totalAmount * 100,
  callback_url: 'https://eatery-xi.vercel.app/orders',
  metadata: {
    orderId: order._id.toString()
  }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Create a pending payment record
    await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: order.totalAmount,
      reference: response.data.data.reference,
      status: 'pending'
    });

    res.json({
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;

    if (data.status === 'success') {
      const orderId = data.metadata.orderId;

      // Update order
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'paid',
          status: 'confirmed'
        },
        { new: true }
      );

      // Update payment record
      await Payment.findOneAndUpdate(
        { reference },
        {
          status: 'success',
          paidAt: new Date(),
          channel: data.channel
        }
      );

      return res.json({
        message: 'Payment verified successfully',
        order
      });
    } else {
      // Update payment record as failed
      await Payment.findOneAndUpdate(
        { reference },
        { status: 'failed' }
      );

      return res.status(400).json({ message: 'Payment not successful' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/history  — admin
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('order', 'totalAmount status');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/mypayments  — customer
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('order', 'totalAmount status items');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};