const PurchaseOrder = require("../models/Purchase_order");
const RepairOrder = require("../models/Repair_order");
const User = require("../models/User");
const TransferRequest = require("../models/Transfer_request");
const mongoose = require("mongoose");

const getDashboardStats = async (req, res) => {
  try {
    const { storeId } = req.query;

    let filter = {};
    let transferFilter = { status: "PENDING" };
    
    if (storeId && storeId !== "" && storeId !== "ALL") {
      filter.storeId = new mongoose.Types.ObjectId(storeId);
      transferFilter.$or = [
        { fromStore: new mongoose.Types.ObjectId(storeId) },
        { toStore: new mongoose.Types.ObjectId(storeId) }
      ];
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const completedSales = await PurchaseOrder.find({ ...filter, status: "Completed", orderType: "SALE" });
    const completedRepairs = await RepairOrder.find({ ...filter, status: "Completed" });
    
    const totalSaleRevenue = completedSales.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalRepairRevenue = completedRepairs.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalRevenue = totalSaleRevenue + totalRepairRevenue;

    const totalPurchaseOrders = await PurchaseOrder.countDocuments(filter);
    const totalRepairOrders = await RepairOrder.countDocuments(filter);
    const totalOrders = totalPurchaseOrders + totalRepairOrders;
    
    const uniqueCustomers = await PurchaseOrder.distinct("customerPhone", filter);
    const uniqueRepairCustomers = await RepairOrder.distinct("customerPhone", filter);
    const totalCustomersSet = new Set([...uniqueCustomers, ...uniqueRepairCustomers]);
    const totalCustomers = totalCustomersSet.size;

    const pendingTransfers = await TransferRequest.countDocuments(transferFilter);

    const getAggregateData = async (Model, matchQuery, groupByObj) => {
      return await Model.aggregate([
        { $match: matchQuery },
        { $group: { _id: groupByObj, total: { $sum: "$totalPrice" } } }
      ]);
    };

    const saleYearly = await getAggregateData(
      PurchaseOrder, 
      { ...filter, orderType: "SALE", status: "Completed", createdAt: { $gte: startOfYear, $lte: endOfYear } }, 
      { $month: "$createdAt" }
    );
    const repairYearly = await getAggregateData(
      RepairOrder, 
      { ...filter, status: "Completed", createdAt: { $gte: startOfYear, $lte: endOfYear } }, 
      { $month: "$createdAt" }
    );

    let yearlyChartData = [];
    for (let i = 1; i <= 12; i++) {
      const saleMonth = saleYearly.find(item => item._id === i);
      const repairMonth = repairYearly.find(item => item._id === i);
      yearlyChartData.push({
        name: `Tháng ${i}`,
        sale: saleMonth ? saleMonth.total : 0,
        repair: repairMonth ? repairMonth.total : 0
      });
    }

    const saleMonthly = await getAggregateData(
      PurchaseOrder, 
      { ...filter, orderType: "SALE", status: "Completed", createdAt: { $gte: startOfMonth, $lte: endOfMonth } }, 
      { $dayOfMonth: "$createdAt" }
    );
    const repairMonthly = await getAggregateData(
      RepairOrder, 
      { ...filter, status: "Completed", createdAt: { $gte: startOfMonth, $lte: endOfMonth } }, 
      { $dayOfMonth: "$createdAt" }
    );

    let monthlyChartData = [];
    const daysInMonth = endOfMonth.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const saleDay = saleMonthly.find(item => item._id === i);
      const repairDay = repairMonthly.find(item => item._id === i);
      monthlyChartData.push({
        name: `${i}/${now.getMonth() + 1}`,
        sale: saleDay ? saleDay.total : 0,
        repair: repairDay ? repairDay.total : 0
      });
    }

    const recentPurchase = await PurchaseOrder.find(filter).sort({ createdAt: -1 }).limit(5).populate("createdBy", "fullName");
    const recentRepair = await RepairOrder.find(filter).sort({ createdAt: -1 }).limit(5).populate("createdBy", "fullName");
    
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
      monthlyChartData,
      yearlyChartData,
      recentActivities
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats };