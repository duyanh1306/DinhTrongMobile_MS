const express = require("express");
const router = express.Router();
const {authInternal} = require("../middlewares/auth");
const {
    getRepairServices,
    getAllRepairServices,
    createRepairService,
    updateRepairService,
    deleteRepairService
} = require("../controllers/repair_serviceController");

router.get("/",  getRepairServices);
router.get("/all", authInternal, getAllRepairServices);
router.post("/create", authInternal, createRepairService);
router.put("/update/:id", authInternal, updateRepairService);
router.delete("/:id", authInternal, deleteRepairService);

module.exports = router;