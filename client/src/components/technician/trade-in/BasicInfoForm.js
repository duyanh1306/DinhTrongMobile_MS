import React from "react";
import { Smartphone } from "lucide-react";

const BasicInfoForm = ({ valuation, phoneModels, onChange }) => {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
        <Smartphone size={18}/> 1. Thông tin cấu hình cơ bản
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Dòng máy <span className="text-red-500">*</span>
          </label>
          <select 
            value={valuation.phoneModelId} 
            onChange={e => onChange({ ...valuation, phoneModelId: e.target.value })} 
            className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="">-- Chọn dòng máy --</option>
            {phoneModels.map(pm => (
              <option key={pm._id} value={pm._id}>{pm.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Màu sắc <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder="VD: Đen, Titan..." 
            value={valuation.colorName} 
            onChange={e => onChange({ ...valuation, colorName: e.target.value })} 
            className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Dung lượng <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder="VD: 256GB" 
            value={valuation.capacity} 
            onChange={e => onChange({ ...valuation, capacity: e.target.value })} 
            className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">
            RAM <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder="VD: 8GB" 
            value={valuation.ram} 
            onChange={e => onChange({ ...valuation, ram: e.target.value })} 
            className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoForm;
