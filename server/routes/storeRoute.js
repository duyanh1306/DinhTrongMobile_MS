const express = require("express");
const router = express.Router();
const {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
} = require("../controllers/storeController");

router.post("/", createStore);
router.get("/", getAllStores);
router.get("/:id", getStoreById);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);

module.exports = router;