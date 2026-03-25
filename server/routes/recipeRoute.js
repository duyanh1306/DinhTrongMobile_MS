const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const {
    getAllRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require("../controllers/recipeController");

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Recipe management endpoints
 */

// PUBLIC ROUTES
/**
 * @swagger
 * /api/recipes/all:
 *   get:
 *     summary: Get all recipes
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: List of all recipes
 */
router.get("/all", getAllRecipes); // Dòng 12 thường nằm ở đây

// PRIVATE ROUTES (Yêu cầu quyền Admin/Internal)
/**
 * @swagger
 * /api/recipes/create:
 *   post:
 *     summary: Create a new recipe (authenticated)
 *     tags: [Recipes]
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
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, createRecipe);

/**
 * @swagger
 * /api/recipes/update/{id}:
 *   put:
 *     summary: Update recipe (authenticated)
 *     tags: [Recipes]
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
 *               items:
 *                 type: array
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, updateRecipe);

/**
 * @swagger
 * /api/recipes/delete/{id}:
 *   delete:
 *     summary: Delete recipe (authenticated)
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:id", authInternal, deleteRecipe);

module.exports = router;