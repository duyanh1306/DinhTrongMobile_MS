const express = require("express");
const router = express.Router();
const {authInternal} = require("../middlewares/auth");
const {
    getRepairServices,
    getAllRepairServices,
    createRepairService,
    updateRepairService
} = require("../controllers/repair_serviceController");

/**
 * @swagger
 * tags:
 *   name: Repair Services
 *   description: Repair service management endpoints
 */

/**
 * @swagger
 * /api/repair_services:
 *   get:
 *     summary: Get repair services
 *     tags: [Repair Services]
 *     responses:
 *       200:
 *         description: List of repair services
 */
router.get("/",  getRepairServices);

/**
 * @swagger
 * /api/repair_services/all:
 *   get:
 *     summary: Get all repair services (authenticated)
 *     tags: [Repair Services]
 *     responses:
 *       200:
 *         description: List of all repair services
 *       401:
 *         description: Unauthorized
 */
router.get("/all", authInternal, getAllRepairServices);

/**
 * @swagger
 * /api/repair_services/create:
 *   post:
 *     summary: Create a new repair service (authenticated)
 *     tags: [Repair Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Repair service created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, createRepairService);

/**
 * @swagger
 * /api/repair_services/update/{id}:
 *   put:
 *     summary: Update repair service (authenticated)
 *     tags: [Repair Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Repair service updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, updateRepairService);

module.exports = router;