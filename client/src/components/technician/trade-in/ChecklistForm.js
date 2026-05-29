import { CheckCircle } from "lucide-react";

const ChecklistForm = ({ criteriaList, checklist, onChange }) => {
  if (!criteriaList || criteriaList.length === 0) {
      return (
          <div className="bg-white p-5 rounded-xl border shadow-sm animate-in fade-in zoom-in duration-300">
              <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                <CheckCircle size={18}/> 2. Đánh giá tình trạng linh kiện
              </h4>
              <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-gray-300 rounded bg-gray-50">
                  Dòng máy này chưa có dữ liệu Cấu hình Tiêu chuẩn (Recipe). Vui lòng báo Admin thêm cấu hình.
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm animate-in fade-in zoom-in duration-300">
      <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
        <CheckCircle size={18}/> 2. Đánh giá tình trạng linh kiện
      </h4>
      
      <div className="space-y-4">
        {criteriaList.map((criteria) => {
          const selectedCondition = checklist[criteria.partCode];
          const isFaulty = selectedCondition?.isFaulty;
          
          const hasConditions = criteria.conditions && criteria.conditions.length > 0;

          return (
            <div 
              key={criteria.partCode} 
              className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border transition-colors ${
                isFaulty 
                  ? "bg-red-50/50 border-red-200" 
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <span className="font-bold text-gray-700 mb-2 md:mb-0 w-full md:w-1/3">
                {criteria.partName}
              </span>
              
              <div className="w-full md:w-2/3 flex justify-end">
                {hasConditions ? (
                    <select
                      value={selectedCondition?.value || ""}
                      onChange={(e) => {
                        const conditionObj = criteria.conditions.find(c => String(c.value) === String(e.target.value));
                        if (conditionObj) {
                            onChange(criteria.partCode, { 
                              ...conditionObj, 
                              partName: criteria.partName 
                            });
                        }
                      }}
                      className={`w-full p-2.5 text-sm border-2 rounded-lg outline-none focus:ring-2 font-medium transition-all ${
                        isFaulty 
                          ? "border-red-300 focus:ring-red-500 text-red-700 bg-white" 
                          : "border-gray-200 focus:ring-purple-500 text-gray-700 bg-white"
                      }`}
                    >
                      <option value="" disabled>-- Chọn tình trạng --</option>
                      {criteria.conditions.map(cond => (
                        <option key={cond.value} value={cond.value}>
                          {cond.label} {cond.deductionPercent > 0 ? `(-${cond.deductionPercent}%)` : ''}
                        </option>
                      ))}
                    </select>
                ) : (
                    <div className="text-xs text-gray-400 italic py-2">Không có tiêu chí đánh giá</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChecklistForm;