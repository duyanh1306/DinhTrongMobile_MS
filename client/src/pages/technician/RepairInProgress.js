import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { Calendar, User, Phone, Store, AlertCircle, Clock, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
import dayjs from "dayjs";

const RepairInProgress = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInProgressOrders(1);
  }, []);

  const fetchInProgressOrders = async (page = 1) => {
    try {
      setLoading(true);
      const status = encodeURIComponent('In Progress');
      const response = await axiosClient.get(`/repair-orders/by-status?status=${status}`);
      const allOrders = response.data;

      const totalCount = allOrders.length;
      const totalPages = Math.ceil(totalCount / 5);
      const startIndex = (page - 1) * 5;
      const endIndex = startIndex + 5;
      const paginatedOrders = allOrders.slice(startIndex, endIndex);

      setOrders(paginatedOrders);
      setPagination({
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      });
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách đơn sửa chữa đang thực hiện");
      console.error("Error fetching in-progress repair orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchInProgressOrders(newPage);
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/tech/repair-in-progress/${orderId}`);
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
          onClick={fetchInProgressOrders}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Đang sửa chữa</h2>
          <p className="text-gray-600 mt-1">Đơn sửa chữa đang thực hiện (sắp xếp theo FIFO)</p>
        </div>
        <div className="text-sm text-gray-500">
          Tổng số: {pagination.totalCount} đơn | Trang {pagination.currentPage}/{pagination.totalPages}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Đơn đang thực hiện</h3>
            <p className="text-blue-700">
              {pagination.totalCount} đơn sửa chữa đang được xử lý
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Không có đơn sửa chữa nào đang thực hiện</p>
              <p className="text-sm mt-2">Tất cả các đơn đã được hoàn thành hoặc chưa được chấp nhận</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order, index) => (
              <div 
                key={order._id} 
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleOrderClick(order._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          #{String(index + 1).padStart(4, '0')}
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <AlertCircle className="w-3 h-3" />
                          Đang xử lý
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {dayjs(order.repairOrderDate).format('DD/MM/YYYY HH:mm')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                      
                      {order.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{order.customerPhone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{order.storeId?.name || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-lg font-semibold text-gray-900">
                        {order.totalPrice?.toLocaleString('vi-VN') || 0} đ
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                        <span className="text-sm">Chi tiết</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {orders.length} trên {pagination.totalCount} đơn
            </div>
            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevPage}
                className={`p-2 rounded-lg transition-colors ${
                  pagination.hasPrevPage
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Trang đầu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(pagination.prevPage)}
                disabled={!pagination.hasPrevPage}
                className={`p-2 rounded-lg transition-colors ${
                  pagination.hasPrevPage
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === pagination.currentPage
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(pagination.nextPage)}
                disabled={!pagination.hasNextPage}
                className={`p-2 rounded-lg transition-colors ${
                  pagination.hasNextPage
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className={`p-2 rounded-lg transition-colors ${
                  pagination.hasNextPage
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Trang cuối"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairInProgress;
