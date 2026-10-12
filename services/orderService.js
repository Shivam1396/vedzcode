const mongoose = require("mongoose");
const Meal = require("../models/Meal");
const Order = require("../models/Order");

async function createOrder({
  userId,
  items,
  paymentMethod
}) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Your cart is empty.");
    error.status = 400;
    throw error;
  }

  if (!["counter", "online"].includes(paymentMethod)) {
    const error = new Error("Invalid payment method.");
    error.status = 400;
    throw error;
  }

  const normalizedItems = new Map();

  for (const item of items) {
    const mealId = String(item.mealId || item.meal || "");
    const quantity = Number(item.quantity);

    if (!mongoose.isValidObjectId(mealId)) {
      const error = new Error("An item in your cart is invalid.");
      error.status = 400;
      throw error;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      const error = new Error("Each quantity must be between 1 and 50.");
      error.status = 400;
      throw error;
    }

    normalizedItems.set(
      mealId,
      (normalizedItems.get(mealId) || 0) + quantity
    );
  }

  const reserved = [];

  try {
    const orderItems = [];
    let totalAmount = 0;

    for (const [mealId, quantity] of normalizedItems) {
      // Conditional stock update prevents two orders from buying
      // the same final item at the same time.
      const meal = await Meal.findOneAndUpdate(
        {
          _id: mealId,
          isAvailable: true,
          stock: { $gte: quantity }
        },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!meal) {
        const error = new Error(
          "An item is unavailable or has insufficient stock. Refresh the menu."
        );
        error.status = 409;
        throw error;
      }

      reserved.push({ mealId, quantity });

      const unitPrice = Number(meal.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        const error = new Error("A menu item has an invalid price.");
        error.status = 500;
        throw error;
      }

      orderItems.push({
        meal: meal._id,
        name: meal.name,
        price: unitPrice,
        quantity
      });

      totalAmount += unitPrice * quantity;
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      paymentMethod,
      paymentStatus: paymentMethod === "counter" ? "pending" : "pending",
      status: "placed"
    });

    return order;
  } catch (error) {
    // Best-effort compensation. For high-concurrency production use,
    // MongoDB transactions are preferable and require a replica set.
    await Promise.allSettled(
      reserved.map(({ mealId, quantity }) =>
        Meal.updateOne(
          { _id: mealId },
          { $inc: { stock: quantity } }
        )
      )
    );

    throw error;
  }
}

async function getUserOrders(userId) {
  return Order.find({ user: userId })
    .populate("items.meal", "name image")
    .sort({ createdAt: -1 });
}

async function getOrderForUser(orderId, user) {
  if (!mongoose.isValidObjectId(orderId)) {
    const error = new Error("Invalid order ID.");
    error.status = 400;
    throw error;
  }

  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("items.meal", "name image");

  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  const ownerId = String(order.user?._id || order.user);
  const isOwner = ownerId === String(user._id);
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("You cannot access this order.");
    error.status = 403;
    throw error;
  }

  return order;
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrderForUser
};