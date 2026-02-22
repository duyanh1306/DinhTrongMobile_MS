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

// AUTH ROUTES
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtpRegister);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ... Các route CRUD user khác của bạn (nhớ thêm middleware authMiddleware vào nếu cần bảo mật)
// 1. Route: Gửi người dùng sang trang Login của Google
// URL: http://localhost:9999/api/users/auth/google
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// 2. Route: Google gọi về khi login xong (Callback)
// URL: http://localhost:9999/api/users/google/callback
router.get(
  "/google/callback",
  // Middleware 1: Passport xử lý code từ Google, lấy profile, lưu vào DB
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  // Middleware 2: Gọi Controller để tạo JWT và trả về Client
  authController.googleAuthCallback
);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/reset-password", resetPassword);
module.exports = router;