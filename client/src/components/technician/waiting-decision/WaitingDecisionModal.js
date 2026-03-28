import React from "react";
import { X, Hammer, Scissors, Save } from "lucide-react";
import SellForm from "./SellForm";
import DismantleForm from "./DismantleForm";

const WaitingDecisionModal = ({ 
  selectedDecisionPhone, 
  decision, 
  sellForm, 
  dismantleParts, 
  itemTypes,
  onClose, 
  onDecisionChange, 
  onSellFormChange, 
  onAddPart, 
  onRemovePart, 
  onPartChange, 
  onSubmit 
}) => {
  if (!selectedDecisionPhone) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            Xử lý thiết bị: <span className="text-orange-600">{selectedDecisionPhone.phoneModelId?.name}</span> 
            <span className="text-sm font-mono text-gray-500 ml-2">
              (#{selectedDecisionPhone._id.substring(selectedDecisionPhone._id.length - 6).toUpperCase()})
            </span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-md border"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => onDecisionChange("SELL")} 
              className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                decision === "SELL" 
                  ? "border-green-500 bg-green-50 text-green-700 shadow-sm" 
                  : "border-gray-200 bg-white text-gray-400 hover:border-green-300"
              }`}
            >
              <Hammer size={20}/> TÂN TRANG / SỬA ĐỂ BÁN
            </button>
            <button 
              onClick={() => onDecisionChange("DISMANTLE")} 
              className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                decision === "DISMANTLE" 
                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm" 
                  : "border-gray-200 bg-white text-gray-400 hover:border-red-300"
              }`}
            >
              <Scissors size={20}/> RÃ XÁC LẤY LINH KIỆN
            </button>
          </div>

          {decision === "SELL" ? (
            <SellForm sellForm={sellForm} onChange={onSellFormChange} />
          ) : (
            <DismantleForm 
              dismantleParts={dismantleParts}
              itemTypes={itemTypes}
              onAddPart={onAddPart}
              onRemovePart={onRemovePart}
              onPartChange={onPartChange}
            />
          )}
        </div>

        <div className="p-5 border-t flex justify-end gap-4 bg-white rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            Hủy
          </button>
          <button 
            onClick={onSubmit} 
            className={`px-8 py-3 rounded-xl font-black text-white flex justify-center items-center gap-2 shadow-lg transition-transform hover:-translate-y-1 ${
              decision === "SELL" 
                ? "bg-green-600 hover:bg-green-700 shadow-green-200" 
                : "bg-red-600 hover:bg-red-700 shadow-red-200"
            }`}
          >
            <Save size={20}/> XÁC NHẬN LƯU KHO
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingDecisionModal;
