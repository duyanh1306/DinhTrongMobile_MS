const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

router.get('/by-model/:modelId', recipeController.getRecipeByModelId);

module.exports = router;