const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");

// API public cho khách hàng xem công thức
router.get("/all", recipeController.getAllRecipes);

// API cho Admin thêm công thức
router.post("/create", recipeController.createRecipe);

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> aed3065ecfa13016089a9f327d13e8b8ebb409b8
