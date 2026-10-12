const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const { requireLogin, requireAdmin } = require("../middleware/auth");
const Meal = require("../models/Meal");
const Order = require("../models/Order");
const { notifyOrderUpdated } = require("../services/notificationService");

router.use(requireLogin, requireAdmin);

router.get("/dashboard", async (req, res, next) => {
  try {
    const [
      mealCount,
      orderCount,
      pendingCount,
      revenueResult
    ] = await Promise.all([
      Meal.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({
        status: { $in: ["placed", "preparing"] }
      }),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $nin: ["cancelled"] }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        mealCount,
        orderCount,
        pendingCount,
        revenue: revenueResult[0]?.revenue || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [orders, total] = await Promise.all([
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments()
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:orderId/status", async (req, res, next) => {
  try {
    const allowedStatuses = [
      "placed",
      "preparing",
      "ready",
      "completed",
      "delivered",
      "cancelled"
    ];

    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status."
      });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    if (order.status === "cancelled" && status !== "cancelled") {
      return res.status(409).json({
        success: false,
        message: "A cancelled order cannot be reopened."
      });
    }

    if (order.status === "completed" || order.status === "delivered") {
      return res.status(409).json({
        success: false,
        message: "This order is already completed."
      });
    }

    // Never mark an unpaid online order as completed.
    if (
      ["completed", "delivered"].includes(status) &&
      order.paymentMethod === "online" &&
      order.paymentStatus !== "paid"
    ) {
      return res.status(409).json({
        success: false,
        message: "Online payment has not been confirmed."
      });
    }

    order.status = status;
    await order.save();

    const io = req.app.get("io");
    notifyOrderUpdated(io, order);

    res.json({
      success: true,
      message: "Order status updated.",
      order
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;