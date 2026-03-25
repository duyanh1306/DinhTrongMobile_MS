// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics endpoints
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalOrders:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 */
router.get("/", getDashboardStats);

module.exports = router;

// Trong server.js thêm: 
// app.use("/api/dashboard", require("./routes/dashboardRoutes"));