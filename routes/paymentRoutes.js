const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const Order = require("../models/Order");
const { createPaymentIntent } = require("../services/paymentService");

router.post("/intent/:orderId", requireLogin, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    const intent = await createPaymentIntent(order);

    // Never return your Stripe secret key to the browser.
    res.json({
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;