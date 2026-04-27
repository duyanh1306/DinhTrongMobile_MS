import React from "react";
import { Eye, CheckCircle, XCircle, Wrench } from "lucide-react";
import dayjs from "dayjs";

const RepairOrdersTable = ({
  filteredOrders,
  filterLoading,
  viewMode,
  onViewDetails,
  onAccept,
  onCancel,
  onComplete,
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Pending": return "Chờ xử lý";
      case "In Progress": return "Đang sửa";
      case "Completed": return "Hoàn thành";
      case "Cancelled": return "Đã hủy";
      default: return status;
    }
  };

  if (filterLoading) {
    return <div className="text-center py-10 italic text-gray-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm">Mã đơn</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Khách hàng</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Thiết bị</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tổng giá</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Ngày tạo</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500 italic">
                  Không có đơn sửa chữa nào
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm">
                    #{order._id?.substring(order._id.length - 6).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="p-4">
  <div className="text-sm text-gray-800 font-medium">
    {order.phoneModelId?.name || order.phoneName || order.phoneModel || "Chưa xác định"}
  </div>
</td>
                  <td className="p-4 font-bold text-red-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice || 0)}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {dayjs(order.repairOrderDate || order.createdAt).format('DD/MM/YYYY HH:mm')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusBadge(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {viewMode === "PENDING" && order.status === "Pending" && (
                        <>
                          <button
                            onClick={() => onAccept(order._id)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            title="Nhận đơn"
                          >
                            <Wrench size={18} />
                          </button>
                          <button
                            onClick={() => onCancel(order._id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            title="Hủy đơn"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      
                      {viewMode === "PENDING" && order.status === "In Progress" && (
                        <button
                          onClick={() => onComplete(order._id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                          title="Hoàn thành"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepairOrdersTable;