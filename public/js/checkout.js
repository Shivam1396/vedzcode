document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#checkoutForm");
  const summary = document.querySelector("#checkoutSummary");
  const totalElement = document.querySelector("#checkoutTotal");
  const message = document.querySelector("#checkoutMessage");
  const button = form.querySelector('button[type="submit"]');

  function renderSummary() {
    const items = window.CanteenCart.getItems();
    summary.replaceChildren();

    if (!items.length) {
      message.textContent = "Your cart is empty. Add meals before checkout.";
      button.disabled = true;
      return;
    }

    button.disabled = false;

    items.forEach((item) => {
      const line = document.createElement("p");
      line.textContent =
        `${item.name} × ${item.quantity} — ` +
        window.money(item.price * item.quantity);
      summary.appendChild(line);
    });

    totalElement.textContent = window.money(
      window.CanteenCart.total()
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const items = window.CanteenCart.getItems();
    if (!items.length) {
      message.textContent = "Your cart is empty.";
      return;
    }

    const paymentMethod =
      document.querySelector("#paymentMethod").value;

    button.disabled = true;
    message.textContent = "Creating your order…";

    try {
      const result = await window.api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod,
          items: items.map((item) => ({
            mealId: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!result.order?._id) {
        throw new Error("The server did not return an order ID.");
      }

      if (paymentMethod === "online") {
        // Do not claim online payment is complete here.
        // This page must continue into Stripe Elements payment confirmation.
        window.location.href =
          `/checkout.html?orderId=${encodeURIComponent(result.order._id)}`;
        message.textContent =
          "Order created. Online payment still needs confirmation.";
        return;
      }

      window.CanteenCart.clear();
      window.location.href =
        `/bill.html?orderId=${encodeURIComponent(result.order._id)}`;
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });

  renderSummary();
});