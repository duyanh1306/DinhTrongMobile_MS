const express = require("express");
const router = express.Router();
const {authAdmin} = require("../middlewares/auth");
const {
    createPhoneModel,
    updatePhoneModel,
    getAllPhoneModels,
    getPhoneModelPaginatedAndSearch
} = require("../controllers/phone_modelController");
// PUBLIC ROUTES
router.get("/all", getAllPhoneModels)
// PRIVATE ROUTES
router.get("/", authAdmin, getPhoneModelPaginatedAndSearch);
// router.get("/all", authAdmin, getAllPhoneModels);
router.post("/create", authAdmin , createPhoneModel);
router.put("/update/:id", authAdmin, updatePhoneModel);

module.exports = router;
