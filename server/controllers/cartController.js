const Cart = require("../models/Cart");

// Lấy giỏ hàng của user
const getCartByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // SỬA Ở ĐÂY: Thêm .populate() để lấy tên và giá linh kiện
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
// Cập nhật số lượng item
const updateItemQuantity = async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            // Tính lại tổng tiền
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

// Xóa item khỏi giỏ
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
        
        // Nếu chưa có giỏ, tạo giỏ mới
        if (!cart) {
            cart = new Cart({ userId, items: [], totalPrice: 0 });
        }

        // Kiểm tra xem máy này (cùng màu, cùng dung lượng) đã có trong giỏ chưa
        const existingItemIndex = cart.items.findIndex(i => 
            i.productType === 'PHONE' && 
            i.phoneModelId?.toString() === item.phoneModelId && 
            i.colorName === item.colorName && 
            i.capacity === item.capacity
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += 1; // Có rồi thì +1 số lượng
        } else {
            cart.items.push(item); // Chưa có thì thêm mới
        }

        // Tính lại tổng tiền
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
            cart.items = []; // Xóa sạch mảng sản phẩm
            cart.totalPrice = 0; // Đưa tổng tiền về 0
            await cart.save();
        }
        res.status(200).json({ success: true, message: "Đã dọn dẹp giỏ hàng" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getCartByUser, updateItemQuantity, removeCartItem, addToCart, clearCart };
