
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000, default: "" }
}, { timestamps: true });

reviewSchema.index({ student: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
