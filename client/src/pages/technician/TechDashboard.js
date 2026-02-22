import React from "react";
import { Wrench, AlertCircle, CheckSquare, Calendar } from "lucide-react";

export default function TechDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Khu vực kỹ thuật</h2>
      
      {/* Tech KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm">Được giao</p>
                    <h3 className="text-3xl font-bold">05</h3>
                </div>
                <Wrench className="text-blue-400" />
            </div>
            <p className="text-xs text-slate-400 mt-2">2 máy cần xong hôm nay</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" />
                <span className="font-bold text-gray-700">Chờ linh kiện</span>
            </div>
            <h3 className="text-2xl font-bold mt-2 ml-9">02</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
             <div className="flex items-center gap-3">
                <CheckSquare className="text-green-500" />
                <span className="font-bold text-gray-700">Đã xong hôm nay</span>
            </div>
            <h3 className="text-2xl font-bold mt-2 ml-9">03</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
             <div className="flex items-center gap-3">
                <Calendar className="text-purple-500" />
                <span className="font-bold text-gray-700">Lịch hẹn khách</span>
            </div>
            <h3 className="text-2xl font-bold mt-2 ml-9">01</h3>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh sách máy đang sửa</h3>
        <div className="grid grid-cols-1 gap-4">
            {/* Card 1 */}
            <div className="border border-l-4 border-l-red-500 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg">iPhone 13 Pro Max - <span className="text-red-500">Màn hình xanh</span></h4>
                        <p className="text-sm text-gray-500">Khách: Anh Tuấn - 0988...</p>
                        <p className="text-sm text-gray-500 mt-1">Ghi chú: Máy khách cần lấy gấp trước 5h chiều.</p>
                    </div>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Ưu tiên cao</span>
                </div>
                <div className="mt-4 flex gap-2">
                    <button className="text-sm bg-blue-500 text-white px-3 py-1 rounded">Cập nhật tiến độ</button>
                    <button className="text-sm border border-gray-300 px-3 py-1 rounded">Yêu cầu linh kiện</button>
                </div>
            </div>

             {/* Card 2 */}
             <div className="border border-l-4 border-l-yellow-500 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg">Samsung S23 Ultra - <span className="text-gray-700">Thay pin</span></h4>
                        <p className="text-sm text-gray-500">Khách: Chị Lan - 0912...</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Đang xử lý</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}