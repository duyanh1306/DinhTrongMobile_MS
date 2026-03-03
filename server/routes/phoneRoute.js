const express = require("express");
const router = express.Router();
const { authAdmin } = require("../middlewares/auth");
const uploadCloud = require("../config/cloudinary"); 

const {
    getPhonesPaginatedAndSearch,
    getAllPhones,
    createPhone,
    updatePhone
} = require("../controllers/phoneController");

// PUBLIC ROUTES (Có thể dùng cho khách xem danh sách IMEI nếu cần)
router.get("/all", getAllPhones);

// PRIVATE ROUTES (Chỉ Admin/Nhân viên)
router.get("/", authAdmin, getPhonesPaginatedAndSearch);

// Dùng .array("images", 5) để nhận tối đa 5 file ảnh chụp thực tế
router.post("/create", authAdmin, uploadCloud.array("images", 5), createPhone);
router.put("/update/:id", authAdmin, uploadCloud.array("images", 5), updatePhone);

module.exports = router;