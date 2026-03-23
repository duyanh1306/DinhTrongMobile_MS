const express = require("express");
const router = express.Router();
const { authInternal, authTechnician } = require("../middlewares/auth");
const uploadCloud = require("../config/cloudinary");

const {
    getPhonesPaginatedAndSearch,
    getAllPhones,
    createPhone,
    updatePhone,
    deletePhone,
    createAssembledPhone,
    getPhonesGroupedByBrand,
    handleTechDecision,
    generatePhoneQRCode
} = require("../controllers/phoneController");

// PUBLIC ROUTES (Có thể dùng cho khách xem danh sách IMEI nếu cần)
router.get("/all", getAllPhones);
router.put("/:id/tech-decision", handleTechDecision);
// PRIVATE ROUTES (Chỉ Admin/Nhân viên)
router.get("/", authInternal, getPhonesPaginatedAndSearch);
router.get('/grouped-by-brand', getPhonesGroupedByBrand);
// Dùng .array("images", 5) để nhận tối đa 5 file ảnh chụp thực tế
router.post("/create", authInternal, uploadCloud.array("images", 5), createPhone);
router.put("/update/:id", authInternal, uploadCloud.array("images", 5), updatePhone);
router.delete("/:id", authInternal, deletePhone);
router.post('/assemble', authTechnician, createAssembledPhone);
router.get('/qrcode/:id', generatePhoneQRCode);
module.exports = router;