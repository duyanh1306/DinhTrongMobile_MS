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
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // Selection states
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [selectedItemTypes, setSelectedItemTypes] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [itemTypeSelections, setItemTypeSelections] = useState({}); // Track selected items per item type
  const [currentItemTypeForItems, setCurrentItemTypeForItems] = useState(null); // Track which item type we're selecting items for
  
  // Data states
  const [phoneModels, setPhoneModels] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
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

  const fetchServices = async () => {
    try {
      const response = await axiosClient.get('/repair_services');
      const servicesData = response.data?.data || response.data || [];
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices([]);
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
      
      // Set selected service from order details
      if (details.length > 0 && details[0].serviceId) {
        setSelectedService(details[0].serviceId);
      }
      
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
      
      // Fetch services
      await fetchServices();
      
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
    setSelectedItemTypes(prev => {
      const newSelections = prev.includes(itemTypeId) 
        ? prev.filter(id => id !== itemTypeId)
        : [...prev, itemTypeId];
      
      // If unchecking, remove the selected item for this type
      if (!newSelections.includes(itemTypeId)) {
        handleRemoveItemForType(itemTypeId);
      }
      
      return newSelections;
    });
  };

  const handleShowItemsForType = async (itemTypeId) => {
    setCurrentItemTypeForItems(itemTypeId);
    setShowItemTypeModal(false);
    setShowItemsModal(true);
    
    try {
      const response = await axiosClient.get(`/items?item_type=${itemTypeId}`);
      const itemsData = response.data?.data || response.data || [];
      setAvailableItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error(`Error fetching items for type ${itemTypeId}:`, err);
      setAvailableItems([]);
    }
  };

  const handleItemSelectForType = (item) => {
    // Only allow one item per item type
    setItemTypeSelections(prev => ({
      ...prev,
      [currentItemTypeForItems]: item
    }));
    
    setShowItemsModal(false);
    setShowItemTypeModal(true);
  };

  const handleRemoveItemForType = (itemTypeId) => {
    setItemTypeSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[itemTypeId];
      return newSelections;
    });
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceModal(false);
    
    // Clear item type selections if switching to service that doesn't require phone
    if (!isPhoneRequiredServiceForService(service)) {
      setSelectedItemTypes([]);
      setItemTypeSelections({});
      setSelectedPhone(null);
    }
  };

  const isPhoneRequiredServiceForService = (service) => {
    if (!service) return false;
    const excludedServices = ['Vệ sinh', 'Chạy phần mềm', 'Mở khóa'];
    return !excludedServices.includes(service.name);
  };

  const handleShowItems = () => {
    // This function is no longer needed with the new flow
    // Individual item selection is handled per item type
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
    
    const itemsToUse = isOrderConfirmed() ? confirmedItems : Object.values(itemTypeSelections);
    const itemsTotal = itemsToUse.reduce((sum, item) => sum + (item.price || 0), 0);
    
    // Use selected service for unconfirmed orders, or existing service for confirmed orders
    const serviceToUse = isOrderConfirmed() 
      ? (orderDetails[0]?.serviceId || null)
      : selectedService;
    const serviceTotal = serviceToUse ? serviceToUse.price || 0 : 0;
    
    return itemsTotal + serviceTotal;
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      // Convert item type selections to flat array of items
      const selectedItemsArray = Object.values(itemTypeSelections);
      
      console.log('Confirming order with service:', selectedService);
      console.log('Selected items:', selectedItemsArray);
      
      const updateData = {
        itemIds: selectedItemsArray.map(item => item._id),
        items: selectedItemsArray, // Send full item objects for transfer request creation
        serviceId: selectedService?._id
      };
      
      console.log('=== FRONTEND DEBUG ===');
      console.log('Sending updateData:', updateData);
      console.log('serviceId being sent:', selectedService?._id);
      console.log('=== END FRONTEND DEBUG ===');
      
      // Update order details with service and items
      const detailsResponse = await axiosClient.put(`/repair-orders/${orderId}/details-with-transfer`, updateData);
      console.log('Details update response:', detailsResponse.data);
      
      const totalPrice = calculateTotalPrice();
      
      // Update main repair order with total price and service
      const orderUpdateData = { 
        totalPrice,
        serviceId: selectedService?._id // Ensure service is also saved to main order
      };
      
      const orderResponse = await axiosClient.put(`/repair-orders/${orderId}`, orderUpdateData);
      console.log('Order update response:', orderResponse.data);
      
      console.log('Transfer requests handled by backend');
      
      await fetchRepairOrderDetails();
      setShowPhoneModal(false);
      setShowItemTypeModal(false);
      setShowItemsModal(false);
      setShowServiceModal(false);
      setSelectedItems([]);
      setSelectedItemTypes([]);
      setItemTypeSelections({});
      
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
    if (isOrderConfirmed()) {
      // For confirmed orders, use existing service from order details
      if (orderDetails.length === 0) return 'N/A';
      const serviceNames = orderDetails.map(detail => detail.serviceId?.name).filter(Boolean);
      return serviceNames.length > 0 ? serviceNames.join(', ') : 'N/A';
    } else {
      // For unconfirmed orders, use selected service
      return selectedService?.name || 'N/A';
    }
  };

  const isOrderConfirmed = () => {
    const hasItems = orderDetails.some(detail =>
      detail.itemIds && detail.itemIds.length > 0
    );
    
    const autoConfirmServices = ['Vệ sinh', 'Chạy phần mềm', 'Mở khóa'];
    const isAutoConfirmService = orderDetails.some(detail =>
      detail.serviceId?.name && autoConfirmServices.includes(detail.serviceId.name)
    );
    
    return hasItems || isAutoConfirmService;
  };

  const isPhoneRequiredService = () => {
    return isPhoneRequiredServiceForService(selectedService);
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
        
        {/* Show service name */}
        {getServiceName() !== 'N/A' && (
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
        {!isOrderConfirmed() && (
          <div className="mt-6 space-y-4">
            {/* Service Selection */}
            <div>
              <button
                onClick={() => {
                  setShowServiceModal(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                {selectedService ? `Đổi dịch vụ: ${selectedService.name}` : 'Chọn dịch vụ sửa chữa'}
              </button>
            </div>
            
            {/* Phone Selection - Only show if service requires phone */}
            {isPhoneRequiredService() && (
              <div>
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
          </div>
        )}

        {/* Selected/Confirmed Items Display */}
        {((Object.keys(itemTypeSelections).length > 0 && !isOrderConfirmed()) || confirmedItems.length > 0) && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-3">
              {isOrderConfirmed() ? 'Linh kiện đã xác nhận' : 'Linh kiện đã chọn'}
            </h4>
            <div className="space-y-2">
              {(isOrderConfirmed() ? confirmedItems : Object.values(itemTypeSelections)).map((item, index) => (
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
              {!isOrderConfirmed() && (
                <button
                  onClick={handleConfirm}
                  disabled={!selectedService || (isPhoneRequiredService() && Object.keys(itemTypeSelections).length === 0)}
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

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Chọn dịch vụ sửa chữa</h3>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => handleServiceSelect(service)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedService?._id === service._id
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedService?._id === service._id
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedService?._id === service._id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-gray-500">{service.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {service.price?.toLocaleString('vi-VN') || 0} đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <div className="space-y-6">
                  {/* Available Item Types Section */}
                  <div>
                    <p className="text-gray-600 mb-3">Dựa trên công thức, các loại linh kiện cần thiết:</p>
                    <div className="space-y-2">
                      {recipes[0]?.requiredParts?.map((part, index) => {
                        const itemTypeId = part.itemTypeId._id;
                        const isSelected = selectedItemTypes.includes(itemTypeId);
                        const hasSelectedItem = itemTypeSelections[itemTypeId];
                        
                        return (
                          <div key={itemTypeId} className="border rounded p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`item-type-${itemTypeId}`}
                                  checked={isSelected}
                                  onChange={() => handleItemTypeToggle(itemTypeId)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <label 
                                    htmlFor={`item-type-${itemTypeId}`}
                                    className="font-medium cursor-pointer text-sm"
                                  >
                                    {part.itemTypeId.name}
                                  </label>
                                  <p className="text-xs text-gray-500">{part.itemTypeId.code}</p>
                                  <p className="text-xs text-blue-600">Số lượng: {part.quantity}</p>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  {hasSelectedItem ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-green-600 font-medium">
                                        {hasSelectedItem.name}
                                      </span>
                                      <button
                                        onClick={() => handleRemoveItemForType(itemTypeId)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleShowItemsForType(itemTypeId)}
                                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                    >
                                      Chọn linh kiện
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t-2 border-gray-300 my-4"></div>

                  {/* Chosen Items Section */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Linh kiện đã chọn:</h4>
                    {Object.keys(itemTypeSelections).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(itemTypeSelections).map(([itemTypeId, selectedItem]) => {
                          const itemType = recipes[0]?.requiredParts?.find(part => part.itemTypeId._id === itemTypeId)?.itemTypeId;
                          return (
                            <div key={itemTypeId} className="border rounded p-2 bg-green-50 border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded border border-green-500 bg-green-500 flex items-center justify-center">
                                    <Check className="w-2 h-2 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-green-800 text-sm">{selectedItem.name}</p>
                                    <p className="text-xs text-gray-600">Loại: {itemType?.name}</p>
                                    {selectedItem.serialCode && (
                                      <p className="text-xs text-gray-500">SN: {selectedItem.serialCode}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-green-700 text-sm">
                                    {selectedItem.price?.toLocaleString('vi-VN') || 0} đ
                                  </span>
                                  <button
                                    onClick={() => handleRemoveItemForType(itemTypeId)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-3 bg-gray-50 rounded text-sm">
                        Chưa có linh kiện nào được chọn
                      </p>
                    )}
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
                <h3 className="text-xl font-bold text-gray-800">
                  Chọn linh kiện cụ thể - {currentItemTypeForItems && recipes[0]?.requiredParts?.find(part => part.itemTypeId._id === currentItemTypeForItems)?.itemTypeId?.name}
                </h3>
                <button
                  onClick={() => {
                    setShowItemsModal(false);
                    setShowItemTypeModal(true);
                  }}
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
                    onClick={() => handleItemSelectForType(item)}
                    className="border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairInProgressDetail;
