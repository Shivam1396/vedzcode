document.addEventListener("DOMContentLoaded", async () => {
  const message = document.querySelector("#billMessage");
  const content = document.querySelector("#billContent");
  const orderId = new URLSearchParams(window.location.search).get("orderId");

  document.querySelector("#printBill").addEventListener("click", () => {
    window.print();
  });

  if (!orderId) {
    message.textContent = "No order ID was provided.";
    return;
  }

  try {
    const result = await window.api(
      `/api/orders/${encodeURIComponent(orderId)}/bill`
    );

    const bill = result.bill;
    if (!bill) throw new Error("The bill was not returned by the server.");

    message.textContent = `Bill number: ${bill.billNumber}`;
    content.replaceChildren();

    function addLine(tag, text) {
      const element = document.createElement(tag);
      element.textContent = text;
      content.appendChild(element);
      return element;
    }

    addLine("p", `Order: ${bill.orderId}`);
    addLine("p", `Customer: ${bill.customer.name}`);
    addLine("p", `Email: ${bill.customer.email || "Not provided"}`);
    addLine("p", `Date: ${new Date(bill.createdAt).toLocaleString()}`);

    const table = document.createElement("table");
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["Item", "Qty", "Price", "Amount"].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });

    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");

    bill.items.forEach((item) => {
      const row = document.createElement("tr");

      [
        item.name,
        String(item.quantity),
        window.money(item.price),
        window.money(item.lineTotal)
      ].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        row.appendChild(td);
      });

      body.appendChild(row);
    });

    table.appendChild(body);
    content.appendChild(table);

    addLine("h2", `Total: ${window.money(bill.totalAmount)}`);
    addLine("p", `Payment method: ${bill.paymentMethod}`);
    addLine("p", `Payment status: ${bill.paymentStatus}`);
    addLine("p", `Order status: ${bill.orderStatus}`);
  } catch (error) {
    message.textContent =
      error.status === 401
        ? "Please log in to view this bill."
        : error.message;
  }
});