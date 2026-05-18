import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, ClipboardList, AlertTriangle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import axiosClient from "../../api/axiosClient";
import "react-toastify/dist/ReactToastify.css";

export default function ManageEvaluationCriteria() {
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    partCode: "",
    partName: "",
    order: 0,
    conditions: []
  });

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/evaluation-criteria");
      setCriteriaList(res.data.data || []);
    } catch (err) {
      toast.error("Lỗi lấy dữ liệu tiêu chí!");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (criteria = null) => {
    if (criteria) {
      setEditingId(criteria._id);
      setFormData({
        partCode: criteria.partCode,
        partName: criteria.partName,
        order: criteria.order,
        conditions: [...criteria.conditions]
      });
    } else {
      setEditingId(null);
      setFormData({
        partCode: "",
        partName: "",
        order: criteriaList.length,
        conditions: [
          { label: "Hoạt động bình thường", value: "OK", deductionPercent: 0, deductionAmount: 0, isFaulty: false }
        ]
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ partCode: "", partName: "", order: 0, conditions: [] });
    setEditingId(null);
  };

  const handleAddCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { label: "", value: "", deductionPercent: 0, deductionAmount: 0, isFaulty: false }]
    }));
  };

  const handleRemoveCondition = (index) => {
    setFormData(prev => {
      const newCond = [...prev.conditions];
      newCond.splice(index, 1);
      return { ...prev, conditions: newCond };
    });
  };

  const handleConditionChange = (index, field, value) => {
    setFormData(prev => {
      const newCond = [...prev.conditions];
      newCond[index][field] = value;
      return { ...prev, conditions: newCond };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partCode || !formData.partName) {
      return toast.warning("Mã và Tên linh kiện không được để trống!");
    }

    try {
      if (editingId) {
        await axiosClient.put(`/evaluation-criteria/${editingId}`, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await axiosClient.post("/evaluation-criteria", formData);
        toast.success("Thêm tiêu chí mới thành công!");
      }
      fetchCriteria();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tiêu chí đánh giá này?")) return;
    try {
      await axiosClient.delete(`/evaluation-criteria/${id}`);
      toast.success("Xóa thành công!");
      fetchCriteria();
    } catch (err) {
      toast.error("Lỗi khi xóa!");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" /> Quản lý Tiêu chí Đánh giá
        </h2>
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-sm">
          <Plus size={18} /> Thêm Linh kiện mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {criteriaList.map((item) => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{item.partName}</h3>
                  <p className="text-xs text-gray-500 font-mono">Code: {item.partCode}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto max-h-60">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Các mức độ đánh giá ({item.conditions.length})</p>
                <div className="space-y-2">
                  {item.conditions.map((cond, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-sm ${cond.isFaulty ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800">{cond.label}</span>
                        {cond.isFaulty && <AlertTriangle size={14} className="text-red-500"/>}
                      </div>
                      <div className="text-xs text-gray-500 grid grid-cols-2 gap-1 mt-2">
                        <span>Giá trị: <code className="bg-gray-100 px-1 rounded">{cond.value}</code></span>
                        <span className="text-right font-medium text-red-600">Trừ: {cond.deductionPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? "Sửa Tiêu chí Linh kiện" : "Thêm Linh kiện mới"}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 p-1"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên hiển thị (Ví dụ: Màn hình) *</label>
                  <input type="text" value={formData.partName} onChange={e => setFormData({...formData, partName: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mã hệ thống (Ví dụ: screen) *</label>
                  <input type="text" value={formData.partCode} onChange={e => setFormData({...formData, partCode: e.target.value})} disabled={!!editingId} className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono ${editingId ? 'bg-gray-100 text-gray-500' : ''}`} required />
                </div>
              </div>

              <div className="mb-4 flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-gray-800">Các Tình Trạng Lựa Chọn</h4>
                <button type="button" onClick={handleAddCondition} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-bold flex items-center gap-1"><Plus size={14}/> Thêm tình trạng</button>
              </div>

              <div className="space-y-4">
                {formData.conditions.map((cond, idx) => (
                  <div key={idx} className={`p-4 border-2 rounded-xl relative ${cond.isFaulty ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50'}`}>
                    <button type="button" onClick={() => handleRemoveCondition(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                    
                    <div className="grid grid-cols-12 gap-3 mt-2">
                      <div className="col-span-12 md:col-span-5">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Tên tình trạng (VD: Ám ố nhẹ)</label>
                        <input type="text" value={cond.label} onChange={e => handleConditionChange(idx, 'label', e.target.value)} className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm" required />
                      </div>
                      <div className="col-span-12 md:col-span-3">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Value (Mã)</label>
                        <input type="text" value={cond.value} onChange={e => handleConditionChange(idx, 'value', e.target.value)} className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono" required />
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-bold text-red-600 mb-1">Trừ phần trăm (%)</label>
                        <input type="number" min="0" max="100" value={cond.deductionPercent} onChange={e => handleConditionChange(idx, 'deductionPercent', Number(e.target.value))} className="w-full p-2 border border-red-200 rounded outline-none focus:ring-1 focus:ring-red-500 text-sm" />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cond.isFaulty} onChange={e => handleConditionChange(idx, 'isFaulty', e.target.checked)} className="w-4 h-4 accent-red-600" />
                        <span className={`text-sm font-bold ${cond.isFaulty ? 'text-red-600' : 'text-gray-600'}`}>Đánh dấu đây là lỗi Nặng / Buộc phải thay linh kiện</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={closeModal} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300">Hủy</button>
              <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md"><Save size={18}/> Lưu Tiêu Chí</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}