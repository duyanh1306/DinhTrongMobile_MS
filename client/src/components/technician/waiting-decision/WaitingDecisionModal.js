import React from "react";
import { X, Hammer, Scissors, Save, Download, AlertCircle } from "lucide-react";
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
  onSubmit,
  parsedChecklist,
  handleExtractPart
}) => {
  if (!selectedDecisionPhone) return null;

  let canSubmit = true;
  let submitErrorMsg = "";

  const sellPriceNum = Number(sellForm.sellingPrice || 0);

  if (decision === "SELL") {
    const brokenParts = parsedChecklist.filter(i => i.isFaulty);
    // Lưu ý: replacementParts không được pass xuống trong component cũ của sếp, nên tao chỉ check giá bán
    // (Bảo đảm là nhập giá bán > 0)
    if (sellPriceNum <= 0) { 
        canSubmit = false; 
        submitErrorMsg = "Vui lòng nhập giá bán niêm yết lớn hơn 0."; 
    }
  } else if (decision === "DISMANTLE") {
    if (dismantleParts.length === 0) {
        canSubmit = false; 
        submitErrorMsg = "Vui lòng bóc ít nhất 1 linh kiện để rã xác.";
    } else if (dismantleParts.some(p => !p.name || Number(p.price) <= 0)) {
        canSubmit = false;
        submitErrorMsg = "Vui lòng điền đủ Tên hiển thị và Giá bán (>0) cho linh kiện.";
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            Xử lý thiết bị: <span className="text-blue-600">{selectedDecisionPhone.phoneModelId?.name}</span> 
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
              onRemovePart={onRemovePart}
              onPartChange={onPartChange}
              parsedChecklist={parsedChecklist}
              handleExtractPart={handleExtractPart}
            />
          )}
        </div>

        <div className="p-5 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-b-2xl">
          <div className="text-red-500 text-sm font-bold flex items-center gap-1 w-full sm:w-auto">
             {!canSubmit && (
               <><AlertCircle size={16}/> {submitErrorMsg}</>
             )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose} 
              className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition shadow-sm"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={onSubmit} 
              disabled={!canSubmit}
              className={`px-6 py-3 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all ${
                !canSubmit 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : decision === "SELL" 
                      ? "bg-green-600 shadow-lg hover:bg-green-700 hover:-translate-y-1 shadow-green-200" 
                      : "bg-red-600 shadow-lg hover:bg-red-700 hover:-translate-y-1 shadow-red-200"
              }`}
            >
              <Save size={20}/> XÁC NHẬN LƯU KHO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingDecisionModal;