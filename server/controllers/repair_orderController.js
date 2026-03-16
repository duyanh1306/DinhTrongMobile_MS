const RepairOrder = require("../models/Repair_order");
const RepairOrderDetail = require("../models/Repair_order_detail");
const mongoose = require("mongoose");

const getAllRepairOrders = async (req, res) => {
  try {
    console.log('Full user object from JWT:', req.user);
    
    // Get user's store from staff assignment
    let userStoreId = null;
    
    // First check if user has direct storeId in JWT
    if (req.user && req.user.storeId) {
      userStoreId = req.user.storeId;
      console.log('User has storeId directly from JWT:', userStoreId);
    }
    
    // Also check if user has storeId in their User document
    const User = require("../models/User");
    const userDoc = await User.findById(req.user.id);
    console.log('User document from DB:', userDoc);
    
    if (userDoc && userDoc.storeId) {
      userStoreId = userDoc.storeId;
      console.log('Found storeId in User document:', userStoreId);
    }
    
    // If still no storeId found, look in Store.staff array
    if (!userStoreId) {
      console.log('=== STORE LOOKUP DEBUG START ===');
      console.log('No direct storeId found, looking for user in Store.staff array...');
      console.log('Searching for user ID:', req.user?.id);
      
      const Store = require("../models/Store");
      // Convert string ID to ObjectId for proper comparison
      const userId = new mongoose.Types.ObjectId(req.user?.id);
      console.log('Converted to ObjectId:', userId);
      
      // First, let's see all stores
      const allStores = await Store.find({});
      console.log('=== ALL STORES IN DATABASE ===');
      allStores.forEach((store, index) => {
        console.log(`Store ${index + 1}: ${store.name} (${store._id})`);
        console.log(`Staff array:`, store.staff);
        console.log(`Staff count: ${store.staff ? store.staff.length : 0}`);
        console.log('---');
      });
      
      const userStore = await Store.findOne({ staff: userId });
      console.log('=== STORE LOOKUP RESULT ===');
      console.log('Found user store:', userStore);
      
      if (userStore) {
        userStoreId = userStore._id;
        console.log('User store ID from staff lookup:', userStoreId);
      } else {
        console.log('User not found in any store staff array');
      }
      console.log('=== STORE LOOKUP DEBUG END ===');
    }

    console.log('User ID:', req.user?.id);
    console.log('User store ID:', userStoreId);

    // Build query with store filter if user has a store
    let query = RepairOrder.find();
    if (userStoreId) {
      query = query.where({ storeId: userStoreId });
    }

    const orders = await query
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: 1 });

    // Add repair type to each order
    const ordersWithType = await Promise.all(
      orders.map(async (order) => {
        const details = await RepairOrderDetail.findOne({ repairOrderId: order._id });
        return {
          ...order.toObject(),
          repairType: details ? (details.type === "REPAIR" ? "Sửa chữa" : "Bảo hành") : "N/A"
        };
      })
    );

    res.status(200).json(ordersWithType);
  } catch (error) {
    console.error('Error in getAllRepairOrders:', error);
    res.status(500).json({ error: error.message });
  }
};

const getRepairOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id)
      .populate("storeId", "name code")
      .populate("createdBy", "fullName");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFilteredRepairOrders = async (req, res) => {
  try {
    const { status, type, storeId } = req.query;
    
    console.log('Full user object from JWT:', req.user);
    
    // Get user's store from staff assignment
    let userStoreId = null;
    
    // First check if user has direct storeId in JWT
    if (req.user && req.user.storeId) {
      userStoreId = req.user.storeId;
      console.log('User has storeId directly from JWT:', userStoreId);
    }
    
    // Also check if user has storeId in their User document
    const User = require("../models/User");
    const userDoc = await User.findById(req.user.id);
    console.log('User document from DB:', userDoc);
    
    if (userDoc && userDoc.storeId) {
      userStoreId = userDoc.storeId;
      console.log('Found storeId in User document:', userStoreId);
    }
    
    // If still no storeId found, look in Store.staff array
    if (!userStoreId) {
      console.log('=== FILTERED STORE LOOKUP DEBUG START ===');
      console.log('No direct storeId found, looking for user in Store.staff array...');
      console.log('Searching for user ID:', req.user?.id);
      
      const Store = require("../models/Store");
      // Convert string ID to ObjectId for proper comparison
      const userId = new mongoose.Types.ObjectId(req.user?.id);
      console.log('Converted to ObjectId:', userId);
      
      // First, let's see all stores
      const allStores = await Store.find({});
      console.log('=== ALL STORES IN DATABASE (FILTERED) ===');
      allStores.forEach((store, index) => {
        console.log(`Store ${index + 1}: ${store.name} (${store._id})`);
        console.log(`Staff array:`, store.staff);
        console.log(`Staff count: ${store.staff ? store.staff.length : 0}`);
        console.log('---');
      });
      
      const userStore = await Store.findOne({ staff: userId });
      console.log('=== FILTERED STORE LOOKUP RESULT ===');
      console.log('Found user store:', userStore);
      
      if (userStore) {
        userStoreId = userStore._id;
        console.log('User store ID from staff lookup:', userStoreId);
      } else {
        console.log('User not found in any store staff array');
      }
      console.log('=== FILTERED STORE LOOKUP DEBUG END ===');
    }
    
    console.log('Filtered orders - User ID:', req.user?.id);
    console.log('Filtered orders - User store ID:', userStoreId);
    
    // Build base query
    let query = RepairOrder.find();
    
    // Add status filter if provided
    if (status && status !== 'ALL') {
      query = query.where({ status: status });
    }
    
    // Always apply user store filter if user has a store
    if (userStoreId) {
      query = query.where({ storeId: userStoreId });
    } else if (storeId && storeId !== 'ALL') {
      // If no user store, allow store filter from query params
      query = query.where({ storeId: storeId });
    }
    
    // Get initial orders with basic population
    let orders = await query
      .populate("storeId", "name code")
      .populate("createdBy", "fullName")
      .sort({ repairOrderDate: 1 });
    
    // If type filter is provided, we need to filter based on repair order details
    if (type && type !== 'ALL') {
      // Get all order IDs that have details with the specified type
      const orderIdsWithType = await RepairOrderDetail.find({ type: type })
        .distinct('repairOrderId');
      
      // Convert orderIdsWithType to strings for comparison
      const orderIdsWithString = orderIdsWithType.map(id => id.toString());
      
      // Filter orders to only include those with the specified type
      orders = orders.filter(order => orderIdsWithString.includes(order._id.toString()));
    }
    
    // Add repair type to each order
    const ordersWithType = await Promise.all(
      orders.map(async (order) => {
        const details = await RepairOrderDetail.findOne({ repairOrderId: order._id });
        return {
          ...order.toObject(),
          repairType: details ? (details.type === "REPAIR" ? "Sửa chữa" : "Bảo hành") : "N/A"
        };
      })
    );
    
    res.status(200).json(ordersWithType);
  } catch (error) {
    console.error('Error in getFilteredRepairOrders:', error);
    res.status(500).json({ error: error.message });
  }
};

const getRepairOrderDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    const details = await RepairOrderDetail.find({ repairOrderId: id })
      // 1. Cập nhật: Sử dụng "serviceId" thay vì "repairServiceId" theo Schema mới
      .populate("serviceId", "name price")
      
      // 2. Cập nhật: Populate cho mảng "itemIds" và "targetPhoneId"
      .populate({
        path: "itemIds",
        select: "name serialCode item_type price",
        populate: { 
          path: "item_type", 
          select: "name price" 
        }
      })
      .populate({
        path: "targetPhoneId",
        select: "imei colorName capacity",
        populate: { path: "phoneModelId", select: "name" }
      });

    if (!details || details.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
    }

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Chỉ có thể chấp nhận đơn đang ở trạng thái chờ xử lý" });
    }
    
    order.status = "In Progress";
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã được chấp nhận", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Không thể hủy đơn đã hoàn thành" });
    }
    
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Đơn đã bị hủy trước đó" });
    }
    
    order.status = "Cancelled";
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã bị hủy", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPrice } = req.body;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (totalPrice !== undefined) {
      order.totalPrice = totalPrice;
    }
    
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã được cập nhật", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRepairOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds } = req.body;
    
    // Find and update the repair order details
    const details = await RepairOrderDetail.findOne({ repairOrderId: id });
    
    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
    }
    
    if (itemIds !== undefined) {
      details.itemIds = itemIds;
    }
    
    await details.save();
    
    res.status(200).json({ message: "Chi tiết đơn sửa chữa đã được cập nhật", details });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update repair order details with transfer request creation
const updateRepairOrderDetailsWithTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds, items, serviceId } = req.body; // Add serviceId destructuring
    
    console.log('=== UPDATE REPAIR ORDER DETAILS DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Extracted values:', { 
      itemIds: itemIds ? `${itemIds.length} items` : 'undefined',
      items: items ? `${items.length} items` : 'undefined',
      serviceId: serviceId || 'undefined'
    });
    
    // Find the repair order to get store information
    const repairOrder = await RepairOrder.findById(id);
    if (!repairOrder) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    // Find and update the repair order details
    const details = await RepairOrderDetail.findOne({ repairOrderId: id });
    
    if (!details) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn sửa chữa" });
    }
    
    console.log('Current repair order details before update:');
    console.log('- Current serviceId:', details.serviceId);
    console.log('- Current itemIds count:', details.itemIds ? details.itemIds.length : 0);
    
    // Update itemIds if provided
    if (itemIds !== undefined) {
      details.itemIds = itemIds;
      console.log('Updated itemIds to:', itemIds);
    }
    
    // Update serviceId if provided
    if (serviceId !== undefined) {
      console.log('Attempting to update serviceId from', details.serviceId, 'to', serviceId);
      details.serviceId = serviceId;
      console.log('Set serviceId to:', serviceId);
    } else {
      console.log('No serviceId provided in request');
    }
    
    console.log('Details before save:', {
      serviceId: details.serviceId,
      itemIds: details.itemIds
    });
    
    await details.save();
    
    console.log('Details after save:', {
      serviceId: details.serviceId,
      itemIds: details.itemIds
    });
    console.log('Repair order details saved successfully');
    console.log('=== END DEBUG ===');
    
    // Create transfer requests for items not in current store
    let transferRequests = [];
    if (items && items.length > 0) {
      console.log('Items received for transfer request creation:', items);
      console.log('Current store ID:', repairOrder.storeId);
      
      // Check which items need transfer
      const itemsNeedingTransfer = items.filter(item => {
        const itemStoreId = item.storeId?._id || item.storeId;
        const needsTransfer = itemStoreId && itemStoreId !== repairOrder.storeId;
        console.log(`Item ${item.name} - Store: ${itemStoreId}, Current: ${repairOrder.storeId}, Needs Transfer: ${needsTransfer}`);
        return needsTransfer;
      });
      
      console.log(`Items needing transfer: ${itemsNeedingTransfer.length}`);
      
      if (itemsNeedingTransfer.length > 0) {
        const { createTransferRequestForRepairOrder } = require("./transfer_requestController");
        
        try {
          // Use a default user ID if no authenticated user (for system-generated requests)
          const requestedBy = req.user?.id || repairOrder.createdBy || new mongoose.Types.ObjectId();
          
          transferRequests = await createTransferRequestForRepairOrder(
            id,
            itemsNeedingTransfer,
            repairOrder.storeId,
            requestedBy
          );
          console.log(`Created ${transferRequests.length} transfer requests for repair order ${id}`);
        } catch (transferError) {
          console.error('Transfer request creation failed:', transferError);
          // Continue with order update even if transfer fails
        }
      } else {
        console.log('No items need transfer - all items are in current store');
      }
    } else {
      console.log('No items provided for transfer request creation');
    }
    
    res.status(200).json({ 
      message: "Chi tiết đơn sửa chữa đã được cập nhật", 
      details,
      transferRequests: transferRequests
    });
  } catch (error) {
    console.error('Error in updateRepairOrderDetailsWithTransfer:', error);
    res.status(500).json({ error: error.message });
  }
};

// Complete repair order
const completeRepairOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await RepairOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn sửa chữa" });
    }
    
    if (order.status === "Completed") {
      return res.status(400).json({ message: "Đơn sửa chữa đã hoàn thành" });
    }
    
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Không thể hoàn thành đơn đã bị hủy" });
    }
    
    if (order.status !== "In Progress") {
      return res.status(400).json({ message: "Chỉ có thể hoàn thành đơn đang trong tiến trình" });
    }
    
    order.status = "Completed";
    await order.save();
    
    res.status(200).json({ message: "Đơn sửa chữa đã được hoàn thành", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllRepairOrders,
  getRepairOrderById,
  getFilteredRepairOrders,
  getRepairOrderDetailsById,
  updateRepairOrder,
  updateRepairOrderDetails,
  updateRepairOrderDetailsWithTransfer,
  completeRepairOrder,
  acceptRepairOrder,
  cancelRepairOrder,
};
