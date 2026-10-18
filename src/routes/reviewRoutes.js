
const express = require("express");

const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { validate } = require("../validators/authValidator");

const {
  createReviewSchema,
  updateReviewSchema,
} = require("../validators/reviewValidator");

const router = express.Router();

// All review endpoints require authentication.
router.use(authenticateToken);

// List reviews with pagination, filters, and search.
router.get("/", getReviews);

// Get one review by ID.
router.get("/:id", getReviewById);

// Only students can submit reviews.
router.post(
  "/",
  authorizeRoles("student"),
  validate(createReviewSchema),
  createReview
);

// Authors and admins can update reviews.
router.put(
  "/:id",
  validate(updateReviewSchema),
  updateReview
);

// Authors and admins can delete reviews.
router.delete("/:id", deleteReview);

module.exports = router;
