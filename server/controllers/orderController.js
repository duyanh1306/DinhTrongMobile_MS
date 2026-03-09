const Order = require("../models/Order");

// Lấy danh sách đơn hàng online của user
const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Thêm hàm lấy chi tiết 1 đơn hàng
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        // Populate selectedParts để nếu là máy tự dựng thì lấy được tên linh kiện
        const order = await Order.findById(id).populate('items.selectedParts', 'name price');
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = { getOrdersByUser, getOrderById };
