const mongoose = require('mongoose');
module.exports = mongoose.model('Mess', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: String,
  active: { type: Boolean, default: true }
}));