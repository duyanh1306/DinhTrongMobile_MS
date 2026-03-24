import { useState, useEffect } from "react";
import { X, User, Phone, Store, ChevronDown, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { getAllRepairServices, updateRepairOrderDetail } from "../../../api/repairOrder";

const RepairDetailsModal = ({ 
  selectedOrder, 
  orderDetails, 
  showDetailsModal, 
  onClose,
  onOrderUpdate,
  onAccept
}) => {
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [updatingService, setUpdatingService] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const isReadonly = selectedOrder?.status !== "Pending";

  useEffect(() => {
    if (showDetailsModal) {
      fetchAvailableServices();
    }
  }, [showDetailsModal]);

  const fetchAvailableServices = async () => {
    setLoadingServices(true);
    try {
      const response = await getAllRepairServices();
      if (response.success && response.data) {
        setAvailableServices(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch repair services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceChange = async (detailIndex, newServiceId, isChecked) => {

    if (isReadonly) return;

    const detail = orderDetails[detailIndex];
    if (!detail || !selectedOrder) return;

    setUpdatingService(detailIndex);
    try {

      const currentServiceIds = Array.isArray(detail.serviceId)
        ? detail.serviceId.map(s => s._id || s)
        : (detail.serviceId?._id ? [detail.serviceId._id] : []);

      const updatedServices = isChecked
        ? [...currentServiceIds, newServiceId]
        : currentServiceIds.filter(id => id !== newServiceId);
      
      const updateData = {
        serviceId: updatedServices.length > 0 ? updatedServices : null
      };

      const response = await updateRepairOrderDetail(selectedOrder._id, updateData);

      if (response.success) {
        if (onOrderUpdate) {
          onOrderUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to update service:', error);
    } finally {
      setUpdatingService(null);
      setOpenDropdowns({ ...openDropdowns, [detailIndex]: false });
    }
  };

  useEffect(() => {
    if (!showDetailsModal) {
      setOpenDropdowns({});
    }
  }, [showDetailsModal]);

  const calculateTotalPrice = () => {
    if (!orderDetails || orderDetails.length === 0) return 0;
    
    return orderDetails.reduce((total, detail) => {
      if (detail.serviceId) {
        if (Array.isArray(detail.serviceId)) {
          total += detail.serviceId.reduce((sum, s) => sum + (s.price || 0), 0);
        } else {
          total += detail.serviceId.price || 0;
        }
      }
      
      if (detail.itemIds && detail.itemIds.length > 0) {
        total += detail.itemIds.reduce((sum, item) => sum + (item.price || 0), 0);
      }
      
      return total;
    }, 0);
  };

  const totalPrice = calculateTotalPrice();

  if (!showDetailsModal || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Chi tiết đơn sửa chữa #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dayjs(selectedOrder.repairOrderDate).format('DD/MM/YYYY HH:mm')}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-600 bg-white p-1 rounded-md shadow-sm border"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> 
                  <span>{selectedOrder.customerName}</span>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> 
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin cửa hàng</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-400" /> 
                  <span>{selectedOrder.storeId?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Mã cửa hàng:</span> 
                  <span className="font-mono">{selectedOrder.storeId?.code || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Chi tiết dịch vụ</h4>
            {orderDetails.length > 0 ? (
              <div className="space-y-3">
                {orderDetails.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      {detail.serviceId && (
                        <div>
                          <span className="text-sm text-gray-500">Dịch vụ:</span>
                          <div className="relative mt-2 border rounded-md p-3 bg-white">
                            {loadingServices ? (
                              <div className="text-center py-2">
                                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                                Đang tải dịch vụ...
                              </div>
                            ) : availableServices.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {availableServices.map((service) => {
                                  const currentServiceIds = Array.isArray(detail.serviceId)
                                    ? detail.serviceId.map(s => s._id || s)
                                    : (detail.serviceId?._id ? [detail.serviceId._id] : []);
                                  const isChecked = currentServiceIds.includes(service._id);
                                  
                                  return (
                                    <label key={service._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handleServiceChange(index, service._id, e.target.checked)}
                                        disabled={updatingService === index || isReadonly}
                                        className="w-4 h-4 cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-900">{service.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          {service.price?.toLocaleString('vi-VN') || 0} đ
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Không có dịch vụ nào</p>
                            )}
                          </div>
                        </div>
                      )}
                      {detail.targetPhoneId && (
                        <div>
                          <span className="text-sm text-gray-500">Thiết bị:</span>
                          <p className="font-medium">
                            {detail.targetPhoneId.phoneModelId?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            Mã: {detail.targetPhoneId._id?.substring(detail.targetPhoneId._id.length - 6).toUpperCase() || 'N/A'}
                          </p>
                        </div>
                      )}
                      {detail.itemIds && detail.itemIds.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-gray-500">Linh kiện thay thế:</span>
                          <div className="mt-2 space-y-2 border-t pt-2">
                            {detail.itemIds.map((item, itemIndex) => (
                              <div key={itemIndex} className="text-sm flex justify-between bg-white p-2 rounded border">
                                <span className="font-medium">
                                  {item.name} <span className="text-xs text-gray-400 font-normal ml-2">(SN: {item.serialCode})</span>
                                </span>
                                <span className="text-gray-800 font-bold">
                                  {item.price?.toLocaleString('vi-VN') || 0} đ
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Không có chi tiết dịch vụ nào</p>
            )}
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
            <span className="text-2xl font-black text-blue-600">
              {totalPrice.toLocaleString('vi-VN')}
            </span>
          </div>
          {selectedOrder.status === "Pending" && onAccept && (
            <button
              onClick={() => {
                onAccept(selectedOrder._id);
                onClose();
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Thực hiện
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairDetailsModal;
