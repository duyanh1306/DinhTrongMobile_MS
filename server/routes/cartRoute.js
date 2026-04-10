const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Cart item ID
 *         productType:
 *           type: string
 *           enum: [PHONE, CUSTOM_BUILD]
 *           description: Product type
 *           example: "PHONE"
 *         phoneModelId:
 *           type: string
 *           description: Phone model ID (for PHONE type)
 *           example: "507f1f77bcf86cd799439011"
 *         colorName:
 *           type: string
 *           description: Color name (for PHONE type)
 *           example: "Midnight Black"
 *         capacity:
 *           type: string
 *           description: Storage capacity (for PHONE type)
 *           example: "128GB"
 *         selectedParts:
 *           type: array
 *           description: Selected parts (for CUSTOM_BUILD type)
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: "Screen"
 *               price:
 *                 type: number
 *                 example: 150.00
 *         name:
 *           type: string
 *           description: Product display name
 *           example: "iPhone 14 Pro"
 *         image:
 *           type: string
 *           description: Product image URL
 *           example: "https://example.com/iphone14pro.jpg"
 *         price:
 *           type: number
 *           description: Item price
 *           example: 1200.00
 *         quantity:
 *           type: integer
 *           description: Item quantity
 *           example: 1
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *         userId:
 *           type: string
 *           description: User ID
 *           example: "507f1f77bcf86cd799439011"
 *         items:
 *           type: array
 *           description: Cart items
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalPrice:
 *           type: number
 *           description: Total cart price
 *           example: 2400.00
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Cart creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     AddToCart:
 *       type: object
 *       required:
 *         - userId
 *         - item
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *           example: "507f1f77bcf86cd799439011"
 *         item:
 *           type: object
 *           required:
 *             - productType
 *             - name
 *             - price
 *           properties:
 *             productType:
 *               type: string
 *               enum: [PHONE, CUSTOM_BUILD]
 *               example: "PHONE"
 *             phoneModelId:
 *               type: string
 *               example: "507f1f77bcf86cd799439012"
 *             colorName:
 *               type: string
 *               example: "Midnight Black"
 *             capacity:
 *               type: string
 *               example: "128GB"
 *             selectedParts:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *             name:
 *               type: string
 *               example: "iPhone 14 Pro"
 *             image:
 *               type: string
 *               example: "https://example.com/iphone14pro.jpg"
 *             price:
 *               type: number
 *               example: 1200.00
 *     UpdateQuantity:
 *       type: object
 *       required:
 *         - userId
 *         - itemId
 *         - quantity
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *           example: "507f1f77bcf86cd799439011"
 *         itemId:
 *           type: string
 *           description: Cart item ID
 *           example: "507f1f77bcf86cd799439015"
 *         quantity:
 *           type: integer
 *           description: New quantity
 *           example: 2
 */

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: Get cart by user
 *     description: Retrieve shopping cart for a specific user (creates new cart if not exists)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", cartController.getCartByUser);

/**
 * @swagger
 * /api/cart/update-quantity:
 *   put:
 *     summary: Update item quantity in cart
 *     description: Update the quantity of a specific item in the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuantity'
 *     responses:
 *       200:
 *         description: Item quantity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart or item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy giỏ hàng"
 *       500:
 *         description: Internal server error
 */
router.put("/update-quantity", cartController.updateItemQuantity);

/**
 * @swagger
 * /api/cart/remove/{userId}/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a specific item from the user's cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy giỏ hàng"
 *       500:
 *         description: Internal server error
 */
router.delete("/remove/:userId/:itemId", cartController.removeCartItem);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     description: Add a new item to the user's cart (increments quantity if item already exists)
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCart'
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       500:
 *         description: Internal server error
 */
router.post("/add", cartController.addToCart);

/**
 * @swagger
 * /api/cart/clear/{userId}:
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the user's cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đã dọn dẹp giỏ hàng"
 *       500:
 *         description: Internal server error
 */
router.delete('/clear/:userId', cartController.clearCart);

module.exports = router;
