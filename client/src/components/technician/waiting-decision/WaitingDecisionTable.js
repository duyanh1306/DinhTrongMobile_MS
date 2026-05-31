import React from "react";
import { Calendar, Settings, CheckCircle } from "lucide-react";
import dayjs from "dayjs";

const WaitingDecisionTable = ({ waitingPhones, loading, onProcess }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mã máy</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian nhập</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên dòng máy</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Linh kiện lỗi</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Giá vốn thu mua</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {waitingPhones.map((phone) => {
              let brokenParts = [];
              if (phone.checklistData) {
                try {
                  const parsed = JSON.parse(phone.checklistData);
                  brokenParts = parsed.filter(item => item.isFaulty);
                } catch (e) {
                  brokenParts = [];
                }
              }

              return (
                <tr key={phone._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                    #{phone._id.substring(phone._id.length - 6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 
                      {dayjs(phone.createdAt).format('DD/MM/YYYY')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {phone.phoneModelId?.name || "Máy chưa rõ"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Màu: {phone.colorName} - {phone.capacity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {brokenParts.length > 0 ? (
                        brokenParts.map((part, idx) => (
                          <span key={idx} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded">
                            {part.name || part.code}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs italic">Không có</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(phone.importPrice || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold uppercase bg-blue-100 text-blue-800">
                      <Settings size={14}/> Chờ quyết định
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <button 
                      onClick={() => onProcess(phone)} 
                      className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                    >
                      Xử lý ngay
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!loading && waitingPhones.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
          <p>Tuyệt vời! Không còn máy nào đang chờ xử lý.</p>
        </div>
      )}
    </div>
  );
};

export default WaitingDecisionTable;