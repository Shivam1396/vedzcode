const router = require('express').Router();
const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const { protect, adminOnly } = require('../middleware/auth');

const TIMETABLE = [
  { slot: 'breakfast', from: '07:30', to: '10:30' },
  { slot: 'lunch', from: '12:00', to: '15:00' },
  { slot: 'dinner', from: '19:00', to: '21:30' }
];
router.get('/timetable', (req, res) => res.json(TIMETABLE));

router.get('/', async (req, res) => {
  const q = {};
  if (req.query.mess) {
    if (!mongoose.isValidObjectId(req.query.mess)) return res.json([]);
    q.mess = req.query.mess;
  }
  if (req.query.category) q.category = req.query.category;
  res.json(await Meal.find(q));
});

// Admin menu control (body must include "mess")
router.post('/', protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await Meal.create(req.body)); }
  catch { res.status(400).json({ message: 'Could not add dish (duplicate name in this mess?)' }); }
});
router.put('/:id', protect, adminOnly, async (req, res) => res.json(await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete('/:id', protect, adminOnly, async (req, res) => { await Meal.findByIdAndDelete(req.params.id); res.json({ ok: true }); });
module.exports = router;