import { CheckCircle } from "lucide-react";

const ChecklistForm = ({ checklist, onChange }) => {
  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm animate-in fade-in zoom-in duration-300">
      <h4 className="font-bold text-purple-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
        <CheckCircle size={18}/> 2. Đánh giá tình trạng linh kiện
      </h4>
      
      <div className="space-y-3">
        {Object.keys(checklist).map(key => (
          <div 
            key={key} 
            className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border transition-colors ${
              checklist[key].status === "FAULTY" 
                ? "bg-red-50/50 border-red-200" 
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <span className="font-bold text-gray-700 mb-2 md:mb-0 w-full md:w-1/4">
              {checklist[key].name}
            </span>
            
            <div className="flex items-center gap-6 w-full md:w-1/2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer" 
                  checked={checklist[key].status === "OK"} 
                  onChange={() => onChange(key, "status", "OK")} 
                />
                <span className="text-sm font-bold text-gray-600 group-hover:text-green-600 transition-colors">
                  Ổn định
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer" 
                  checked={checklist[key].status === "FAULTY"} 
                  onChange={() => { 
                    onChange(key, "status", "FAULTY"); 
                    onChange(key, "detail", "95%"); 
                  }} 
                />
                <span className="text-sm font-bold text-gray-600 group-hover:text-red-600 transition-colors">
                  Kém / Hỏng
                </span>
              </label>
            </div>

            <div className="w-full md:w-1/4 mt-2 md:mt-0 flex justify-end">
              {checklist[key].status === "FAULTY" ? (
                <select 
                  value={checklist[key].detail} 
                  onChange={e => onChange(key, "detail", e.target.value)} 
                  className="w-full p-2 text-sm border-2 border-red-300 rounded outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium text-red-700"
                >
                  <option value="95%">Xước xát / Khá (95%)</option>
                  <option value="90%">Xấu / Trung bình (90%)</option>
                  <option value="80%">Rất tã / Kém (80%)</option>
                  <option value="Hỏng hẳn">Hỏng hẳn (Cần thay)</option>
                </select>
              ) : (
                <div className="w-full p-2 text-sm text-center text-green-600 font-bold bg-green-50 rounded border border-green-200">
                  100%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistForm;
