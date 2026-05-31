import { CheckCircle } from "lucide-react";

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

const ChecklistForm = ({ checklist, globalConditions = [], onChange }) => {
  const availablePartCodes = [...new Set(globalConditions.map(c => c.partCode))];
  const partsToEvaluate = BASE_CODES.filter(b => availablePartCodes.includes(b.code));

  if (partsToEvaluate.length === 0) {
      return (
          <div className="bg-white p-5 rounded-xl border shadow-sm animate-in fade-in zoom-in duration-300">
              <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                <CheckCircle size={18}/> 2. Đánh giá tình trạng linh kiện
              </h4>
              <div className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-gray-300 rounded bg-gray-50">
                  Chưa có dữ liệu Tình trạng linh kiện. Vui lòng báo Admin thêm trong phần Quản lý Tình trạng.
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
        {partsToEvaluate.map((part) => {
          const selectedCondition = checklist[part.code];
          const isFaulty = selectedCondition?.isFaulty;
          
          const partConditions = globalConditions.filter(c => c.partCode === part.code);

          return (
            <div 
              key={part.code} 
              className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border transition-colors ${
                isFaulty ? "bg-red-50/50 border-red-200" : "bg-gray-50 border-gray-200"
              }`}
            >
              <span className="font-bold text-gray-700 mb-2 md:mb-0 w-full md:w-1/3">
                {part.label}
              </span>
              
              <div className="w-full md:w-2/3 flex justify-end">
                <select
                  value={selectedCondition?._id || ""}
                  onChange={(e) => {
                    const conditionObj = partConditions.find(c => c._id === e.target.value);
                    if (conditionObj) {
                        onChange(part.code, { 
                          ...conditionObj, 
                          partName: part.label 
                        });
                    }
                  }}
                  className={`w-full p-2.5 text-sm border-2 rounded-lg outline-none focus:ring-2 font-medium transition-all ${
                    isFaulty ? "border-red-300 focus:ring-red-500 text-red-700 bg-white" : "border-gray-200 focus:ring-purple-500 text-gray-700 bg-white"
                  }`}
                >
                  <option value="" disabled>-- Chọn tình trạng --</option>
                  {partConditions.map(cond => (
                    <option key={cond._id} value={cond._id}>
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