import React from "react";
import { Calendar, Phone, Calculator } from "lucide-react";
import dayjs from "dayjs";

const TradeInTable = ({ tradeInRequests, loading, onValuate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden relative border">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thiết bị dự kiến</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú từ Sale</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tradeInRequests.map((req) => (
              <tr key={req._id} className="hover:bg-purple-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                  #{req._id.substring(req._id.length - 6).toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> 
                    {dayjs(req.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{req.customerName}</div>
                  {req.customerPhone && (
                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                      <Phone className="w-3 h-3" /> {req.customerPhone}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="font-bold text-gray-900">
                    {req.tempPhoneData?.phoneModelId?.name || "Sale chưa nhập"}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                  {req.note ? (
                    <span title={req.note}>{req.note}</span>
                  ) : (
                    <span className="italic text-gray-400">Không có</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button 
                    onClick={() => onValuate(req)} 
                    className="text-purple-700 bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-lg inline-flex items-center gap-2 font-bold transition-colors"
                  >
                    <Calculator className="w-4 h-4" /> Định giá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && tradeInRequests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Không có yêu cầu định giá nào đang chờ...</p>
        </div>
      )}
    </div>
  );
};

export default TradeInTable;
