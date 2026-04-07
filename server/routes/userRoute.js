const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
} = require("../controllers/userController");
const passport = require("../config/passport");
const upload = require("../middlewares/upload");
// AUTH ROUTES
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtpRegister);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-otp-reset", authController.verifyOtpReset);
router.put("/profile", upload.single("avatar"), authController.updateProfile);
router.put("/change-password", authController.changePassword);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);


router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  authController.googleAuthCallback
);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/reset-password", resetPassword);

module.exports = router;