
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5",
      },
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ college: 1, createdAt: -1 });
reviewSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
