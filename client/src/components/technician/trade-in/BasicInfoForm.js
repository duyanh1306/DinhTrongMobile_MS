import React, { useState, useMemo } from "react";
import { Smartphone } from "lucide-react";

const BasicInfoForm = ({ valuation, phoneModels, onChange }) => {
  const brands = useMemo(() => {
    const allBrandNames = phoneModels
      .map(pm => typeof pm.brand === 'object' && pm.brand !== null ? pm.brand.name : pm.brand)
      .filter(Boolean);
    return [...new Set(allBrandNames)];
  }, [phoneModels]);

  const [selectedBrand, setSelectedBrand] = useState("");

  const filteredModels = useMemo(() => {
    if (!selectedBrand) return phoneModels;
    return phoneModels.filter(pm => {
      const pmBrandName = typeof pm.brand === 'object' && pm.brand !== null ? pm.brand.name : pm.brand;
      return pmBrandName === selectedBrand;
    });
  }, [selectedBrand, phoneModels]);

  const handleBrandChange = (e) => {
    const newBrand = e.target.value;
    setSelectedBrand(newBrand);
    onChange({ ...valuation, phoneModelId: "" });
  };

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
        <Smartphone size={18}/> 1. Thông tin cấu hình cơ bản
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Hãng sản xuất <span className="text-red-500">*</span>
          </label>
          <select 
            value={selectedBrand} 
            onChange={handleBrandChange} 
            className="w-full p-2.5 border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-purple-50/30"
          >
            <option value="">-- Chọn hãng --</option>
            {brands.map((brandName, idx) => (
              <option key={idx} value={brandName}>{brandName}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-bold text-gray-600 mb-1">
            Dòng máy <span className="text-red-500">*</span>
          </label>
          <select 
            value={valuation.phoneModelId} 
            onChange={e => onChange({ ...valuation, phoneModelId: e.target.value })} 
            className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm ${!selectedBrand ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white'}`}
            disabled={!selectedBrand}
          >
            <option value="">-- Chọn dòng máy --</option>
            {filteredModels.map(pm => (
              <option key={pm._id} value={pm._id}>{pm.name}</option>
            ))}
          </select>
          {!selectedBrand && <p className="text-[10px] text-red-500 italic mt-1">Vui lòng chọn Hãng trước</p>}
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