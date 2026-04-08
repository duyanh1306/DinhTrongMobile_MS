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

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         fullName:
 *           type: string
 *           description: User's full name
 *           example: "John Doe"
 *         userName:
 *           type: string
 *           description: Unique username
 *           example: "johndoe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john@example.com"
 *         number:
 *           type: string
 *           description: Phone number
 *           example: "+1234567890"
 *         birthday:
 *           type: string
 *           format: date
 *           description: User's birthday
 *           example: "1990-01-01"
 *         address:
 *           type: string
 *           description: User's address
 *           example: "123 Main St, City"
 *         image:
 *           type: string
 *           description: Profile image URL
 *         imagePublicId:
 *           type: string
 *           description: Cloudinary public ID for image
 *         roleId:
 *           type: object
 *           description: User role information
 *           properties:
 *             _id:
 *               type: string
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *           description: User account status
 *           example: "active"
 *         storeId:
 *           type: string
 *           description: Assigned store ID
 *         storeName:
 *           type: string
 *           description: Assigned store name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     LoginRequest:
 *       type: object
 *       required:
 *         - userName
 *         - password
 *       properties:
 *         userName:
 *           type: string
 *           description: Username or email
 *           example: "johndoe"
 *         password:
 *           type: string
 *           description: User password
 *           example: "Password123!"
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - userName
 *         - password
 *         - email
 *       properties:
 *         fullName:
 *           type: string
 *           description: Full name
 *           example: "John Doe"
 *         userName:
 *           type: string
 *           description: Username
 *           example: "johndoe"
 *         password:
 *           type: string
 *           description: Password (min 8 chars, 1 uppercase, 1 special char)
 *           example: "Password123!"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "john@example.com"
 *         number:
 *           type: string
 *           description: Phone number
 *           example: "+1234567890"
 *         address:
 *           type: string
 *           description: Address
 *           example: "123 Main St, City"
 *         birthday:
 *           type: string
 *           format: date
 *           description: Birthday
 *           example: "1990-01-01"
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - userName
 *         - password
 *         - email
 *         - roleId
 *       properties:
 *         fullName:
 *           type: string
 *           description: Full name
 *           example: "John Doe"
 *         userName:
 *           type: string
 *           description: Username
 *           example: "johndoe"
 *         password:
 *           type: string
 *           description: Password
 *           example: "Password123!"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "john@example.com"
 *         number:
 *           type: string
 *           description: Phone number
 *           example: "+1234567890"
 *         birthday:
 *           type: string
 *           format: date
 *           description: Birthday
 *           example: "1990-01-01"
 *         address:
 *           type: string
 *           description: Address
 *           example: "123 Main St, City"
 *         roleId:
 *           type: string
 *           description: Role ID
 *           example: "507f1f77bcf86cd799439011"
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *           description: User status
 *           example: "active"
 *         storeId:
 *           type: string
 *           description: Store ID to assign user to
 *           example: "507f1f77bcf86cd799439012"
 */

// AUTH ROUTES

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user account with OTP verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to your email"
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email này đã được sử dụng."
 *       500:
 *         description: Internal server error
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: Verify OTP for registration
 *     description: Verify OTP sent during registration process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "john@example.com"
 *               otp:
 *                 type: string
 *                 description: OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Account verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account verified successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid OTP or expired
 *       500:
 *         description: Internal server error
 */
router.post("/verify-otp", authController.verifyOtpRegister);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send OTP to email for password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Reset password using OTP verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "john@example.com"
 *               otp:
 *                 type: string
 *                 description: OTP code
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 description: New password
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or validation error
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /api/users/verify-otp-reset:
 *   post:
 *     summary: Verify OTP for password reset
 *     description: Verify OTP before allowing password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *                 example: "john@example.com"
 *               otp:
 *                 type: string
 *                 description: OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 *       500:
 *         description: Internal server error
 */
router.post("/verify-otp-reset", authController.verifyOtpReset);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile with optional avatar upload
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *               fullName:
 *                 type: string
 *                 description: Full name
 *               number:
 *                 type: string
 *                 description: Phone number
 *               address:
 *                 type: string
 *                 description: Address
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: Birthday
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */
router.put("/profile", upload.single("avatar"), authController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change password for authenticated user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       500:
 *         description: Internal server error
 */
router.put("/change-password", authController.changePassword);

// GOOGLE AUTH ROUTES

/**
 * @swagger
 * /api/users/auth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     description: Redirect user to Google for authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

/**
 * @swagger
 * /api/users/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handle Google OAuth callback and authenticate user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Google authentication successful"
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       302:
 *         description: Redirect on failure
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  authController.googleAuthCallback
);

// USER CRUD ROUTES

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users with role and store information
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their MongoDB ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user (typically for staff accounts)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username or Email already exists"
 *       500:
 *         description: Internal server error
 */
router.post("/", createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Update a specific user's information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               number:
 *                 type: string
 *                 description: Phone number
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: Birthday
 *               roleId:
 *                 type: string
 *                 description: Role ID
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *                 description: User status
 *               address:
 *                 type: string
 *                 description: Address
 *               storeId:
 *                 type: string
 *                 description: Store ID to assign user to
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Delete a specific user and remove from store assignments
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteUser);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   put:
 *     summary: Reset user password (Admin)
 *     description: Reset password for a specific user (admin function)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password for the user
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: Password is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/reset-password", resetPassword);

module.exports = router;
