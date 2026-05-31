import React, { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import TradeInTable from "./TradeInTable";
import TradeInModal from "./TradeInModal";
import axiosClient from "../../../api/axiosClient";

const TradeInTab = ({ 
  tradeInRequests, 
  loading, 
  selectedTradeIn, 
  valuation, 
  checklist, 
  phoneModels, 
  isBasicInfoFilled,
  onValuate, 
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
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Calculator className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Danh sách cần định giá</h3>
            <p className="text-purple-700">
              Tổng số: {tradeInRequests.length} máy đang chờ Kỹ thuật test và chốt giá
            </p>
          </div>
        </div>
      </div>

      <TradeInTable 
        tradeInRequests={tradeInRequests} 
        loading={loading} 
        onValuate={onValuate} 
      />

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