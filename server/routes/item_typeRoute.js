const express = require("express");
const router = express.Router();
const {authInternal} = require("../middlewares/auth");
const {
    createItemType, 
    updateItemType, 
    getAllItemTypes,
    getItemTypePaginatedAndSearch
} = require("../controllers/item_typeController");

// PUBLIC ROUTES
router.get("/all", getAllItemTypes);
// PRIVATE ROUTES
router.get("/", authInternal, getItemTypePaginatedAndSearch);
router.post("/create",authInternal ,createItemType);
router.put("/update/:id",authInternal, updateItemType);

module.exports = router;
