const express = require("express");
const router = express.Router();
const {authAdmin} = require("../middlewares/auth");
const {
    createItem, 
    updateItem, 
    getAllItems,
    getItemsPaginatedAndSearch,
    getItemById,
    deleteItem
} = require("../controllers/itemController");

router.get("/", authAdmin, getItemsPaginatedAndSearch);
router.get("/all", authAdmin, getAllItems);
router.get("/:id", authAdmin, getItemById);
router.post("/create", authAdmin, createItem);
router.put("/update/:id", authAdmin, updateItem);
router.delete("/:id", authAdmin, deleteItem);

module.exports = router;
