const express = require("express");
const router = express.Router();
const {authAdmin} = require("../middlewares/auth");
const {
    createItemType, 
    updateItemType, 
    getAllItemTypes,
    getItemTypePaginatedAndSearch
} = require("../controllers/item_typeController");

// PUBLIC ROUTES
router.get("/all", getAllItemTypes);
// PRIVATE ROUTES
router.get("/", authAdmin, getItemTypePaginatedAndSearch);
router.post("/create",authAdmin ,createItemType);
router.put("/update/:id",authAdmin, updateItemType);

module.exports = router;
