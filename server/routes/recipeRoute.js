const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const {
    getAllRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getPartCodes,
    validateRepairItem,
} = require("../controllers/recipeController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         phoneModelId:
 *           type: object
 *           description: Phone model information
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "iPhone 13"
 *             image:
 *               type: string
 *               example: "https://example.com/image.jpg"
 *             brand:
 *               type: string
 *               example: "Apple"
 *         description:
 *           type: string
 *           description: Recipe description or instructions
 *           example: "Complete screen replacement procedure for iPhone 13"
 *         requiredParts:
 *           type: array
 *           description: List of required parts for the recipe
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Part name
 *                 example: "Screen Assembly"
 *               acceptedItemTypes:
 *                 type: array
 *                 description: List of acceptable item types for this part
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: "Screen"
 *                     code:
 *                       type: string
 *                       example: "SCREEN001"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/screen.jpg"
 *               quantity:
 *                 type: integer
 *                 description: Quantity required
 *                 example: 1
 *               isRequired:
 *                 type: boolean
 *                 description: Whether this part is required
 *                 example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Recipe creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateRecipe:
 *       type: object
 *       required:
 *         - phoneModelId
 *         - requiredParts
 *       properties:
 *         phoneModelId:
 *           type: string
 *           description: Phone model ID
 *           example: "507f1f77bcf86cd799439011"
 *         description:
 *           type: string
 *           description: Recipe description or instructions
 *           example: "Complete screen replacement procedure for iPhone 13"
 *         requiredParts:
 *           type: array
 *           description: List of required parts for the recipe
 *           items:
 *             type: object
 *             required:
 *               - name
 *               - acceptedItemTypes
 *             properties:
 *               name:
 *                 type: string
 *                 description: Part name
 *                 example: "Screen Assembly"
 *               acceptedItemTypes:
 *                 type: array
 *                 description: List of acceptable item types for this part
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *               quantity:
 *                 type: integer
 *                 description: Quantity required
 *                 example: 1
 *               isRequired:
 *                 type: boolean
 *                 description: Whether this part is required
 *                 example: true
 *     UpdateRecipe:
 *       type: object
 *       properties:
 *         phoneModelId:
 *           type: string
 *           description: Phone model ID
 *           example: "507f1f77bcf86cd799439011"
 *         description:
 *           type: string
 *           description: Recipe description or instructions
 *           example: "Complete screen replacement procedure for iPhone 13"
 *         requiredParts:
 *           type: array
 *           description: List of required parts for the recipe
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Part name
 *                 example: "Screen Assembly"
 *               acceptedItemTypes:
 *                 type: array
 *                 description: List of acceptable item types for this part
 *                 items:
 *                   type: string
 *               quantity:
 *                 type: integer
 *                 description: Quantity required
 *                 example: 1
 *               isRequired:
 *                 type: boolean
 *                 description: Whether this part is required
 *                 example: true
 */

/**
 * @swagger
 * /api/recipes/all:
 *   get:
 *     summary: Get all recipes
 *     description: Retrieve all recipes with populated phone model and item type information (public endpoint)
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
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
 *                     $ref: '#/components/schemas/Recipe'
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
router.get("/all", getAllRecipes); 

/**
 * @swagger
 * /api/recipes/create:
 *   post:
 *     summary: Create a new recipe
 *     description: Create a new repair recipe for a specific phone model (internal staff only)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecipe'
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
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
 *                   example: "Validation error"
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
router.post("/create", authInternal, createRecipe);

/**
 * @swagger
 * /api/recipes/update/{id}:
 *   put:
 *     summary: Update recipe
 *     description: Update an existing recipe (internal staff only)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRecipe'
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy công thức"
 *       500:
 *         description: Internal server error
 */
router.put("/update/:id", authInternal, updateRecipe);

/**
 * @swagger
 * /api/recipes/delete/{id}:
 *   delete:
 *     summary: Delete recipe
 *     description: Delete a recipe (internal staff only)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
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
 *                   example: "Đã xóa công thức"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:id", authInternal, deleteRecipe);

router.get("/part-codes", authInternal, getPartCodes);
router.post("/validate-item", authInternal, validateRepairItem);

module.exports = router;
