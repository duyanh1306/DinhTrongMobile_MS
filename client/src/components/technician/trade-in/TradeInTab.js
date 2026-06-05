import React, { useState, useEffect } from "react";
import { Smartphone, PlusCircle } from "lucide-react";
import TradeInModal from "./TradeInModal";
import axiosClient from "../../../api/axiosClient";

const TradeInTab = ({ 
  selectedTradeIn, 
  valuation, 
  checklist, 
  phoneModels, 
  isBasicInfoFilled,
  onOpenNewPurchase,
  onCloseModal, 
  onValuationChange, 
  onChecklistChange, 
  onSubmit 
}) => {
  const [globalConditions, setGlobalConditions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resConditions = await axiosClient.get("/evaluation-conditions");
        setGlobalConditions(resConditions.data?.data || resConditions.data || []);
      } catch (err) {}
    };
    fetchData();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[70vh] flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-purple-100 text-center max-w-lg w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-400 to-blue-500"></div>
        <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-purple-100">
          <Smartphone size={48} strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-3">Thu Cũ Đổi Mới</h2>
        <p className="text-gray-500 mb-10 text-sm leading-relaxed px-4">
          Thực hiện quy trình kiểm tra thiết bị, đánh giá tình trạng linh kiện và báo giá thu mua tự động cho khách hàng.
        </p>
        <button 
          onClick={onOpenNewPurchase}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-1 transition-all"
        >
          <PlusCircle size={24} />
          TẠO ĐƠN THU MÁY CŨ
        </button>
      </div>

      <TradeInModal 
        selectedTradeIn={selectedTradeIn}
        valuation={valuation}
        checklist={checklist}
        phoneModels={phoneModels}
        globalConditions={globalConditions}
        isBasicInfoFilled={isBasicInfoFilled}
        onClose={onCloseModal}
        onValuationChange={onValuationChange}
        onChecklistChange={onChecklistChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default TradeInTab;