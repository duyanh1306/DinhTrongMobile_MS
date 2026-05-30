import React, { useState, useEffect } from "react";
import { X, User, CheckCircle } from "lucide-react";
import BasicInfoForm from "./BasicInfoForm";
import ChecklistForm from "./ChecklistForm";
import PriceForm from "./PriceForm";

const TradeInModal = ({ 
  selectedTradeIn, 
  valuation, 
  checklist, 
  phoneModels,
  globalConditions,
  isBasicInfoFilled,
  onClose, 
  onValuationChange, 
  onChecklistChange, 
  onSubmit
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    if (selectedTradeIn) {
      setCustomerName(selectedTradeIn.customerName || "");
      setCustomerPhone(selectedTradeIn.customerPhone || "");
    }
  }, [selectedTradeIn]);

  const handleSubmit = () => {
    onSubmit({
      ...selectedTradeIn,
      customerName,
      customerPhone
    });
  };

  if (!selectedTradeIn) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-0 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
                {selectedTradeIn.isNewPurchase ? "Tiếp nhận thu máy mới" : "Định giá chi tiết thiết bị"}
            </h3>
            {!selectedTradeIn.isNewPurchase && (
                <p className="text-xs text-gray-500 mt-1">
                  Khách hàng: <span className="font-bold text-purple-600">{selectedTradeIn.customerName} - {selectedTradeIn.customerPhone}</span>
                </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white p-1 border rounded-md shadow-sm">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {selectedTradeIn.isNewPurchase ? (
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-600">Thông tin khách hàng</p>
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        className="p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Tên khách hàng" 
                        value={customerName} 
                        onChange={e => setCustomerName(e.target.value)}
                    />
                    <input 
                        className="p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Số điện thoại" 
                        value={customerPhone} 
                        onChange={e => setCustomerPhone(e.target.value)}
                    />
                </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6 shadow-sm">
                <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User size={14}/> Ghi chú từ Sale:
                </p>
                <p className="text-sm text-blue-700 italic">{selectedTradeIn.note || "Không có ghi chú"}</p>
            </div>
          )}

          <div className="space-y-6">
            <BasicInfoForm 
              valuation={valuation} 
              phoneModels={phoneModels} 
              onChange={onValuationChange} 
            />

            {isBasicInfoFilled && (
              <ChecklistForm 
                checklist={checklist} 
                globalConditions={globalConditions}
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
          <button onClick={onClose} className="px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition">
            Hủy bỏ
          </button>
          
          <button 
            onClick={handleSubmit} 
            disabled={!isBasicInfoFilled || (selectedTradeIn.isNewPurchase && (!customerName || !customerPhone))}
            className={`px-8 py-3 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all ${
              isBasicInfoFilled 
                ? "bg-blue-600 shadow-lg hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200" 
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <CheckCircle size={20}/> {selectedTradeIn.isNewPurchase ? "HOÀN TẤT TẠO ĐƠN" : "CHUYỂN VỀ SALE XÁC NHẬN"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeInModal;