import React from "react";

const SellForm = ({ sellForm, onChange }) => {
  return (
    <div className="space-y-4 bg-white p-6 rounded-xl border border-green-100 shadow-sm">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block font-bold text-gray-700 mb-2">Dung lượng</label>
          <input 
            type="text" 
            placeholder="VD: 128GB" 
            value={sellForm.capacity} 
            onChange={e => onChange({ ...sellForm, capacity: e.target.value })} 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-2">Màu sắc</label>
          <input 
            type="text" 
            placeholder="VD: Đen" 
            value={sellForm.colorName} 
            onChange={e => onChange({ ...sellForm, colorName: e.target.value })} 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>
      </div>
      <div className="pt-4 border-t mt-4">
        <label className="block font-black text-gray-800 mb-2">
          GIÁ NIÊM YẾT BÁN RA (VNĐ) <span className="text-red-500">*</span>
        </label>
        <input 
          type="number" 
          placeholder="Nhập giá tiền..." 
          value={sellForm.sellingPrice} 
          onChange={e => onChange({ ...sellForm, sellingPrice: e.target.value })} 
          className="w-full p-4 border-2 border-green-200 rounded-lg outline-none focus:border-green-500 text-2xl font-black text-green-700"
        />
      </div>
    </div>
  );
};

export default SellForm;
