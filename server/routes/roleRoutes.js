const express = require("express");
const router = express.Router();
const { getAllRoles } = require("../controllers/roleController");

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve a list of all available roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: MongoDB document ID
 *                   id:
 *                     type: string
 *                     description: Role ID
 *                     example: "admin"
 *                   name:
 *                     type: string
 *                     description: Role name
 *                     example: "Administrator"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Creation timestamp
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Last update timestamp
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
 *                   example: "Database connection failed"
 */

router.get("/", getAllRoles);

module.exports = router;
