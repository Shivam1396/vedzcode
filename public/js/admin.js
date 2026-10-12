document.addEventListener("DOMContentLoaded", () => {
  const stats = document.querySelector("#stats");
  const ordersBody = document.querySelector("#adminOrders");
  const message = document.querySelector("#adminMessage");
  const logoutButton = document.querySelector("#logoutButton");

  const statuses = [
    "placed",
    "preparing",
    "ready",
    "completed",
    "delivered",
    "cancelled"
  ];

  function cell(row, value) {
    const td = document.createElement("td");
    td.textContent = value ?? "";
    row.appendChild(td);
    return td;
  }

  function renderStats(data) {
    stats.replaceChildren();

    [
      ["Menu items", data.mealCount],
      ["All orders", data.orderCount],
      ["Pending orders", data.pendingCount],
      ["Paid revenue", window.money(data.revenue)]
    ].forEach(([label, value]) => {
      const card = document.createElement("article");
      card.className = "card";
      const heading = document.createElement("h2");
      heading.textContent = label;
      const output = document.createElement("p");
      output.textContent = String(value);
      card.append(heading, output);
      stats.appendChild(card);
    });
  }

  function renderOrders(orders) {
    ordersBody.replaceChildren();

    orders.forEach((order) => {
      const row = document.createElement("tr");

      cell(row, String(order._id).slice(-8).toUpperCase());
      cell(row, order.user?.name || "Customer");
      cell(row, window.money(order.totalAmount));
      cell(row, `${order.paymentMethod} (${order.paymentStatus})`);
      cell(row, order.status);

      const statusCell = document.createElement("td");
      const select = document.createElement("select");

      statuses.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = status === order.status;
        select.appendChild(option);
      });

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Update";

      button.addEventListener("click", async () => {
        button.disabled = true;

        try {
          await window.api(
            `/api/admin/orders/${encodeURIComponent(order._id)}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status: select.value })
            }
          );

          message.textContent = "Order updated.";
          await loadDashboard();
        } catch (error) {
          message.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      });

      statusCell.append(select, button);
      row.appendChild(statusCell);
      ordersBody.appendChild(row);
    });
  }

  async function loadDashboard() {
    try {
      const [dashboard, orders] = await Promise.all([
        window.api("/api/admin/dashboard"),
        window.api("/api/admin/orders?limit=50")
      ]);

      renderStats(dashboard.stats);
      renderOrders(orders.orders || []);
      message.textContent = "Dashboard loaded.";
    } catch (error) {
      message.textContent =
        error.status === 401 || error.status === 403
          ? "Please log in with an administrator account."
          : error.message;
    }
  }

  logoutButton.addEventListener("click", async () => {
    try {
      await window.api("/api/auth/logout", { method: "POST" });
      window.location.href = "/login.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });

  loadDashboard();

  if (typeof window.io === "function") {
    const socket = window.io();
    socket.on("order:created", loadDashboard);
    socket.on("order:updated", loadDashboard);
  }
});