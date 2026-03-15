const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");

// API public cho khách hàng xem công thức
router.get("/all", recipeController.getAllRecipes);

// API cho Admin thêm công thức
router.post("/create", recipeController.createRecipe);


router.get('/by-model/:modelId', recipeController.getRecipeByModelId);
module.exports = router;
