import { CheckCircle } from "lucide-react";

const ChecklistForm = ({ criteriaList, checklist, onChange }) => {
  if (!criteriaList || criteriaList.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm animate-in fade-in zoom-in duration-300">
      <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
        <CheckCircle size={18}/> 2. Đánh giá tình trạng linh kiện
      </h4>
      
      <div className="space-y-4">
        {criteriaList.map((criteria) => {
          const selectedCondition = checklist[criteria.partCode];
          const isFaulty = selectedCondition?.isFaulty;

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
                <select
                  value={selectedCondition?.value || ""}
                  onChange={(e) => {
                    // ĐCM FIX LÀ Ở CHỖ NÀY NÀY: Dùng String() để so sánh và ép thêm partName vào
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
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChecklistForm;