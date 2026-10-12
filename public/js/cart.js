(function () {
  const STORAGE_KEY = "smartCanteenCart";

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart:changed"));
  }

  function getItems() {
    return read();
  }

  function add(meal) {
    if (!meal || !meal._id || !meal.name) {
      throw new Error("Invalid meal.");
    }

    if (!meal.isAvailable || Number(meal.stock) < 1) {
      throw new Error("This meal is currently unavailable.");
    }

    const items = read();
    const id = String(meal._id);
    const existing = items.find((item) => item.id === id);

    if (existing) {
      if (existing.quantity + 1 > Number(meal.stock)) {
        throw new Error("You cannot add more than the available stock.");
      }
      existing.quantity += 1;
    } else {
      items.push({
        id,
        name: String(meal.name),
        price: Number(meal.price),
        quantity: 1,
        stock: Number(meal.stock)
      });
    }

    write(items);
  }

  function changeQuantity(id, delta) {
    const items = read();
    const item = items.find((entry) => entry.id === String(id));

    if (!item) return;

    const next = item.quantity + Number(delta);

    if (next < 1) {
      remove(id);
      return;
    }

    if (next > item.stock) {
      throw new Error("Quantity exceeds available stock.");
    }

    item.quantity = next;
    write(items);
  }

  function remove(id) {
    write(read().filter((item) => item.id !== String(id)));
  }

  function clear() {
    write([]);
  }

  function total() {
    return read().reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }

  function count() {
    return read().reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCountBadge() {
    const badge = document.querySelector("#cartCount");
    if (badge) badge.textContent = String(count());
  }

  window.CanteenCart = {
    getItems,
    add,
    changeQuantity,
    remove,
    clear,
    total,
    count
  };

  document.addEventListener("DOMContentLoaded", updateCountBadge);
  window.addEventListener("cart:changed", updateCountBadge);
})();