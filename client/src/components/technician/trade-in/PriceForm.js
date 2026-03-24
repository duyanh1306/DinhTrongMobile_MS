import React from "react";
import { DollarSign } from "lucide-react";

const PriceForm = ({ valuation, onChange }) => {
  return (
    <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 shadow-sm animate-in fade-in zoom-in duration-500 delay-100">
      <h4 className="font-bold text-purple-700 border-b border-purple-200 pb-2 mb-4 text-sm uppercase flex items-center gap-2">
        <DollarSign size={18}/> 3. Tổng kết & Chốt giá
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <label className="block text-xs font-bold text-purple-900 mb-2">
            Ghi chú lỗi chi tiết (Nếu có)
          </label>
          <textarea 
            value={valuation.techNote} 
            onChange={e => onChange({ ...valuation, techNote: e.target.value })} 
            className="w-full p-3 border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white" 
            placeholder="Ghi chú thêm về các chức năng bị lỗi để Sale giải thích cho khách..." 
            rows="4"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-purple-900 mb-2">
            CHỐT GIÁ THU MUA (VND) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-4 text-purple-400" size={24}/>
            <input 
              type="number" 
              value={valuation.price} 
              onChange={e => onChange({ ...valuation, price: e.target.value })} 
              className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-xl outline-none focus:border-purple-600 text-3xl font-black text-purple-700 bg-white" 
              placeholder="0" 
            />
          </div>
          <p className="text-xs text-purple-600 mt-2 italic font-medium">
            * Giá này sẽ được tạo thành Báo cáo để Sale báo lại cho Khách Hàng.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceForm;
