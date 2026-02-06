import React from "react";
import { ShoppingBag, Clock, CheckCircle, Search } from "lucide-react";

export default function SaleDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Bảng tin kinh doanh</h2>
        <div className="flex gap-2">
            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
                + Tạo đơn mới
            </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
             <div className="bg-blue-100 p-3 rounded-full text-blue-600"><ShoppingBag /></div>
             <div>
                <p className="text-gray-500">Đơn hôm nay</p>
                <h3 className="text-2xl font-bold">24</h3>
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center gap-4">
             <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Clock /></div>
             <div>
                <p className="text-gray-500">Đang chờ xử lý</p>
                <h3 className="text-2xl font-bold">08</h3>
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-4">
             <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle /></div>
             <div>
                <p className="text-gray-500">Đã giao thành công</p>
                <h3 className="text-2xl font-bold">156</h3>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table Mockup */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Đơn hàng mới nhất</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input type="text" placeholder="Tìm đơn hàng..." className="pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-primary"/>
            </div>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
                <tr>
                    <th className="p-4">Mã đơn</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Tổng tiền</th>
                    <th className="p-4">Trạng thái</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                <tr className="hover:bg-gray-50">
                    <td className="p-4 font-medium">#ORD-001</td>
                    <td className="p-4">Phạm Văn Khách</td>
                    <td className="p-4">iPhone 15 Pro Max</td>
                    <td className="p-4 font-bold text-primary">34.000.000đ</td>
                    <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Chờ duyệt</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="p-4 font-medium">#ORD-002</td>
                    <td className="p-4">Nguyễn Thị B</td>
                    <td className="p-4">Ốp lưng Magsafe</td>
                    <td className="p-4 font-bold text-primary">500.000đ</td>
                    <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Đang giao</span></td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
}