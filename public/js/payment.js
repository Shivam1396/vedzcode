// Runs on breakfast/lunch/dinner pages. Put your payment QR image at /public/qr.jpeg
(function () {
  const btn = document.getElementById('checkoutButton');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please log in first'); location.href = '/login.html'; return; }
    const items = JSON.parse(localStorage.getItem('canteenCart') || '[]');
    if (!items.length) return;
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;display:grid;place-items:center';
    o.innerHTML = `<div style="background:#fff;padding:24px;border-radius:14px;max-width:340px;width:90%;text-align:center;font-family:Manrope,sans-serif">
      <h2 style="margin:0 0 8px">Pay ₹${total.toFixed(2)}</h2>
    <img src="/js/shivam.jpeg" alt="Payment QR" style="width:100%;max-width:240px" onerror="this.outerHTML='<p style=&quot;color:#b3382c&quot;>QR image not found. Ask the canteen admin.</p>'">
      <p style="font-size:.85rem;color:#5b6b70">Scan with any UPI app, then enter the transaction ID.</p>
      <input id="utr" placeholder="UPI transaction ID" style="width:100%;padding:10px;border:1px solid #d5dddf;border-radius:8px;box-sizing:border-box">
      <p id="payErr" style="color:#b3382c;font-size:.85rem;min-height:1em"></p>
      <button id="payDone" style="width:100%;padding:12px;background:#1f7a6b;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer">I have paid</button>
      <button id="payCancel" style="margin-top:8px;background:none;border:0;color:#5b6b70;cursor:pointer">Cancel</button></div>`;
    document.body.appendChild(o);
    o.querySelector('#payCancel').onclick = () => o.remove();
    o.querySelector('#payDone').onclick = async () => {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
  items,
  txnRef: o.querySelector('#utr').value.trim(),
  messId: (JSON.parse(localStorage.getItem('selectedMess') || '{}')).id
})
      });
      const d = await r.json();
      if (!r.ok) { o.querySelector('#payErr').textContent = d.message; return; }
      localStorage.removeItem('canteenCart');
      location.href = '/bill.html?id=' + d._id;
    };
  });
})();
