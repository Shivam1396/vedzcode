const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Meal = require("../models/Meal");

router.get("/meal/:mealId", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.mealId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meal ID."
      });
    }

    const reviews = await Review.find({ meal: req.params.mealId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireLogin, async (req, res, next) => {
  try {
    const { mealId, rating, comment = "" } = req.body;

    if (!mongoose.isValidObjectId(mealId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meal ID."
      });
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5."
      });
    }

    if (typeof comment !== "string" || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must be 1000 characters or fewer."
      });
    }

    const meal = await Meal.findById(mealId);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Meal not found."
      });
    }

    const hasPurchased = await Order.exists({
      user: req.user._id,
      status: { $in: ["completed", "delivered"] },
      "items.meal": meal._id
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You can review a meal after a completed order."
      });
    }

    const review = await Review.create({
      user: req.user._id,
      meal: meal._id,
      rating: numericRating,
      comment: comment.trim()
    });

    res.status(201).json({
      success: true,
      message: "Review submitted.",
      review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this meal."
      });
    }

    next(error);
  }
});

module.exports = router;