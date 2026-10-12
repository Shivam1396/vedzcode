function buildBill(order) {
  const items = order.items.map((item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);

    return {
      name: item.name,
      price,
      quantity,
      lineTotal: Number((price * quantity).toFixed(2))
    };
  });

  return {
    billNumber: `CAN-${String(order._id).slice(-8).toUpperCase()}`,
    orderId: String(order._id),
    customer: {
      name: order.user?.name || "Campus customer",
      email: order.user?.email || ""
    },
    items,
    totalAmount: Number(order.totalAmount.toFixed(2)),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    createdAt: order.createdAt
  };
}

module.exports = { buildBill };