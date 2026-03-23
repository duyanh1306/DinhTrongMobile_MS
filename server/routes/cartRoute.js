const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.get("/:userId", cartController.getCartByUser);
router.put("/update-quantity", cartController.updateItemQuantity);
router.delete("/remove/:userId/:itemId", cartController.removeCartItem);
router.post("/add", cartController.addToCart);
module.exports = router;