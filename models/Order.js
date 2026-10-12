const mongoose = require('mongoose');
module.exports = mongoose.model('Order', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mess: { type: mongoose.Schema.Types.ObjectId, ref: 'Mess' },
  messName: String,
  items: [{ slug: String, name: String, price: Number, quantity: Number }],
  total: Number,
  tokenNo: Number,
  txnRef: String,
  status: { type: String, enum: ['pending', 'preparing', 'completed'], default: 'pending' }
}, { timestamps: true }));