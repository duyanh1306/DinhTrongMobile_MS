const express = require("express");
const router = express.Router();

// Import đúng tên hàm authCustomer từ file auth.js của bạn
const { authCustomer } = require("../middlewares/auth"); 
const { getPhoneReviews, createReview } = require("../controllers/reviewController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         user:
 *           type: object
 *           description: User information
 *           properties:
 *             _id:
 *               type: string
 *             fullName:
 *               type: string
 *               example: "John Doe"
 *             image:
 *               type: string
 *               description: User profile image URL
 *         phoneModel:
 *           type: string
 *           description: Phone model ID
 *           example: "507f1f77bcf86cd799439011"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Overall rating (1-5 stars)
 *           example: 4
 *         comment:
 *           type: string
 *           description: Review comment
 *           example: "Great phone with excellent performance and battery life"
 *         criteria:
 *           type: object
 *           description: Detailed rating criteria
 *           properties:
 *             performance:
 *               type: integer
 *               minimum: 1
 *               maximum: 5
 *               description: Performance rating (1-5)
 *               example: 4
 *             battery:
 *               type: integer
 *               minimum: 1
 *               maximum: 5
 *               description: Battery rating (1-5)
 *               example: 5
 *             camera:
 *               type: integer
 *               minimum: 1
 *               maximum: 5
 *               description: Camera rating (1-5)
 *               example: 4
 *         hasPurchased:
 *           type: boolean
 *           description: Whether the user has purchased this phone
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     ReviewStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of reviews
 *           example: 25
 *         avgRating:
 *           type: number
 *           description: Average rating
 *           example: 4.2
 *         ratingCounts:
 *           type: object
 *           description: Count of reviews for each rating
 *           properties:
 *             1:
 *               type: integer
 *               example: 1
 *             2:
 *               type: integer
 *               example: 2
 *             3:
 *               type: integer
 *               example: 5
 *             4:
 *               type: integer
 *               example: 8
 *             5:
 *               type: integer
 *               example: 9
 *         criteriaAvg:
 *           type: object
 *           description: Average ratings for each criteria
 *           properties:
 *             performance:
 *               type: number
 *               example: 4.1
 *             battery:
 *               type: number
 *               example: 4.5
 *             camera:
 *               type: number
 *               example: 4.0
 *     CreateReviewRequest:
 *       type: object
 *       required:
 *         - phoneModelId
 *         - rating
 *         - comment
 *         - performance
 *         - battery
 *         - camera
 *       properties:
 *         phoneModelId:
 *           type: string
 *           description: Phone model ID to review
 *           example: "507f1f77bcf86cd799439011"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Overall rating (1-5 stars)
 *           example: 4
 *         comment:
 *           type: string
 *           description: Review comment
 *           example: "Great phone with excellent performance and battery life"
 *         performance:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Performance rating (1-5)
 *           example: 4
 *         battery:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Battery rating (1-5)
 *           example: 5
 *         camera:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Camera rating (1-5)
 *           example: 4
 *     ReviewResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             reviews:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *             stats:
 *               $ref: '#/components/schemas/ReviewStats'
 */

/**
 * @swagger
 * /api/reviews/phone/{phoneModelId}:
 *   get:
 *     summary: Get reviews for a specific phone model
 *     description: Retrieve all reviews for a specific phone model with statistics and filtering options
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: phoneModelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone model ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *           enum: [1, 2, 3, 4, 5, all]
 *         description: Filter by rating (1-5 stars or 'all' for no filter)
 *       - in: query
 *         name: hasPurchased
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by purchase status (true for verified purchases only)
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.get("/phone/:phoneModelId", getPhoneReviews);

/**
 * @swagger
 * /api/reviews/create:
 *   post:
 *     summary: Create or update a review
 *     description: Create a new review or update an existing review for a phone model. Only authenticated customers can access this endpoint.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cảm ơn bạn đã gửi đánh giá!"
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã cập nhật lại đánh giá của bạn!"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 *       401:
 *         description: Unauthorized - customer authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.post("/create", authCustomer, createReview);

module.exports = router;
