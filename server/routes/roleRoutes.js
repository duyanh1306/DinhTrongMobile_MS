const express = require("express");
const router = express.Router();
const { getAllRoles } = require("../controllers/roleController");

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management endpoints
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of all roles
 */
router.get("/", getAllRoles);

module.exports = router;