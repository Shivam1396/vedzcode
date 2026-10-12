const Stripe = require("stripe");

let stripeClient;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error(
      "Online payments are not configured. Use counter payment or configure Stripe."
    );
    error.status = 503;
    throw error;
  }

  if (!stripeClient) {
    stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

async function createPaymentIntent(order) {
  if (!order || !order._id) {
    const error = new Error("A valid order is required.");
    error.status = 400;
    throw error;
  }

  if (order.paymentMethod !== "online") {
    const error = new Error("This order is not configured for online payment.");
    error.status = 400;
    throw error;
  }

  if (order.paymentStatus === "paid") {
    const error = new Error("This order has already been paid.");
    error.status = 409;
    throw error;
  }

  const amountInPaise = Math.round(Number(order.totalAmount) * 100);

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 50) {
    const error = new Error(
      "The payment amount must be at least ₹0.50."
    );
    error.status = 400;
    throw error;
  }

  const stripe = getStripeClient();

  return stripe.paymentIntents.create({
    amount: amountInPaise,
    currency: "inr",
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: String(order._id)
    }
  }, {
    idempotencyKey: `canteen-order-${order._id}`
  });
}

module.exports = { createPaymentIntent };