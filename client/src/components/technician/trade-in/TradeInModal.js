import React, { useState, useEffect } from "react";
import { X, User, CheckCircle, AlertCircle } from "lucide-react";
import BasicInfoForm from "./BasicInfoForm";
import ChecklistForm from "./ChecklistForm";
import PriceForm from "./PriceForm";

const BASE_CODES = [
  { code: "MB", label: "Mainboard" },
  { code: "SCR", label: "Màn hình" },
  { code: "BAT", label: "Pin" },
  { code: "HSG", label: "Vỏ máy" },
  { code: "CAM-R", label: "Camera Sau" },
  { code: "CAM-F", label: "Camera Trước" },
  { code: "CPT", label: "Cụm chân sạc" },
  { code: "SPK", label: "Loa ngoài" },
  { code: "FGL", label: "Mặt kính" },
  { code: "BGL", label: "Kính lưng" },
  { code: "OTH", label: "Khác" }
];

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
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (selectedTradeIn) {
      setCustomerName(selectedTradeIn.customerName || "");
      setCustomerPhone(selectedTradeIn.customerPhone || "");
      setPhoneError("");
    }
  }, [selectedTradeIn]);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setCustomerPhone(value);
    
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (value && !phoneRegex.test(value)) {
        setPhoneError("Số điện thoại không hợp lệ (VD: 0987654321)");
    } else {
        setPhoneError("");
    }
  };

  const handleSubmit = () => {
    onSubmit({
      ...selectedTradeIn,
      customerName,
      customerPhone
    });
  };

  if (!selectedTradeIn) return null;

  const availablePartCodes = [...new Set((globalConditions || []).map(c => c.partCode))];
  const partsToEvaluate = BASE_CODES.filter(b => availablePartCodes.includes(b.code));

  const isChecklistComplete = partsToEvaluate.length === 0 || partsToEvaluate.every(part => !!checklist[part.code]);
  const isPriceValid = Number(valuation.price) > 0;
  const isCustomerValid = !selectedTradeIn.isNewPurchase || (customerName.trim() !== "" && customerPhone.trim() !== "" && !phoneError);

  const isFormValid = isBasicInfoFilled && isChecklistComplete && isPriceValid && isCustomerValid;

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
                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-600">Thông tin khách hàng</p><span className="text-red-500">*</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input 
                            className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Tên khách hàng" 
                            value={customerName} 
                            onChange={e => setCustomerName(e.target.value)}
                        />
                    </div>
                    <div>
                        <input 
                            className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 ${phoneError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} 
                            placeholder="Số điện thoại" 
                            value={customerPhone} 
                            onChange={handlePhoneChange}
                        />
                        {phoneError && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12}/> {phoneError}
                            </p>
                        )}
                    </div>
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

        <div className="p-5 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-b-2xl">
          <div className="text-red-500 text-sm font-bold flex items-center gap-1 w-full sm:w-auto">
             {!isBasicInfoFilled ? (
               <><AlertCircle size={16}/> Vui lòng điền đủ Thông tin thiết bị.</>
             ) : !isChecklistComplete ? (
               <><AlertCircle size={16}/> Vui lòng đánh giá toàn bộ tình trạng linh kiện.</>
             ) : !isPriceValid ? (
               <><AlertCircle size={16}/> Giá thu mua chốt phải lớn hơn 0 VNĐ.</>
             ) : !isCustomerValid ? (
               <><AlertCircle size={16}/> Vui lòng kiểm tra lại thông tin khách hàng.</>
             ) : null}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button onClick={onClose} className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition">
              Hủy bỏ
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={!isFormValid}
              className={`px-6 py-3 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all ${
                isFormValid 
                  ? "bg-blue-600 shadow-lg hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <CheckCircle size={20}/> {selectedTradeIn.isNewPurchase ? "HOÀN TẤT TẠO ĐƠN" : "CHUYỂN VỀ SALE XÁC NHẬN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInModal;