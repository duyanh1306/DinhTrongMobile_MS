import { useState, useEffect } from "react";
import { X, User, Phone, Store, Check, Wrench, Package, Search, XCircle, Smartphone } from "lucide-react";
import dayjs from "dayjs";
import { getAllRepairServices } from "../../../api/repairOrder";
import { getAllItems } from "../../../api/item";

const RepairDetailsModal = ({
  selectedOrder,
  showDetailsModal,
  onClose,
  onAccept,
  orderDetails,
}) => {
  const [repairServices, setRepairServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (showDetailsModal) {
      fetchRepairServices();
      fetchItems();
      if (orderDetails && orderDetails.length > 0) {
        const existingServiceIds = orderDetails.flatMap(detail => 
          detail.serviceId ? detail.serviceId.map(s => s._id) : []
        );
        setSelectedServices(existingServiceIds);
        const existingItemIds = orderDetails.flatMap(detail => 
          detail.itemId ? detail.itemId.map(i => i._id) : []
        );
        setSelectedItems(existingItemIds);
      }
    }
  }, [showDetailsModal, orderDetails]);

  const fetchRepairServices = async () => {
    try {
      setLoadingServices(true);
      const response = await getAllRepairServices();
      setRepairServices(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const response = await getAllItems();
      setItems(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const getSelectedServiceNames = () => {
    return repairServices
      .filter(service => selectedServices.includes(service._id))
      .map(service => service.name)
      .join(', ');
  };

  const getSelectedServiceTotal = () => {
    return repairServices
      .filter(service => selectedServices.includes(service._id))
      .reduce((total, service) => total + (service.price || 0), 0);
  };

  const getSelectedItemTotal = () => {
    return items
      .filter(item => selectedItems.includes(item._id))
      .reduce((total, item) => total + (item.price || 0), 0);
  };

  const getGrandTotal = () => {
    return getSelectedServiceTotal() + getSelectedItemTotal();
  };

  if (!showDetailsModal || !selectedOrder) return null;

  const detailWithPhone = orderDetails?.find(d => d.targetPhoneId) || null;
  const targetPhone = detailWithPhone?.targetPhoneId;

  const deviceName = targetPhone?.phoneModelId?.name || "Chưa xác định";
  const deviceId = targetPhone?.phoneModelId?._id || targetPhone?.phoneModelId || "";
  const deviceSerial = targetPhone?.imei || targetPhone?.serialCode || "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Chi tiết đơn sửa chữa #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dayjs(selectedOrder.repairOrderDate || selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> 
                  <span className="font-medium">{selectedOrder.customerName}</span>
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
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin thiết bị</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400" /> 
                  <span className="font-bold text-blue-700">{deviceName}</span>
                </div>
                {deviceSerial && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">S/N:</span> 
                    <span className="font-mono">{deviceSerial}</span>
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

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              Chọn dịch vụ sửa chữa
            </h4>
            
            {loadingServices ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Đang tải dịch vụ...
              </div>
            ) : repairServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có dịch vụ nào khả dụng
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {repairServices.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => handleServiceToggle(service._id)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedServices.includes(service._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedServices.includes(service._id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedServices.includes(service._id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-800">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-blue-600">
                        {service.price ? `${service.price.toLocaleString('vi-VN')} đ` : 'Liên hệ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-gray-700 mb-2">Dịch vụ đã chọn:</h5>
                <p className="text-sm text-gray-600 mb-2">{getSelectedServiceNames()}</p>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-700">Tổng dịch vụ:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {getSelectedServiceTotal().toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6 mt-6">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600" />
              Chọn linh kiện thay thế {deviceName !== "Chưa xác định" && `cho ${deviceName}`}
            </h4>
            
            {loadingItems ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                Đang tải linh kiện...
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có linh kiện nào khả dụng
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm linh kiện theo tên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {items
                    .filter(item => {
                      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                      let matchesDevice = true;
                      if (deviceId && (item.phoneModelId?._id || item.phoneModelId)) {
                        matchesDevice = (item.phoneModelId?._id || item.phoneModelId) === deviceId;
                      } else if (deviceName && deviceName !== "Chưa xác định") {
                        matchesDevice = item.name.toLowerCase().includes(deviceName.toLowerCase());
                      }
                      return matchesSearch && matchesDevice;
                    })
                    .map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleItemToggle(item._id)}
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          selectedItems.includes(item._id) ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedItems.includes(item._id)
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedItems.includes(item._id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 block">{item.name}</span>
                            {item.itemTypeId && (
                              <span className="text-xs text-gray-500">{item.itemTypeId.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600 text-sm">
                            {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Liên hệ'}
                          </span>
                        </div>
                      </div>
                    ))}
                  {items.filter(item => {
                    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                    let matchesDevice = true;
                    if (deviceId && (item.phoneModelId?._id || item.phoneModelId)) {
                      matchesDevice = (item.phoneModelId?._id || item.phoneModelId) === deviceId;
                    } else if (deviceName && deviceName !== "Chưa xác định") {
                      matchesDevice = item.name.toLowerCase().includes(deviceName.toLowerCase());
                    }
                    return matchesSearch && matchesDevice;
                  }).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Không tìm thấy linh kiện nào phù hợp với thiết bị này
                    </div>
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-gray-700 mb-2">Linh kiện đã chọn:</h5>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedItems.map(itemId => {
                        const item = items.find(i => i._id === itemId);
                        return item ? (
                          <span
                            key={itemId}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                          >
                            {item.name}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemToggle(itemId);
                              }}
                              className="hover:text-green-600"
                            >
                              <XCircle size={14} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="font-semibold text-gray-700">Tổng linh kiện:</span>
                      <span className="text-lg font-bold text-green-600">
                        {getSelectedItemTotal().toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {(selectedServices.length > 0 || selectedItems.length > 0) && (
          <div className="mt-auto p-4 bg-gray-100 border-t border-gray-300 flex justify-between items-center">
            <div>
              <span className="font-bold text-gray-800 text-lg">Tổng thanh toán:</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {getGrandTotal().toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}

        <div className="p-6 border-t bg-gray-50 flex justify-end items-center gap-3">
          {selectedOrder.status === "Pending" && onAccept && (
            <button
              onClick={() => {
                onAccept(selectedOrder._id, selectedServices, selectedItems);
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Xác nhận
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairDetailsModal;