const express = require("express");
const router = express.Router();
const { authAdmin } = require("../middlewares/auth");
const uploadCloud = require("../config/cloudinary"); // Chắc chắn có dòng này

const {
    createPhoneModel,
    updatePhoneModel,
    getAllPhoneModels,
    getPhoneModelPaginatedAndSearch
} = require("../controllers/phone_modelController");

// PUBLIC ROUTES
router.get("/all", getAllPhoneModels);

// PRIVATE ROUTES
router.get("/", authAdmin, getPhoneModelPaginatedAndSearch);

router.post("/create", authAdmin, uploadCloud.single("image"), createPhoneModel);
router.put("/update/:id", authAdmin, uploadCloud.single("image"), updatePhoneModel);

module.exports = router;