import React from "react";
import { Settings } from "lucide-react";
import WaitingDecisionTable from "./WaitingDecisionTable";
import WaitingDecisionModal from "./WaitingDecisionModal";

const WaitingDecisionTab = ({ 
  waitingPhones, 
  loading, 
  selectedDecisionPhone, 
  decision, 
  sellForm, 
  dismantleParts, 
  itemTypes,
  onProcess, 
  onCloseModal, 
  onDecisionChange, 
  onSellFormChange, 
  onAddPart, 
  onRemovePart, 
  onPartChange, 
  onSubmit 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <Settings className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-orange-900">Danh sách thiết bị chờ Quyết định Kỹ thuật</h3>
            <p className="text-orange-700">
              Tổng số: {waitingPhones.length} máy thu cũ đang chờ phân loại (Tân trang / Rã xác)
            </p>
          </div>
        </div>
      </div>

      <WaitingDecisionTable 
        waitingPhones={waitingPhones} 
        loading={loading} 
        onProcess={onProcess} 
      />

      <WaitingDecisionModal 
        selectedDecisionPhone={selectedDecisionPhone}
        decision={decision}
        sellForm={sellForm}
        dismantleParts={dismantleParts}
        itemTypes={itemTypes}
        onClose={onCloseModal}
        onDecisionChange={onDecisionChange}
        onSellFormChange={onSellFormChange}
        onAddPart={onAddPart}
        onRemovePart={onRemovePart}
        onPartChange={onPartChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default WaitingDecisionTab;
