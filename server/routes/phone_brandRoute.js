const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const { getAllBrands, getBrandsPaginatedAndSearch, createBrand, updateBrand, deleteBrand } = require("../controllers/phone_brandController");

/**
 * @swagger
 * components:
 *   schemas:
 *     PhoneBrand:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         name:
 *           type: string
 *           description: Brand name (unique, trimmed)
 *           example: "Apple"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Brand creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateBrand:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Brand name (unique, trimmed)
 *           example: "Apple"
 *     UpdateBrand:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Brand name (unique, trimmed)
 *           example: "Apple"
 */

/**
 * @swagger
 * /api/phone_brands/all:
 *   get:
 *     summary: Get all phone brands
 *     description: Retrieve all phone brands without pagination (public endpoint)
 *     tags: [Phone Brands]
 *     responses:
 *       200:
 *         description: Phone brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PhoneBrand'
 *       500:
 *         description: Internal server error
 */
router.get("/all", getAllBrands);

/**
 * @swagger
 * /api/phone_brands:
 *   get:
 *     summary: Get phone brands with pagination and search
 *     description: Retrieve phone brands with pagination and search (internal staff only)
 *     tags: [Phone Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by brand name (case-insensitive)
 *     responses:
 *       200:
 *         description: Phone brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PhoneBrand'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/", authInternal, getBrandsPaginatedAndSearch);

/**
 * @swagger
 * /api/phone_brands/create:
 *   post:
 *     summary: Create a new phone brand
 *     description: Create a new phone brand (internal staff only)
 *     tags: [Phone Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBrand'
 *     responses:
 *       201:
 *         description: Phone brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PhoneBrand'
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
 *                   example: "Brand with this name already exists"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post("/create", authInternal, createBrand);

/**
 * @swagger
 * /api/phone_brands/update/{id}:
 *   put:
 *     summary: Update phone brand
 *     description: Update an existing phone brand (internal staff only)
 *     tags: [Phone Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone brand ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBrand'
 *     responses:
 *       200:
 *         description: Phone brand updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PhoneBrand'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Phone brand not found
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, updateBrand);

/**
 * @swagger
 * /api/phone_brands/{id}:
 *   delete:
 *     summary: Delete phone brand
 *     description: Delete a phone brand (internal staff only)
 *     tags: [Phone Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone brand ID
 *     responses:
 *       200:
 *         description: Phone brand deleted successfully
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
 *                   example: "Brand deleted successfully"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Phone brand not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authInternal, deleteBrand);

module.exports = router;
