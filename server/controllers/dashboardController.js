const PurchaseOrder = require("../models/Purchase_order");
const RepairOrder = require("../models/Repair_order");
const User = require("../models/User");
const TransferRequest = require("../models/Transfer_request");

const getDashboardStats = async (req, res) => {
  try {
    // 1. Tính tổng doanh thu (Đơn bán + Đơn sửa chữa đã hoàn thành)
    const completedSales = await PurchaseOrder.find({ status: "Completed", orderType: "SALE" });
    const completedRepairs = await RepairOrder.find({ status: "Completed" });
    
    const totalSaleRevenue = completedSales.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalRepairRevenue = completedRepairs.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalRevenue = totalSaleRevenue + totalRepairRevenue;

    // 2. Tính tổng đơn hàng và khách hàng
    const totalOrders = await PurchaseOrder.countDocuments() + await RepairOrder.countDocuments();
    
    // Tìm Role của Khách hàng (Giả sử bạn có Role tên là CUSTOMER)
    // Để đơn giản, ở đây đếm tổng User, bạn có thể filter thêm roleId
    const totalCustomers = await User.countDocuments();

    // 3. Đếm số yêu cầu chuyển kho đang chờ duyệt
    const pendingTransfers = await TransferRequest.countDocuments({ status: "PENDING" });

    // 4. Dữ liệu Biểu đồ (Giả lập nhóm theo tháng cho 6 tháng)
    // Trong thực tế, bạn nên dùng MongoDB Aggregation ($group theo tháng). 
    // Dưới đây là dữ liệu mẫu trả về để Frontend vẽ biểu đồ.
    const chartData = [
      { name: "Tháng 9", sale: 40000000, repair: 24000000 },
      { name: "Tháng 10", sale: 30000000, repair: 13980000 },
      { name: "Tháng 11", sale: 20000000, repair: 58000000 },
      { name: "Tháng 12", sale: 27800000, repair: 39080000 },
      { name: "Tháng 1", sale: 18900000, repair: 48000000 },
      { name: "Tháng 2", sale: 23900000, repair: 38000000 },
    ];

    // 5. Hoạt động gần đây (Lấy 5 đơn Purchase/Repair mới nhất)
    const recentPurchase = await PurchaseOrder.find().sort({ createdAt: -1 }).limit(3).populate("createdBy", "fullName");
    const recentRepair = await RepairOrder.find().sort({ createdAt: -1 }).limit(2).populate("createdBy", "fullName");
    
    // Gộp và sắp xếp lại
    const recentActivities = [...recentPurchase, ...recentRepair]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(item => ({
        id: item._id,
        type: item.orderType ? "Bán hàng" : "Sửa chữa",
        customer: item.customerName,
        staff: item.createdBy?.fullName || "Hệ thống",
        time: item.createdAt
      }));

    res.status(200).json({
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        pendingTransfers
      },
      chartData,
      recentActivities
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats };