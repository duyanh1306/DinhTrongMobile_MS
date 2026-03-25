const express = require("express");
const router = express.Router();

// Import đúng tên hàm authCustomer từ file auth.js của bạn
const { authCustomer } = require("../middlewares/auth"); 
const { getPhoneReviews, createReview } = require("../controllers/reviewController");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management endpoints
 */

/**
 * @swagger
 * /api/reviews/phone/{phoneModelId}:
 *   get:
 *     summary: Get reviews for a phone model
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: phoneModelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews for the phone model
 *       404:
 *         description: Phone model not found
 */
router.get("/phone/:phoneModelId", getPhoneReviews);

// Chỉ những ai đăng nhập với role CUSTOMER mới được gọi API này
/**
 * @swagger
 * /api/reviews/create:
 *   post:
 *     summary: Create a new review (customer only)
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneModelId:
 *                 type: string
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authCustomer, createReview); 

module.exports = router;