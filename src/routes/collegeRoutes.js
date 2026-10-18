
const express = require("express");
const {
  createCollege,
  getColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
} = require("../controllers/collegeController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { validate } = require("../validators/authValidator");
const {
  createCollegeSchema,
  updateCollegeSchema,
} = require("../validators/collegeValidator");

const router = express.Router();

router.get("/", authenticateToken, getColleges);
router.get("/:id", authenticateToken, getCollegeById);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  validate(createCollegeSchema),
  createCollege
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validate(updateCollegeSchema),
  updateCollege
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  deleteCollege
);

module.exports = router;
