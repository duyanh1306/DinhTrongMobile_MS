const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
const { getAllBrands, getBrandsPaginatedAndSearch, createBrand, updateBrand, deleteBrand } = require("../controllers/phone_brandController");

router.get("/all", getAllBrands);
router.get("/", authInternal, getBrandsPaginatedAndSearch);
router.post("/create", authInternal, createBrand);
router.put("/update/:id", authInternal, updateBrand);
router.delete("/:id", authInternal, deleteBrand);

module.exports = router;