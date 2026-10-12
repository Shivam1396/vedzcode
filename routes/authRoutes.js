const router = require('express').Router();
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User');
const sign = u => jwt.sign({ id: u._id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Students: unlimited accounts, email must be unique. Role is ALWAYS student here.
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: 'Name, email and 6+ char password required' });
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'student' });
    res.status(201).json({ token: sign(u), role: u.role, name: u.name });
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 500).json({ message: e.code === 11000 ? 'Email already registered' : 'Server error' });
  }
});

// One-time admin creation, protected by a secret in .env. A 2nd admin is rejected by the DB index.
router.post('/admin-setup', async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body;
    if (setupKey !== process.env.ADMIN_SETUP_KEY) return res.status(403).json({ message: 'Invalid setup key' });
    if (await User.exists({ role: 'admin' })) return res.status(409).json({ message: 'Admin already exists' });
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'admin' });
    res.status(201).json({ token: sign(u), role: u.role });
  } catch { res.status(500).json({ message: 'Could not create admin' }); }
});

router.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(401).json({ message: 'Wrong email or password' });
  res.json({ token: sign(u), role: u.role, name: u.name }); // admin -> admin.html, student -> menu
});
module.exports = router;
