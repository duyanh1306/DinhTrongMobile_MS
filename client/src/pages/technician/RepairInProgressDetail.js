import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { ArrowLeft, Package, Store, Check, X, Smartphone, Wrench, CheckCircle } from "lucide-react";

const RepairInProgressDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [repairOrder, setRepairOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showItemTypeModal, setShowItemTypeModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  
  // Selection states
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [selectedItemTypes, setSelectedItemTypes] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmedItems, setConfirmedItems] = useState([]);
  
  // Data states
  const [phoneModels, setPhoneModels] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [userStore, setUserStore] = useState(null);

  useEffect(() => {
    fetchRepairOrderDetails();
    fetchUserData();
  }, [orderId]);

  const fetchUserData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.storeId) {
        setUserStore(user.storeId);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchRepairOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch repair order
      const orderResponse = await axiosClient.get(`/repair-orders/${orderId}`);
      setRepairOrder(orderResponse.data);
      
      // Fetch order details
      const detailsResponse = await axiosClient.get(`/repair-orders/${orderId}/details`);
      const details = detailsResponse.data;
      setOrderDetails(details);
      
      // Extract confirmed items from order details
      console.log('Order details received:', details);
      
      const confirmedItems = details.reduce((acc, detail) => {
        console.log('Processing detail:', detail);
        if (detail.itemIds && detail.itemIds.length > 0) {
          console.log('Found itemIds in detail:', detail.itemIds);
          // The itemIds array contains the actual item objects, not just IDs
          return acc.concat(detail.itemIds);
        }
        return acc;
      }, []);
      
      console.log('Confirmed items extracted:', confirmedItems);
      setConfirmedItems(confirmedItems);
      
      // Fetch phone models for modal
      const phoneModelsResponse = await axiosClient.get('/phone_models/all');
      const phoneModelsData = phoneModelsResponse.data?.data || phoneModelsResponse.data || [];
      setPhoneModels(Array.isArray(phoneModelsData) ? phoneModelsData : []);
      
      setLoading(false);
    } catch (err) {
      setError("Không thể tải chi tiết đơn sửa chữa");
      console.error("Error fetching repair order details:", err);
      setLoading(false);
    }
  };

  const fetchPhoneModels = async () => {
    try {
      const response = await axiosClient.get('/phone_models/all');
      // Handle different response formats
      const phoneModelsData = response.data?.data || response.data || [];
      setPhoneModels(Array.isArray(phoneModelsData) ? phoneModelsData : []);
    } catch (err) {
      console.error('Error fetching phone models:', err);
      setPhoneModels([]);
    }
  };

  const fetchRecipes = async (phoneModelId) => {
    try {
      const response = await axiosClient.get(`/recipes/all`);
      // Handle different response formats
      const recipesData = response.data?.data || response.data || [];
      const phoneRecipes = Array.isArray(recipesData) ? recipesData.filter(recipe => 
        recipe.phoneModelId?._id === phoneModelId || recipe.phoneModelId === phoneModelId
      ) : [];
      setRecipes(phoneRecipes);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setRecipes([]);
    }
  };

  const fetchItemsByItemType = async (itemTypeId) => {
    try {
      const response = await axiosClient.get(`/items?item_type=${itemTypeId}`);
      setAvailableItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handlePhoneSelect = (phone) => {
    setSelectedPhone(phone);
    setShowPhoneModal(false);
    setShowItemTypeModal(true);
    fetchRecipes(phone._id);
  };

  const handleItemTypeToggle = (itemTypeId) => {
    setSelectedItemTypes(prev => 
      prev.includes(itemTypeId) 
        ? prev.filter(id => id !== itemTypeId)
        : [...prev, itemTypeId]
    );
  };

  const handleShowItems = () => {
    if (selectedItemTypes.length === 0) return;
    
    setShowItemTypeModal(false);
    setShowItemsModal(true);
    
    // Fetch items for all selected item types
    const fetchAllItems = async () => {
      const allItems = [];
      for (const itemTypeId of selectedItemTypes) {
        try {
          const response = await axiosClient.get(`/items?item_type=${itemTypeId}`);
          // Handle different response formats
          const itemsData = response.data?.data || response.data || [];
          if (Array.isArray(itemsData)) {
            allItems.push(...itemsData);
          }
        } catch (err) {
          console.error(`Error fetching items for type ${itemTypeId}:`, err);
        }
      }
      setAvailableItems(allItems);
    };
    
    fetchAllItems();
  };

  const handleItemSelect = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected._id === item._id);
      if (exists) {
        return prev.filter(selected => selected._id !== item._id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleConfirmItems = () => {
    setShowItemsModal(false);
    // Here you would typically save the selected items to the repair order
    // For now, we'll just show the updated view
  };

  const calculateTotalPrice = () => {
    if (isOrderConfirmed() && repairOrder?.totalPrice) {
      return repairOrder.totalPrice;
    }
    
    const isWarranty = orderDetails.some(detail => detail.type === 'WARRANTY');
    if (isWarranty) {
      return 0;
    }
    
    const itemsToUse = isOrderConfirmed() ? confirmedItems : selectedItems;
    const itemsTotal = itemsToUse.reduce((sum, item) => sum + (item.price || 0), 0);
    const serviceTotal = orderDetails.reduce((sum, detail) => {
      return sum + (detail.serviceId?.price || 0);
    }, 0);
    return itemsTotal + serviceTotal;
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        itemIds: selectedItems.map(item => item._id),
        items: selectedItems // Send full item objects for transfer request creation
      };
      
      await axiosClient.put(`/repair-orders/${orderId}/details-with-transfer`, updateData);
      
      const totalPrice = calculateTotalPrice();
      
      await axiosClient.put(`/repair-orders/${orderId}`, { totalPrice });
      
      console.log('Transfer requests handled by backend');
      
      await fetchRepairOrderDetails();
      setShowPhoneModal(false);
      setShowItemTypeModal(false);
      setShowItemsModal(false);
      setSelectedItems([]);
      setSelectedItemTypes([]);
      
      alert('Đơn sửa chữa đã được xác nhận!');
    } catch (err) {
      console.error('Error confirming repair order:', err);
      alert('Lỗi khi xác nhận đơn sửa chữa');
    } finally {
      setLoading(false);
    }
  };

  // Handle complete repair order
  const handleComplete = async () => {
    try {
      setLoading(true);
      
      await axiosClient.put(`/repair-orders/${orderId}/complete`);
      
      // Refresh data
      await fetchRepairOrderDetails();
      
      alert('Đơn sửa chữa đã được hoàn thành!');
      
      // Navigate back to repair in progress list
      navigate("/tech/repair-in-progress");
    } catch (err) {
      console.error('Error completing repair order:', err);
      alert('Lỗi khi hoàn thành đơn sửa chữa');
    } finally {
      setLoading(false);
    }
  };

  const isItemInUserStore = (item) => {
    return userStore && item.storeId === userStore._id;
  };

  const getServiceName = () => {
    if (orderDetails.length === 0) return 'N/A';
    
    const serviceNames = orderDetails.map(detail => detail.serviceId?.name).filter(Boolean);
    return serviceNames.length > 0 ? serviceNames.join(', ') : 'N/A';
  };

  const isOrderConfirmed = () => {
    const hasItems = orderDetails.some(detail =>
      detail.itemIds && detail.itemIds.length > 0
    );
    
    const isVeSinhService = orderDetails.some(detail =>
      detail.serviceId?.name === 'Vệ sinh'
    );
    
    return hasItems || isVeSinhService;
  };

  const isWarrantyOrder = () => {
    return orderDetails.some(detail => detail.type === 'WARRANTY');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={fetchRepairOrderDetails}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tech/repair-in-progress")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn sửa chữa</h2>
        </div>
        
        {/* Show service name - skip if "Vệ sinh" */}
        {orderDetails.some(detail => detail.serviceId?.name !== 'Vệ sinh') && (
          <div className="flex gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-blue-800 font-medium">Dịch vụ: {getServiceName()}</span>
            </div>
            {isWarrantyOrder() && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-green-800 font-medium">Bảo hành</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repair Order Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin đơn sửa chữa</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Mã đơn</p>
            <p className="font-medium">#{orderId}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Khách hàng</p>
            <p className="font-medium">{repairOrder?.customerName || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Số điện thoại</p>
            <p className="font-medium">{repairOrder?.customerPhone || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Cửa hàng</p>
            <p className="font-medium">{repairOrder?.storeId?.name || 'N/A'}</p>
          </div>
        </div>

        {/* Phone Selection Button - Only show if not confirmed and not "Vệ sinh" service */}
        {!isOrderConfirmed() && orderDetails.some(detail => detail.serviceId?.name !== 'Vệ sinh') && (
          <div className="mt-6">
            <button
              onClick={() => {
                fetchPhoneModels();
                setShowPhoneModal(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Chọn điện thoại
            </button>
          </div>
        )}

        {/* Selected/Confirmed Items Display */}
        {(selectedItems.length > 0 || confirmedItems.length > 0) && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-3">
              {isOrderConfirmed() ? 'Linh kiện đã xác nhận' : 'Linh kiện đã chọn'}
            </h4>
            <div className="space-y-2">
              {(isOrderConfirmed() ? confirmedItems : selectedItems).map((item, index) => (
                <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{item.name}</span>
                    {item.serialCode && (
                      <span className="text-sm text-gray-500">(SN: {item.serialCode})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {item.price?.toLocaleString('vi-VN') || 0} đ
                    </span>
                    {isItemInUserStore(item) ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {item.storeId?.name}
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        {item.storeId?.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Price */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${isWarrantyOrder() ? 'text-green-600' : 'text-blue-600'}`}>
                  {calculateTotalPrice().toLocaleString('vi-VN')} đ
                </span>
                {isWarrantyOrder() && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    Miễn phí
                  </span>
                )}
              </div>
              {!isOrderConfirmed() && getServiceName() !== 'Vệ sinh' && (
                <button
                  onClick={handleConfirm}
                  disabled={selectedItems.length === 0}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận đơn
                </button>
              )}
              {isOrderConfirmed() && (
                <button
                  onClick={handleComplete}
                  disabled={repairOrder?.status === 'Completed'}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phone Selection Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Chọn mẫu điện thoại</h3>
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phoneModels.map((phone) => (
                  <div
                    key={phone._id}
                    onClick={() => handlePhoneSelect(phone)}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{phone.name}</p>
                        <p className="text-sm text-gray-500">Brand: {phone.brand?.name || phone.brand}</p>
                        {phone.image && (
                          <img 
                            src={phone.image} 
                            alt={phone.name}
                            className="w-16 h-16 object-cover rounded mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Type Selection Modal */}
      {showItemTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Chọn loại linh kiện cho {selectedPhone?.phoneModelId?.name}
                </h3>
                <button
                  onClick={() => setShowItemTypeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {recipes.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Dựa trên công thức, các loại linh kiện cần thiết:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipes[0]?.requiredParts?.map((part, index) => (
                      <div
                        key={part.itemTypeId._id}
                        onClick={() => handleItemTypeToggle(part.itemTypeId._id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedItemTypes.includes(part.itemTypeId._id)
                            ? 'bg-blue-50 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedItemTypes.includes(part.itemTypeId._id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedItemTypes.includes(part.itemTypeId._id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{part.itemTypeId.name}</p>
                            <p className="text-sm text-gray-500">{part.itemTypeId.code}</p>
                            <p className="text-sm text-blue-600">Số lượng: {part.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleShowItems}
                      disabled={selectedItemTypes.length === 0}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xem linh kiện ({selectedItemTypes.length} đã chọn)
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Không có công thức nào cho mẫu điện thoại này
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items Selection Modal */}
      {showItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[80vh] overflow-hidden m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Chọn linh kiện cụ thể</h3>
                <button
                  onClick={() => setShowItemsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {availableItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleItemSelect(item)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedItems.find(selected => selected._id === item._id)
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedItems.find(selected => selected._id === item._id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.find(selected => selected._id === item._id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.serialCode && (
                            <p className="text-sm text-gray-500">SN: {item.serialCode}</p>
                          )}
                          <p className="text-sm text-gray-600">{item.item_type?.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.price?.toLocaleString('vi-VN') || 0} đ
                        </span>
                        {isItemInUserStore(item) ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {item.storeId?.name}
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {item.storeId?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleConfirmItems}
                  disabled={selectedItems.length === 0}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận ({selectedItems.length} linh kiện)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairInProgressDetail;
