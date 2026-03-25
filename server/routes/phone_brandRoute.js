const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const { getAllBrands, getBrandsPaginatedAndSearch, createBrand, updateBrand, deleteBrand } = require("../controllers/phone_brandController");

/**
 * @swagger
 * tags:
 *   name: Phone Brands
 *   description: Phone brand management endpoints
 */

/**
 * @swagger
 * /api/phone_brands/all:
 *   get:
 *     summary: Get all phone brands
 *     tags: [Phone Brands]
 *     responses:
 *       200:
 *         description: List of all phone brands
 */
router.get("/all", getAllBrands);

/**
 * @swagger
 * /api/phone_brands:
 *   get:
 *     summary: Get phone brands with pagination and search (authenticated)
 *     tags: [Phone Brands]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of phone brands
 *       401:
 *         description: Unauthorized
 */
router.get("/", authInternal, getBrandsPaginatedAndSearch);

/**
 * @swagger
 * /api/phone_brands/create:
 *   post:
 *     summary: Create a new phone brand (authenticated)
 *     tags: [Phone Brands]
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
 *     responses:
 *       201:
 *         description: Phone brand created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, createBrand);

/**
 * @swagger
 * /api/phone_brands/update/{id}:
 *   put:
 *     summary: Update phone brand (authenticated)
 *     tags: [Phone Brands]
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
 *     responses:
 *       200:
 *         description: Phone brand updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, updateBrand);

/**
 * @swagger
 * /api/phone_brands/{id}:
 *   delete:
 *     summary: Delete phone brand (authenticated)
 *     tags: [Phone Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phone brand deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authInternal, deleteBrand);

module.exports = router;