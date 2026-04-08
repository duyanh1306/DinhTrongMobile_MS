const express = require("express");
const router = express.Router();
const {authInternal} = require("../middlewares/auth");
const {
    getRepairServices,
    getAllRepairServices,
    createRepairService,
    updateRepairService,
    deleteRepairService
} = require("../controllers/repair_serviceController");

/**
 * @swagger
 * components:
 *   schemas:
 *     RepairService:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         name:
 *           type: string
 *           description: Service name (2-100 characters, alphanumeric with spaces, hyphens, underscores)
 *           example: "Screen Replacement"
 *         price:
 *           type: number
 *           description: Service price
 *           example: 150.00
 *     PaginatedRepairServices:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RepairService'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *               example: 1
 *             totalPages:
 *               type: integer
 *               example: 5
 *             totalItems:
 *               type: integer
 *               example: 50
 *             itemsPerPage:
 *               type: integer
 *               example: 10
 *     CreateRepairService:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Service name (2-100 characters, alphanumeric with spaces, hyphens, underscores)
 *           example: "Screen Replacement"
 *         price:
 *           type: number
 *           description: Service price
 *           example: 150.00
 *     UpdateRepairService:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Service name (2-100 characters, alphanumeric with spaces, hyphens, underscores)
 *           example: "Screen Replacement"
 *         price:
 *           type: number
 *           description: Service price
 *           example: 150.00
 */

/**
 * @swagger
 * /repair-services:
 *   get:
 *     summary: Get repair services with pagination
 *     description: Retrieve repair services with pagination, search, and sorting options (public endpoint)
 *     tags: [Repair Services]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search repair services by name (case-insensitive)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Repair services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedRepairServices'
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
router.get("/",  getRepairServices);

/**
 * @swagger
 * /api/repair-services/all:
 *   get:
 *     summary: Get all repair services
 *     description: Retrieve all repair services without pagination (internal staff only)
 *     tags: [Repair Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All repair services retrieved successfully
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
 *                   example: "Item types retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RepairService'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No token provided"
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: Requires one of roles [ADMIN, MANAGER, SALE_STAFF, TECHNICIAN]"
 *       500:
 *         description: Internal server error
 */
router.get("/all", authInternal, getAllRepairServices);

/**
 * @swagger
 * /api/repair-services/create:
 *   post:
 *     summary: Create a new repair service
 *     description: Create a new repair service (internal staff only)
 *     tags: [Repair Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRepairService'
 *     responses:
 *       201:
 *         description: Repair service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RepairService'
 *                 message:
 *                   type: string
 *                   example: "Repair service created successfully"
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
 *                   example: "Name is required"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/create", authInternal, createRepairService);

/**
 * @swagger
 * /api/repair-services/update/{id}:
 *   put:
 *     summary: Update repair service
 *     description: Update an existing repair service (internal staff only)
 *     tags: [Repair Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRepairService'
 *     responses:
 *       200:
 *         description: Repair service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RepairService'
 *                 message:
 *                   type: string
 *                   example: "Repair service updated successfully"
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
 *                   example: "Repair service with this name already exists"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair service not found
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
 *                   example: "Repair service not found"
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, updateRepairService);

/**
 * @swagger
 * /api/repair-services/{id}:
 *   delete:
 *     summary: Delete repair service
 *     description: Delete a repair service (internal staff only)
 *     tags: [Repair Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair service ID
 *     responses:
 *       200:
 *         description: Repair service deleted successfully
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
 *                   example: "Repair service deleted successfully"
 *       400:
 *         description: Bad request - invalid ID
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
 *                   example: "Invalid repair service ID"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Repair service not found
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
 *                   example: "Repair service not found"
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authInternal, deleteRepairService);

module.exports = router;
