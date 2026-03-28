import React from "react";
import { Package, Plus, Trash2, Scissors } from "lucide-react";

const DismantleForm = ({ dismantleParts, itemTypes, onAddPart, onRemovePart, onPartChange }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-red-100">
        <label className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <Package size={22} className="text-red-600"/> Danh sách linh kiện rã được
        </label>
        <button 
          onClick={onAddPart} 
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-red-100 transition"
        >
          <Plus size={16}/> Thêm linh kiện
        </button>
      </div>
      
      <div className="space-y-6">
        {dismantleParts.map((part, idx) => (
          <div 
            key={idx} 
            className="p-5 rounded-xl border border-gray-200 relative group bg-gray-50/50 hover:bg-gray-50 transition-colors"
          >
            <button 
              onClick={() => onRemovePart(idx)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white hover:bg-red-500 border p-2 rounded-full transition shadow-sm"
            >
              <Trash2 size={16}/>
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mr-12 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Loại linh kiện *</label>
                <select 
                  value={part.itemTypeId} 
                  onChange={(e) => onPartChange(idx, "itemTypeId", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Chọn --</option>
                  {itemTypes.map(it => (
                    <option key={it._id} value={it._id}>{it.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tên hiển thị *</label>
                <input 
                  type="text" 
                  placeholder="VD: Mainboard iPhone 14 Pro (Zin bóc máy)" 
                  value={part.name} 
                  onChange={(e) => onPartChange(idx, "name", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Serial (SN)</label>
                <input 
                  type="text" 
                  placeholder="Auto tạo nếu trống" 
                  value={part.serialCode} 
                  onChange={(e) => onPartChange(idx, "serialCode", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tình trạng</label>
                <input 
                  type="text" 
                  placeholder="VD: Zin keng" 
                  value={part.quality} 
                  onChange={(e) => onPartChange(idx, "quality", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Dung lượng</label>
                <input 
                  type="text" 
                  placeholder="VD: 256GB" 
                  value={part.capacity} 
                  onChange={(e) => onPartChange(idx, "capacity", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">RAM</label>
                <input 
                  type="text" 
                  placeholder="VD: 6GB" 
                  value={part.ram} 
                  onChange={(e) => onPartChange(idx, "ram", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-red-50 p-4 rounded-lg border border-red-100">
              <div>
                <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Màu sắc</label>
                <input 
                  type="text" 
                  placeholder="VD: Tím..." 
                  value={part.color} 
                  onChange={(e) => onPartChange(idx, "color", e.target.value)} 
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Giá vốn (VND)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={part.baseCost} 
                  onChange={(e) => onPartChange(idx, "baseCost", e.target.value)} 
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-red-600 uppercase mb-1.5">Giá bán lẻ (VND) *</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={part.price} 
                  onChange={(e) => onPartChange(idx, "price", e.target.value)} 
                  className="w-full p-2 border-2 border-red-200 rounded-lg outline-none focus:border-red-500 font-black text-red-600 bg-white"
                />
              </div>
            </div>
          </div>
        ))}
        {dismantleParts.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-red-200">
            <Scissors className="mx-auto h-8 w-8 text-red-300 mb-2"/>
            <p className="text-gray-500 font-medium">Bấm "Thêm linh kiện" để nhập chi tiết các món rã được</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DismantleForm;
