import React from "react";
import { X, User, CheckCircle } from "lucide-react";
import BasicInfoForm from "./BasicInfoForm";
import ChecklistForm from "./ChecklistForm";
import PriceForm from "./PriceForm";

const TradeInModal = ({ 
  selectedTradeIn, 
  valuation, 
  checklist, 
  phoneModels, 
  isBasicInfoFilled,
  onClose, 
  onValuationChange, 
  onChecklistChange, 
  onSubmit 
}) => {
  if (!selectedTradeIn) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-0 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Định giá chi tiết thiết bị</h3>
            <p className="text-xs text-gray-500 mt-1">
              Khách hàng: <span className="font-bold text-purple-600">
                {selectedTradeIn.customerName} - {selectedTradeIn.customerPhone}
              </span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-500 bg-white p-1 border rounded-md shadow-sm"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 shadow-sm">
            <p className="text-xs text-orange-800 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <User size={14}/> Ghi chú tình trạng từ Sale:
            </p>
            <p className="text-sm text-orange-700 italic">
              {selectedTradeIn.note || "Sale không để lại ghi chú nào."}
            </p>
          </div>

          <div className="space-y-6">
            <BasicInfoForm 
              valuation={valuation} 
              phoneModels={phoneModels} 
              onChange={onValuationChange} 
            />

            {isBasicInfoFilled && (
              <ChecklistForm 
                checklist={checklist} 
                onChange={onChecklistChange} 
              />
            )}

            {isBasicInfoFilled && (
              <PriceForm 
                valuation={valuation} 
                onChange={onValuationChange} 
              />
            )}
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-4 bg-white rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={() => onSubmit(selectedTradeIn)} 
            disabled={!isBasicInfoFilled}
            className={`px-8 py-3 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all ${
              isBasicInfoFilled 
                ? "bg-purple-600 shadow-lg hover:bg-purple-700 hover:-translate-y-1 shadow-purple-200" 
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <CheckCircle size={20}/> LƯU BÁO CÁO & CHỐT GIÁ
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeInModal;
