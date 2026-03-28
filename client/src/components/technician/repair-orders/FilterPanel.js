import React from "react";
import { Filter } from "lucide-react";

const FilterPanel = ({ filters, stores, filterLoading, onFilterChange, onApplyFilters, onResetFilters }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
          <select 
            value={filters.status} 
            onChange={(e) => onFilterChange('status', e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả</option>
            <option value="Pending">Chờ xử lý</option>
            <option value="In Progress">Đang xử lý</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Loại sửa chữa</label>
          <select 
            value={filters.type} 
            onChange={(e) => onFilterChange('type', e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả</option>
            <option value="REPAIR">Sửa chữa</option>
            <option value="WARRANTY">Bảo hành</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cửa hàng</label>
          <select 
            value={filters.storeId} 
            onChange={(e) => onFilterChange('storeId', e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả</option>
            {stores.map(store => (
              <option key={store._id} value={store._id}>{store.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end gap-2">
          <button 
            onClick={onApplyFilters} 
            disabled={filterLoading} 
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            {filterLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            Áp dụng
          </button>
          <button 
            onClick={onResetFilters} 
            disabled={filterLoading} 
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
