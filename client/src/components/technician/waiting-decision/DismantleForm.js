import React from "react";
import { Package, Trash2, Scissors, CheckCircle, Lock } from "lucide-react";

const DismantleForm = ({ dismantleParts, itemTypes, onRemovePart, onPartChange, parsedChecklist = [], handleExtractPart }) => {
  const goodParts = parsedChecklist.filter(i => !i.isFaulty);

  return (
    <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-red-100">
        <label className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <Package size={22} className="text-red-600"/> Khai báo linh kiện tháo rời
        </label>
      </div>
      
      <div className="mb-6">
        <p className="text-sm font-bold text-gray-700 mb-3">Linh kiện đạt chuẩn 100% (Bấm để bóc):</p>
        <div className="flex flex-wrap gap-2">
            {goodParts.map((item, idx) => {
                const isExtracted = dismantleParts.some(p => p.originalCode === item.code);
                if (isExtracted) {
                    return (
                        <span key={idx} className="px-4 py-2 border border-green-200 bg-green-50 text-green-600 rounded-xl text-xs font-bold flex items-center gap-1 opacity-60 cursor-not-allowed">
                            <CheckCircle size={14}/> Đã bóc {item.name}
                        </span>
                    );
                }
                return (
                    <button 
                        key={idx} 
                        onClick={() => handleExtractPart(item)} 
                        className="px-4 py-2 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:-translate-y-0.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                        + Bóc {item.name}
                    </button>
                );
            })}
            {goodParts.length === 0 && <span className="text-sm text-gray-400 italic">Máy nát bét, không có linh kiện nào tái sử dụng được.</span>}
        </div>
      </div>

      <div className="space-y-6">
        {dismantleParts.map((part, idx) => (
          <div key={idx} className="p-5 rounded-xl border border-gray-200 relative group bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <button onClick={() => onRemovePart(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white hover:bg-red-500 border p-2 rounded-full transition shadow-sm z-10">
              <Trash2 size={16}/>
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mr-12 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 flex items-center gap-1">
                  Loại linh kiện <Lock size={12} className="text-gray-400"/>
                </label>
                <select disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg outline-none text-gray-600 cursor-not-allowed font-medium">
                  <option value="">{itemTypes.find(it => it._id === part.itemTypeId)?.name || "Chưa map được loại trong kho"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tên hiển thị *</label>
                <input 
                  type="text" 
                  value={part.name} 
                  onChange={(e) => onPartChange(idx, "name", e.target.value)} 
                  className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Serial (SN)</label>
                <input type="text" placeholder="Auto tạo nếu trống" value={part.serialCode} onChange={(e) => onPartChange(idx, "serialCode", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tình trạng</label>
                <input type="text" value={part.quality} onChange={(e) => onPartChange(idx, "quality", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-green-600"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Dung lượng</label>
                <input type="text" value={part.capacity} onChange={(e) => onPartChange(idx, "capacity", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">RAM</label>
                <input type="text" value={part.ram} onChange={(e) => onPartChange(idx, "ram", e.target.value)} className="w-full p-2.5 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-red-50 p-4 rounded-lg border border-red-100">
              <div>
                <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Màu sắc</label>
                <input type="text" value={part.color} onChange={(e) => onPartChange(idx, "color", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-red-800 uppercase mb-1.5">Giá vốn nhập (VNĐ)</label>
                <input 
                  type="text" 
                  value={part.baseCost ? new Intl.NumberFormat('vi-VN').format(part.baseCost) : ''} 
                  onChange={(e) => onPartChange(idx, "baseCost", e.target.value.replace(/\D/g, ''))} 
                  className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-red-600 uppercase mb-1.5">Giá bán lẻ (VNĐ) *</label>
                <input 
                  type="text" 
                  value={part.price ? new Intl.NumberFormat('vi-VN').format(part.price) : ''} 
                  onChange={(e) => onPartChange(idx, "price", e.target.value.replace(/\D/g, ''))} 
                  className="w-full p-2.5 border-2 border-red-200 rounded-lg outline-none focus:border-red-500 font-black text-red-600 bg-white"
                />
              </div>
            </div>
          </div>
        ))}
        {dismantleParts.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-red-200">
            <Scissors className="mx-auto h-8 w-8 text-red-300 mb-2"/>
            <p className="text-gray-500 font-medium">Chưa bóc linh kiện nào. Hãy click vào các mục 100% bên trên.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DismantleForm;