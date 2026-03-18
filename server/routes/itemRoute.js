const express = require("express");
const router = express.Router();
const {authInternal} = require("../middlewares/auth");
const {
    createItem, 
    updateItem, 
    getAllItems,
    getItemsPaginatedAndSearch,
    getItemById,
    deleteItem,
    generateItemQRCode,
} = require("../controllers/itemController");

router.get("/", authInternal, getItemsPaginatedAndSearch);
router.get("/all",  getAllItems);
router.get("/:id", authInternal, getItemById);
router.post("/create", authInternal, createItem);
router.put("/update/:id", authInternal, updateItem);
router.delete("/:id", authInternal, deleteItem);

router.get("/:id/qr", generateItemQRCode);

module.exports = router;
