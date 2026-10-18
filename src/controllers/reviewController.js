
const mongoose = require("mongoose");
const Review = require("../models/Review");
const College = require("../models/College");

async function createReview(req, res, next) {
  try {
    const { college, rating, comment } = req.body;

    const existingCollege = await College.findById(college);

    if (!existingCollege) {
      return res.status(404).json({
        message: "College not found",
      });
    }

    const review = await Review.create({
      college,
      student: req.user.userId,
      rating,
      comment,
    });

    return res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
}

async function getReviews(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};

    if (req.query.college) {
      if (!mongoose.isValidObjectId(req.query.college)) {
        return res.status(400).json({
          message: "Invalid college ID",
        });
      }

      filter.college = req.query.college;
    }

    if (req.query.student) {
      if (!mongoose.isValidObjectId(req.query.student)) {
        return res.status(400).json({
          message: "Invalid student ID",
        });
      }

      filter.student = req.query.student;
    }

    if (req.query.search) {
      const search = req.query.search.trim();

      if (search.length > 100) {
        return res.status(400).json({
          message: "Search must not exceed 100 characters",
        });
      }

      if (search) {
        filter.comment = {
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        };
      }
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("college", "name city state")
        .populate("student", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

async function getReviewById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(req.params.id)
      .populate("college", "name city state")
      .populate("student", "name");

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    return res.status(200).json({ review });
  } catch (error) {
    next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = review.student.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: "You can only update your own reviews",
      });
    }

    if (req.body.rating !== undefined) {
      review.rating = req.body.rating;
    }

    if (req.body.comment !== undefined) {
      review.comment = req.body.comment;
    }

    await review.save();

    return res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = review.student.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: "You can only delete your own reviews",
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
