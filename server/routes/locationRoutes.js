const express = require("express");
const router = express.Router();
const { getAllLocations } = require("../controllers/locationController");

/**
 * @swagger
 * components:
 *   schemas:
 *     VietnamLocation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         name:
 *           type: string
 *           description: Province/City name
 *           example: "Hồ Chí Minh"
 *         code:
 *           type: integer
 *           description: Province/City code
 *           example: 79
 *         codename:
 *           type: string
 *           description: Province/City codename
 *           example: "TP.HCM"
 *         division_type:
 *           type: string
 *           description: Administrative division type
 *           example: "Thành phố Trung ương"
 *         phone_code:
 *           type: integer
 *           description: Phone area code
 *           example: 28
 *         districts:
 *           type: array
 *           description: List of districts within the province/city
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: District name
 *                 example: "Quận 1"
 *               code:
 *                 type: integer
 *                 description: District code
 *                 example: 701
 *               codename:
 *                 type: string
 *                 description: District codename
 *                 example: "Q.1"
 *               division_type:
 *                 type: string
 *                 description: Administrative division type
 *                 example: "Quận"
 *               wards:
 *                 type: array
 *                 description: List of wards within the district
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Ward name
 *                       example: "Phường Bến Nghé"
 *                     code:
 *                       type: integer
 *                       description: Ward code
 *                       example: 70101
 *                     codename:
 *                       type: string
 *                       description: Ward codename
 *                       example: "P.Bến Nghé"
 *                     division_type:
 *                       type: string
 *                       description: Administrative division type
 *                       example: "Phường"
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all Vietnam locations
 *     description: Retrieve all provinces/cities with their districts and wards (public endpoint)
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VietnamLocation'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.get("/", getAllLocations);

module.exports = router;
