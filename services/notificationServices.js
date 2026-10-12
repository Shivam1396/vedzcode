function notifyOrderCreated(io, order) {
  if (!io || !order) return;

  const event = {
    orderId: String(order._id),
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt
  };

  // For an admin dashboard. Restrict room membership in server.js
  // so only authorized admins can join the "admins" room.
  io.to("admins").emit("order:created", event);

  // Notify only the customer who owns the order.
  io.to(`user:${String(order.user)}`).emit("order:updated", event);
}

function notifyOrderUpdated(io, order) {
  if (!io || !order) return;

  const event = {
    orderId: String(order._id),
    status: order.status,
    paymentStatus: order.paymentStatus
  };

  io.to("admins").emit("order:updated", event);
  io.to(`user:${String(order.user?._id || order.user)}`).emit(
    "order:updated",
    event
  );
}

module.exports = {
  notifyOrderCreated,
  notifyOrderUpdated
};