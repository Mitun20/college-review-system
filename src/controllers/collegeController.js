
const mongoose = require("mongoose");
const College = require("../models/College");

async function createCollege(req, res, next) {
  try {
    const college = await College.create({
      ...req.body,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: "College created successfully",
      college,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A college with this name already exists in this city",
      });
    }

    next(error);
  }
}

async function getColleges(req, res, next) {
  try {
    const colleges = await College.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "reviews",
          let: { collegeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$college", "$$collegeId"] },
              },
            },
            {
              $group: {
                _id: null,
                reviewCount: { $sum: 1 },
                averageRating: { $avg: "$rating" },
              },
            },
          ],
          as: "ratingStats",
        },
      },
      {
        $addFields: {
          reviewCount: {
            $ifNull: [
              { $arrayElemAt: ["$ratingStats.reviewCount", 0] },
              0,
            ],
          },
          averageRating: {
            $round: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$ratingStats.averageRating", 0] },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $project: {
          ratingStats: 0,
        },
      },
    ]);

    return res.status(200).json({
      count: colleges.length,
      colleges,
    });
  } catch (error) {
    next(error);
  }
}

async function getCollegeById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid college ID" });
    }

    const college = await College.findById(req.params.id);

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    return res.status(200).json({ college });
  } catch (error) {
    next(error);
  }
}

async function updateCollege(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid college ID" });
    }

    const college = await College.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    return res.status(200).json({
      message: "College updated successfully",
      college,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A college with this name already exists in this city",
      });
    }

    next(error);
  }
}

async function deleteCollege(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid college ID" });
    }

    const college = await College.findByIdAndDelete(req.params.id);

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    return res.status(200).json({
      message: "College deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCollege,
  getColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
};
