const express = require("express");
const { register, login } = require("../controllers/authController");
const {
  registerSchema,
  loginSchema,
  validate,
} = require("../validators/authValidator");

const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

router.get(
  "/admin-test",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      message: "Admin access granted successfully",
      user: req.user,
    });
  }
);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
