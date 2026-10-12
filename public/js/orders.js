document.addEventListener("DOMContentLoaded", () => {
  const ordersList = document.querySelector("#ordersList");
  const message = document.querySelector("#ordersMessage");

  function addText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderOrders(orders) {
    ordersList.replaceChildren();

    if (!orders.length) {
      message.textContent = "You have not placed any orders yet.";
      return;
    }

    message.textContent = "Your orders are shown below.";

    orders.forEach((order) => {
      const card = document.createElement("article");
      card.className = "card";

      addText(
        card,
        "h2",
        `Order #${String(order._id).slice(-8).toUpperCase()}`
      );
      addText(card, "p", `Status: ${order.status}`);
      addText(card, "p", `Payment: ${order.paymentStatus}`);
      addText(card, "p", `Total: ${window.money(order.totalAmount)}`);















































































      
      const billLink = document.createElement("a");
      billLink.href = `/bill.html?orderId=${encodeURIComponent(order._id)}`;
      billLink.textContent = "View bill";
      card.appendChild(billLink);

      ordersList.appendChild(card);
    });
  }

  async function loadOrders() {
    try {
      const result = await window.api("/api/orders/mine");
      renderOrders(result.orders || []);
    } catch (error) {
      message.textContent =
        error.status === 401
          ? "Please log in to view your orders."
          : error.message;
    }
  }

  loadOrders();

  // Refresh the order list when the server announces an update.
  // The server must authenticate socket sessions before joining rooms.
  if (typeof window.io === "function") {
    const socket = window.io();

    socket.on("order:updated", () => {
      loadOrders();
    });
  }
});