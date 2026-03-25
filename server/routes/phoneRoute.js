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

/**
 * @swagger
 * tags:
 *   name: Phones
 *   description: Phone management endpoints
 */

// PUBLIC ROUTES (Có thể dùng cho khách xem danh sách IMEI nếu cần)
/**
 * @swagger
 * /api/phones/all:
 *   get:
 *     summary: Get all phones (public)
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: List of all phones
 */
router.get("/all", getAllPhones);

/**
 * @swagger
 * /api/phones/{id}/tech-decision:
 *   put:
 *     summary: Handle technician decision for a phone
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Decision handled successfully
 */
router.put("/:id/tech-decision", handleTechDecision);

// PRIVATE ROUTES (Chỉ Admin/Nhân viên)
/**
 * @swagger
 * /api/phones:
 *   get:
 *     summary: Get phones with pagination and search (authenticated)
 *     tags: [Phones]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of phones
 *       401:
 *         description: Unauthorized
 */
router.get("/", authInternal, getPhonesPaginatedAndSearch);

/**
 * @swagger
 * /api/phones/grouped-by-brand:
 *   get:
 *     summary: Get phones grouped by brand
 *     tags: [Phones]
 *     responses:
 *       200:
 *         description: Phones grouped by brand
 */
router.get('/grouped-by-brand', getPhonesGroupedByBrand);

// Dùng .array("images", 5) để nhận tối đa 5 file ảnh chụp thực tế
/**
 * @swagger
 * /api/phones/create:
 *   post:
 *     summary: Create a new phone (authenticated)
 *     tags: [Phones]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               phoneData:
 *                 type: string
 *     responses:
 *       201:
 *         description: Phone created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authInternal, uploadCloud.array("images", 5), createPhone);

/**
 * @swagger
 * /api/phones/update/{id}:
 *   put:
 *     summary: Update a phone (authenticated)
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               phoneData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:id", authInternal, uploadCloud.array("images", 5), updatePhone);

/**
 * @swagger
 * /api/phones/{id}:
 *   delete:
 *     summary: Delete a phone (authenticated)
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phone deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authInternal, deletePhone);

/**
 * @swagger
 * /api/phones/assemble:
 *   post:
 *     summary: Create an assembled phone (technician only)
 *     tags: [Phones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Assembled phone created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/assemble', authTechnician, createAssembledPhone);

/**
 * @swagger
 * /api/phones/qrcode/{id}:
 *   get:
 *     summary: Generate QR code for a phone
 *     tags: [Phones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code generated
 *       404:
 *         description: Phone not found
 */
router.get('/qrcode/:id', generatePhoneQRCode);

module.exports = router;