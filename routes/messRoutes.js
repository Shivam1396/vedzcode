const router = require('express').Router();
const Mess = require('../models/Mess');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => res.json(await Mess.find({ active: true }).sort('name')));
router.post('/', protect, adminOnly, async (req, res) => res.status(201).json(await Mess.create(req.body)));
module.exports = router;