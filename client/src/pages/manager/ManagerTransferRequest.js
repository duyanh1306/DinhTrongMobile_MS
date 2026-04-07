import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, X, Package, Store, Smartphone, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { 
    fetchStoresApi, 
    fetchItemsByStoreApi, 
    fetchPhonesByStoreApi, 
    createTransferRequestApi 
} from "../../api/manager/transferRequest"; 

export default function ManagerTransferRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [activeTab, setActiveTab] = useState('ITEMS');

  const [availableItems, setAvailableItems] = useState([]);
  const [availablePhones, setAvailablePhones] = useState([]);

  const [selectedItemQuantities, setSelectedItemQuantities] = useState({});
  const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);

  const [formData, setFormData] = useState({
    fromStoreId: "",
    toStoreId: "",
    note: ""
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    fetchStoresAndSetUserStore(userData._id || userData.id);
  }, []);

  useEffect(() => {
    if (formData.fromStoreId) {
      fetchInventoryData(formData.fromStoreId);
    }
  }, [formData.fromStoreId]);

  const fetchStoresAndSetUserStore = async (userId) => {
    try {
      const storesArray = await fetchStoresApi();
      setStores(storesArray);
      
      const userStore = storesArray.find(store => store.staff && store.staff.includes(userId));
      
      if (userStore) {
        setFormData(prev => ({ ...prev, fromStoreId: userStore._id }));
        setUser(prev => ({ ...prev, storeId: userStore }));
      } else {
        toast.error("Không tìm thấy cửa hàng của bạn!");
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách cửa hàng");
    }
  };

  const fetchInventoryData = async (storeId) => {
    setFetchingData(true);
    try {
      const [itemsData, phonesData] = await Promise.all([
        fetchItemsByStoreApi(storeId),
        fetchPhonesByStoreApi(storeId)
      ]);

      const newItems = (itemsData.data || itemsData || []).filter(i => i.status === 'in_stock' && i.origin === 'new');
      setAvailableItems(newItems);

      const newPhones = (phonesData.data || phonesData || []).filter(p => p.status === 'in_stock' && p.grade === 'Mới');
      setAvailablePhones(newPhones);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu kho hàng");
    } finally {
      setFetchingData(false);
    }
  };

  const groupedItems = React.useMemo(() => {
    const groups = {};
    availableItems.forEach(item => {
      const typeId = item.item_type?._id || item.item_type;
      const typeName = item.item_type?.name || item.name;

      if (!groups[typeId]) {
        groups[typeId] = { typeId, typeName, items: [], maxQuantity: 0 };
      }
      groups[typeId].items.push(item);
      groups[typeId].maxQuantity++;
    });
    return Object.values(groups);
  }, [availableItems]);

  const handleItemQuantityChange = (typeId, value, max) => {
    let val = parseInt(value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > max) val = max;

    setSelectedItemQuantities(prev => {
      const updated = { ...prev, [typeId]: val };
      if (val === 0) delete updated[typeId];
      return updated;
    });
  };

  const handlePhoneToggle = (phoneId) => {
    setSelectedPhoneIds(prev => 
      prev.includes(phoneId) ? prev.filter(id => id !== phoneId) : [...prev, phoneId]
    );
  };

  const handleSelectAllPhones = () => {
    if (selectedPhoneIds.length === availablePhones.length) {
      setSelectedPhoneIds([]);
    } else {
      setSelectedPhoneIds(availablePhones.map(p => p._id));
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.toStoreId) return toast.error("Vui lòng chọn cửa hàng đích");
    if (formData.fromStoreId === formData.toStoreId) return toast.error("Cửa hàng nguồn và đích không được trùng nhau");
    
    if (Object.keys(selectedItemQuantities).length === 0 && selectedPhoneIds.length === 0) {
      return toast.error("Vui lòng chọn ít nhất một mặt hàng hoặc điện thoại để chuyển");
    }

    setLoading(true);

    try {
      const finalItemIds = [];
      const itemTypesMapForApi = {};

      groupedItems.forEach(group => {
        const qty = selectedItemQuantities[group.typeId] || 0;
        if (qty > 0) {
          const selectedItems = group.items.slice(0, qty);
          finalItemIds.push(...selectedItems.map(i => i._id));
          
          itemTypesMapForApi[group.typeId] = {
            itemTypes: group.typeId,
            quantity: qty
          };
        }
      });

      const requestData = {
        ...formData,
        requestedBy: user._id || user.id,
        items: finalItemIds,
        phones: selectedPhoneIds,
        itemType: Object.values(itemTypesMapForApi)
      };

      await createTransferRequestApi(requestData);

      toast.success("Tạo yêu cầu chuyển kho thành công!");
      navigate("/manager/transfer_approvals");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo yêu cầu chuyển kho");
    } finally {
      setLoading(false);
    }
  };

  const totalSelectedItems = Object.values(selectedItemQuantities).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/manager/transfer_approvals")} className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white shadow-sm"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Yêu Cầu Luân Chuyển</h1>
          <p className="text-sm text-gray-600">Luân chuyển Linh kiện mới và Điện thoại mới giữa các kho</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2"><Store size={16} className="inline mr-1" /> Từ Cửa Hàng (Nguồn)</label>
            <input type="text" value={user.storeId?.name || "Đang tải..."} readOnly className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2"><Store size={16} className="inline mr-1" /> Tới Cửa Hàng (Đích)</label>
            <select name="toStoreId" value={formData.toStoreId} onChange={handleInputChange} required className="w-full px-4 py-2.5 border border-blue-300 rounded-lg bg-blue-50/30 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-blue-900">
              <option value="">-- Bấm để chọn Cửa hàng nhận --</option>
              {stores.filter(s => s._id !== formData.fromStoreId).map(store => (
                <option key={store._id} value={store._id}>{store.name} - {store.address || store.location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button onClick={() => setActiveTab('ITEMS')} className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ITEMS' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}><Package size={18}/> Chọn Linh Kiện ({totalSelectedItems})</button>
          <button onClick={() => setActiveTab('PHONES')} className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'PHONES' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}><Smartphone size={18}/> Chọn Điện Thoại ({selectedPhoneIds.length})</button>
        </div>

        <div className="p-4 md:p-6 min-h-[300px]">
          {fetchingData ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div></div>
          ) : activeTab === 'ITEMS' ? (
            <div>
              {groupedItems.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-medium">Kho không có linh kiện mới nào sẵn sàng.</p>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr><th className="px-4 py-3 font-bold">Loại Linh Kiện</th><th className="px-4 py-3 font-bold text-center w-32">Tồn Kho (Mới)</th><th className="px-4 py-3 font-bold text-center w-40">Số Lượng Chuyển</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedItems.map(group => (
                      <tr key={group.typeId} className={`hover:bg-blue-50/30 transition ${selectedItemQuantities[group.typeId] > 0 ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{group.typeName}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{group.maxQuantity}</td>
                        <td className="px-4 py-3 text-center">
                          <input type="number" min="0" max={group.maxQuantity} value={selectedItemQuantities[group.typeId] || ''} onChange={(e) => handleItemQuantityChange(group.typeId, e.target.value, group.maxQuantity)} placeholder="0" className={`w-24 text-center px-2 py-1.5 border rounded-lg outline-none font-bold ${selectedItemQuantities[group.typeId] > 0 ? 'border-blue-500 bg-white text-blue-700' : 'border-gray-300 bg-gray-50'}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {availablePhones.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-medium">Kho không có điện thoại mới nào sẵn sàng.</p>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr><th className="px-4 py-3 font-bold text-center w-16"><button onClick={handleSelectAllPhones} className="text-blue-600 hover:text-blue-800 transition" title="Chọn tất cả"><CheckSquare size={18} className="mx-auto"/></button></th><th className="px-4 py-3 font-bold">Dòng Máy</th><th className="px-4 py-3 font-bold">Serial Code</th><th className="px-4 py-3 font-bold">Màu / ROM</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {availablePhones.map(phone => {
                      const isSelected = selectedPhoneIds.includes(phone._id);
                      return (
                        <tr key={phone._id} onClick={() => handlePhoneToggle(phone._id)} className={`cursor-pointer hover:bg-blue-50/50 transition ${isSelected ? 'bg-blue-50/80' : ''}`}>
                          <td className="px-4 py-3 text-center"><input type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 text-blue-600 rounded cursor-pointer pointer-events-none" /></td>
                          <td className="px-4 py-3 font-bold text-gray-800">{phone.phoneModelId?.name || "Máy"}</td>
                          <td className="px-4 py-3 font-mono text-gray-600">{phone.serialCode}</td>
                          <td className="px-4 py-3 text-gray-700">{phone.colorName} - {phone.capacity}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú phiếu chuyển kho</label>
        <textarea name="note" value={formData.note} onChange={handleInputChange} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Ví dụ: Chuyển hàng xuất bán khẩn cấp..." />
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-gray-600">Tổng cộng: <strong className="text-blue-700">{totalSelectedItems} linh kiện</strong> và <strong className="text-blue-700">{selectedPhoneIds.length} máy</strong></div>
          <div className="flex w-full md:w-auto gap-3">
            <button type="button" onClick={() => navigate("/manager/transfer_approvals")} className="flex-1 md:flex-none px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">Hủy</button>
            <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 md:flex-none px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"><Save size={18} /> {loading ? "Đang tạo..." : "Xác Nhận Tạo Phiếu"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}