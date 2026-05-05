const Cart = require("../models/Cart");


const getCartByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        let cart = await Cart.findOne({ userId })
            .populate('items.selectedParts', 'name price'); 
        
        if (!cart) {
            cart = new Cart({ userId, items: [], totalPrice: 0 });
            await cart.save();
        }
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateItemQuantity = async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            cart.totalPrice = cart.items.reduce((total, i) => total + (i.price * i.quantity), 0);
            await cart.save();
            res.status(200).json({ success: true, data: cart });
        } else {
            res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const removeCartItem = async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.totalPrice = cart.items.reduce((total, i) => total + (i.price * i.quantity), 0);
        
        await cart.save();
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const addToCart = async (req, res) => {
    try {
        const { userId, item } = req.body;
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [], totalPrice: 0 });
        }

        // 1. CHUẨN HÓA SỐ LƯỢNG: Đảm bảo luôn có quantity hợp lệ (ít nhất là 1)
        const itemQuantity = item.quantity ? Number(item.quantity) : 1;
        item.quantity = itemQuantity;

        const existingItemIndex = cart.items.findIndex(i => {
            // 2. CHỐNG LỖI SO SÁNH: Thêm ?.toString() cho item.storeId và item.phoneModelId
            if (i.productType !== item.productType || i.storeId?.toString() !== item.storeId?.toString()) return false;
            
            if (item.productType === 'CUSTOM_BUILD') {
                return false; 
            } 
            else {
                return i.phoneModelId?.toString() === item.phoneModelId?.toString() && 
                       i.colorName === item.colorName && 
                       i.capacity === item.capacity &&
                       i.grade === item.grade;
            }
        });

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += itemQuantity; 
        } else {
            cart.items.push(item); 
        }

        cart.totalPrice = cart.items.reduce((total, i) => total + (i.price * i.quantity), 0);
        await cart.save();
        
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;
        let cart = await Cart.findOne({ userId });
        
        if (cart) {
            cart.items = []; 
            cart.totalPrice = 0; 
            await cart.save();
        }
        res.status(200).json({ success: true, message: "Đã dọn dẹp giỏ hàng" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getCartByUser, updateItemQuantity, removeCartItem, addToCart, clearCart };
