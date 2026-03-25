const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const uploadCloud = require("../config/cloudinary"); // Chắc chắn có dòng này

const {
    createPhoneModel,
    updatePhoneModel,
    getAllPhoneModels,
    getPhoneModelPaginatedAndSearch
} = require("../controllers/phone_modelController");

/**
 * @swagger
 * tags:
 *   name: Phone Models
 *   description: Phone model management endpoints
 */

// PUBLIC ROUTES
/**
 * @swagger
 * /api/phone_models/all:
 *   get:
 *     summary: Get all phone models
 *     tags: [Phone Models]
 *     responses:
 *       200:
 *         description: List of all phone models
 */
router.get("/all", getAllPhoneModels);

// PRIVATE ROUTES
/**
 * @swagger
 * /api/phone_models:
 *   get:
 *     summary: Get phone models with pagination and search (authenticated)
 *     tags: [Phone Models]
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
 *         description: Paginated list of phone models
 *       401:
 *         description: Unauthorized
 */
router.get("/", authInternal, getPhoneModelPaginatedAndSearch);

/**
 * @swagger
 * /api/phone_models/create:
 *   post:
 *     summary: Create a new phone model (authenticated)
 *     tags: [Phone Models]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               modelData:
 *                 type: string
 *     responses:
 *       201:
 *         description: Phone model created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, uploadCloud.single("image"), createPhoneModel);

/**
 * @swagger
 * /api/phone_models/update/{id}:
 *   put:
 *     summary: Update phone model (authenticated)
 *     tags: [Phone Models]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               modelData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone model updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, uploadCloud.single("image"), updatePhoneModel);

module.exports = router;