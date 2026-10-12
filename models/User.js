const mongoose = require('mongoose');
const s = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
}, { timestamps: true });
// DB-level guarantee: only ONE document may ever have role "admin"
s.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'admin' } });
module.exports = mongoose.model('User', s);
