import React from "react";
import { Package, Trash2, CheckCircle, Lock, Scissors } from "lucide-react";

const DismantleForm = ({
  dismantleParts,
  itemTypes,
  onRemovePart,
  onPartChange,
  parsedChecklist = [],
  handleExtractPart,
}) => {
  const goodParts = parsedChecklist.filter((i) => !i.isFaulty);

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <label className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <Package className="text-red-600" /> Khai báo linh kiện tháo rời
        </label>
      </div>

      <p className="text-sm font-bold text-gray-700 mb-3">
        Linh kiện đạt chuẩn 100% (Bấm để bóc tự động):
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {goodParts.map((item, idx) => {
          const isExtracted = dismantleParts.some(
            (p) => p.originalCode === item.code,
          );
          if (isExtracted) {
            return (
              <span
                key={idx}
                className="px-4 py-2 border border-green-200 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center gap-1 opacity-60 cursor-not-allowed"
              >
                <CheckCircle size={14} /> Đã bóc {item.name}
              </span>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleExtractPart(item)}
              className="px-4 py-2 border border-green-400 bg-green-50 text-green-700 hover:bg-green-100 hover:-translate-y-0.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
            >
              + Bóc {item.name}
            </button>
          );
        })}
        {goodParts.length === 0 && (
          <span className="text-sm text-gray-400 italic">
            Máy nát bét, không có linh kiện 100% để tái sử dụng.
          </span>
        )}
      </div>

      <div className="space-y-4">
        {dismantleParts.map((part, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-gray-200 relative bg-gray-50/50 shadow-sm group hover:border-red-300 transition"
          >
            <button
              onClick={() => onRemovePart(idx)}
              className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-white hover:bg-red-500 bg-white p-2 rounded-full shadow border transition"
            >
              <Trash2 size={16} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-12">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                  Loại LK <Lock size={10} />
                </label>
                <select
                  disabled
                  className="w-full p-2.5 border border-gray-200 rounded-lg outline-none text-sm bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                >
                  <option value="">
                    {itemTypes.find((it) => it._id === part.itemTypeId)?.name ||
                      "Chưa map được loại trong kho"}
                  </option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Tên hiển thị *
                </label>
                <input
                  type="text"
                  value={part.name || ""}
                  onChange={(e) => onPartChange(idx, "name", e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-red-600 uppercase mb-1">
                  Giá bán lẻ (VNĐ) *
                </label>
                <input
                  type="text"
                  value={
                    part.price
                      ? new Intl.NumberFormat("vi-VN").format(part.price)
                      : ""
                  }
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value === "0") value = "";
                    onPartChange(idx, "price", value);
                  }}
                  className="w-full p-2.5 border-2 border-red-200 rounded-lg outline-none text-sm font-black text-red-600 bg-white focus:border-red-500"
                />
              </div>
            </div>
          </div>
        ))}

        {dismantleParts.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Scissors className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm font-medium">
              Chưa bóc linh kiện nào. Hãy click vào các mục 100% bên trên.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DismantleForm;