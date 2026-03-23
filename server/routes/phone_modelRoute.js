const express = require("express");
const router = express.Router();
const { authInternal } = require("../middlewares/auth");
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
router.get("/", authInternal, getPhoneModelPaginatedAndSearch);

router.post("/create", authInternal, uploadCloud.single("image"), createPhoneModel);
router.put("/update/:id", authInternal, uploadCloud.single("image"), updatePhoneModel);

module.exports = router;