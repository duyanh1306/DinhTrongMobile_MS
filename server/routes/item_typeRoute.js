const express = require("express");
const router = express.Router();
const {authAdmin} = require("../middlewares/auth");
const {
    createItemType, 
    updateItemType, 
    getAllItemTypes,
    getItemTypePaginatedAndSearch
} = require("../controllers/item_typeController");

router.get("/", authAdmin, getItemTypePaginatedAndSearch);
router.get("/all", authAdmin, getAllItemTypes);
router.post("/create",authAdmin ,createItemType);
router.put("/update/:id",authAdmin, updateItemType);

module.exports = router;
