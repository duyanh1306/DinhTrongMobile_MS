const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalRevenue:
 *           type: number
 *           description: Total revenue from completed sales and repairs
 *           example: 150000000
 *         totalOrders:
 *           type: integer
 *           description: Total number of orders (sales + repairs)
 *           example: 150
 *         totalCustomers:
 *           type: integer
 *           description: Total number of customers
 *           example: 75
 *         pendingTransfers:
 *           type: integer
 *           description: Number of pending transfer requests
 *           example: 5
 *     ChartData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Month name
 *           example: "Tháng 9"
 *         sale:
 *           type: number
 *           description: Sales revenue for the month
 *           example: 40000000
 *         repair:
 *           type: number
 *           description: Repair revenue for the month
 *           example: 24000000
 *     RecentActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Activity ID
 *         type:
 *           type: string
 *           description: Activity type (Bán hàng or Sửa chữa)
 *           example: "Bán hàng"
 *         customer:
 *           type: string
 *           description: Customer name
 *           example: "John Doe"
 *         staff:
 *           type: string
 *           description: Staff name who created the order
 *           example: "Jane Smith"
 *         time:
 *           type: string
 *           format: date-time
 *           description: Activity timestamp
 *     DashboardResponse:
 *       type: object
 *       properties:
 *         stats:
 *           type: object
 *           description: Dashboard statistics
 *           properties:
 *             totalRevenue:
 *               type: number
 *               example: 150000000
 *             totalOrders:
 *               type: integer
 *               example: 150
 *             totalCustomers:
 *               type: integer
 *               example: 75
 *             pendingTransfers:
 *               type: integer
 *               example: 5
 *         chartData:
 *           type: array
 *           description: Monthly revenue data for charts
 *           items:
 *             $ref: '#/components/schemas/ChartData'
 *         recentActivities:
 *           type: array
 *           description: Recent activities (orders)
 *           items:
 *             $ref: '#/components/schemas/RecentActivity'
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve comprehensive dashboard statistics including revenue, orders, customers, pending transfers, chart data, and recent activities (internal staff only)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/", getDashboardStats);

module.exports = router;
