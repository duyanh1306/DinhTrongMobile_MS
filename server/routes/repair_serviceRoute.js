const express = require("express");
const router = express.Router();
const {authAdmin} = require("../middlewares/auth");
const {
    getRepairServices,
    getAllRepairServices,
    createRepairService,
    updateRepairService
} = require("../controllers/repair_serviceController");

router.get("/",  getRepairServices);
router.get("/all", authAdmin, getAllRepairServices);
router.post("/create", authAdmin, createRepairService);
router.put("/update/:id", authAdmin, updateRepairService);

module.exports = router;