const mongoose = require('mongoose');
const s = new mongoose.Schema({
  mess: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess', required: true },
  slug: { type: String, required: true },
  name: String, price: Number, image: String,
  category: { type: String, enum: ['breakfast', 'lunch', 'dinner'] },
  available: { type: Boolean, default: true }
});
s.index({ mess: 1, slug: 1 }, { unique: true }); // same dish can exist in many messes
module.exports = mongoose.model('Meal', s);