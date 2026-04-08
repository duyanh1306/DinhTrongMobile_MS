const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const {
    getAllRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require("../controllers/recipeController");

// PUBLIC ROUTES
router.get("/all", getAllRecipes); 

// PRIVATE ROUTES 
router.post("/create", authInternal, createRecipe);
router.put("/update/:id", authInternal, updateRecipe);
router.delete("/delete/:id", authInternal, deleteRecipe);

module.exports = router;