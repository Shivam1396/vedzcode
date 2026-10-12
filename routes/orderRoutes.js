const router = require('express').Router();
const mongoose = require('mongoose');
const Order = require('../models/Order'), Meal = require('../models/Meal'), Mess = require('../models/Mess');
const { protect, adminOnly } = require('../middleware/auth');

// Place order after QR payment. Prices come from the DB, never from the browser.
router.post('/', protect, async (req, res) => {
  const { items, txnRef, messId } = req.body;
  if (!mongoose.isValidObjectId(messId)) return res.status(400).json({ message: 'Please select a mess first' });
  const mess = await Mess.findById(messId);
  if (!mess) return res.status(400).json({ message: 'Mess not found' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Cart is empty' });
  if (!txnRef || txnRef.length < 6) return res.status(400).json({ message: 'Enter the UPI transaction ID' });

  const meals = await Meal.find({ mess: messId, slug: { $in: items.map(i => i.mealId) }, available: true });
  const lines = [];
  for (const i of items) {
    const m = meals.find(x => x.slug === i.mealId);
    const q = Math.floor(Number(i.quantity));
    if (!m || !(q > 0)) return res.status(400).json({ message: `"${i.name || i.mealId}" is unavailable in ${mess.name}` });
    lines.push({ slug: m.slug, name: m.name, price: m.price, quantity: q });
  }
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const tokenNo = (await Order.countDocuments({ mess: messId, createdAt: { $gte: start } })) + 1; // token per mess per day
  const order = await Order.create({
    user: req.user.id, mess: mess._id, messName: mess.name, items: lines, txnRef, tokenNo,
    total: lines.reduce((s, l) => s + l.price * l.quantity, 0)
  });
  res.status(201).json(order);
});

router.get('/mine', protect, async (req, res) => res.json(await Order.find({ user: req.user.id }).sort('-createdAt')));

// ---- Admin: live tracking ----
router.get('/admin/all', protect, adminOnly, async (req, res) =>
  res.json(await Order.find(req.query.status ? { status: req.query.status } : {}).populate('user', 'name email').sort('-createdAt').limit(200)));

router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const today = { createdAt: { $gte: start } };
  const [byStatus, rev, perHour, top] = await Promise.all([
    Order.aggregate([{ $match: today }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: today }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: today }, { $group: { _id: { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: today }, { $unwind: '$items' }, { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' } } }, { $sort: { qty: -1 } }, { $limit: 5 }])
  ]);
  res.json({ byStatus, revenue: rev[0]?.revenue || 0, orders: rev[0]?.orders || 0, perHour, top });
});

router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  if (!['pending', 'preparing', 'completed'].includes(req.body.status)) return res.status(400).json({ message: 'Bad status' });
  res.json(await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }));
});

router.get('/:id', protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const o = await Order.findById(req.params.id).populate('user', 'name email');
  if (!o || (req.user.role !== 'admin' && String(o.user._id) !== req.user.id)) return res.status(404).json({ message: 'Not found' });
  res.json(o);
});
module.exports = router;