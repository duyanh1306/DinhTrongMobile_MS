import React from "react";
import { X, User, Phone, Store } from "lucide-react";
import dayjs from "dayjs";

const RepairDetailsModal = ({ 
  selectedOrder, 
  orderDetails, 
  showDetailsModal, 
  onClose 
}) => {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detail.serviceId && (
                        <div>
                          <span className="text-sm text-gray-500">Dịch vụ:</span>
                          <p className="font-medium">{detail.serviceId.name}</p>
                          <p className="text-sm text-gray-600">
                            {detail.serviceId.price?.toLocaleString('vi-VN') || 0} đ
                          </p>
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
              <p className="text-gray-500 text-center py-4 italic">Không có chi tiết dịch vụ</p>
            )}
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
          <span className="text-2xl font-black text-blue-600">
            {selectedOrder.totalPrice?.toLocaleString('vi-VN') || 0} đ
          </span>
        </div>
      </div>
    </div>
  );
};

export default RepairDetailsModal;
