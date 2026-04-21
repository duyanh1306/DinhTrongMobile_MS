import React, { useState } from "react";
import { Settings, CheckCircle, X, Hammer, Scissors, Save, Plus, Trash2, Package, Search, Download, Wrench } from "lucide-react";
import WaitingDecisionTable from "./WaitingDecisionTable";

const parseChecklistFromNote = (noteStr) => {
  if (!noteStr) return [];
  const lines = noteStr.split('\n');
  const parsed = [];
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('-') && !cleanLine.includes('Cấu hình') && !cleanLine.includes('Ghi chú thêm')) {
      const parts = cleanLine.split(':');
      if (parts.length >= 2) {
        const name = parts[0].replace('-', '').trim();
        const statusStr = parts.slice(1).join(':').trim();
        const isBroken = statusStr.toLowerCase().includes('hỏng') || statusStr.toLowerCase().includes('kém');
        parsed.push({ name, statusStr, isBroken });
      }
    }
  });
  return parsed;
};

const WaitingDecisionTab = ({ 
  waitingPhones = [], 
  loading, 
  selectedDecisionPhone, 
  decision, 
  sellForm = {}, 
  dismantleParts = [], 
  itemTypes = [],
  replacementParts = [], 
  availablePartsInStock = [], 
  onFetchAvailableParts = () => {}, 
  onSetReplacementParts = () => {},
  onProcess = () => {}, 
  onCloseModal = () => {}, 
  onDecisionChange = () => {}, 
  onSellFormChange = () => {}, 
  onAddPart = () => {}, 
  onRemovePart = () => {}, 
  onPartChange = () => {}, 
  onSubmit = () => {} 
}) => {
  
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [partCategoryToReplace, setPartCategoryToReplace] = useState("");
  const [searchPart, setSearchPart] = useState("");

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [typeSearchTerm, setTypeSearchTerm] = useState("");

  const parsedChecklist = selectedDecisionPhone ? parseChecklistFromNote(selectedDecisionPhone.notes || selectedDecisionPhone.note || "") : [];

  const handleOpenPartSelector = (categoryName) => {
    setPartCategoryToReplace(categoryName);
    setSearchPart("");
    onFetchAvailableParts(); 
    setShowPartSelector(true);
  };

  const handleSelectPartToReplace = (itemObj) => {
    onSetReplacementParts([...replacementParts, { category: partCategoryToReplace, ...itemObj }]);
    setShowPartSelector(false);
  };

  const handleRemoveReplacement = (index) => {
    const newList = [...replacementParts];
    newList.splice(index, 1);
    onSetReplacementParts(newList);
  };

  const handleExtractPart = (parsedItem) => {
    const matchedType = itemTypes.find(it => 
      it.name.toLowerCase().includes(parsedItem.name.toLowerCase()) || 
      parsedItem.name.toLowerCase().includes(it.name.toLowerCase())
    );
    
    onAddPart({
      itemTypeId: matchedType ? matchedType._id : "",
      name: `${parsedItem.name} bóc máy`,
      serialCode: "",
      quality: "Zin bóc máy",
      ram: "",
      capacity: "",
      color: "",
      baseCost: "",
      price: ""
    });
  };

  let canSubmit = true;
  let submitButtonText = "XÁC NHẬN LƯU KHO";

  if (decision === "SELL") {
    const brokenParts = parsedChecklist.filter(i => i.isBroken);
    const hasFullReplacements = brokenParts.every(bp => replacementParts.some(rp => rp.category === bp.name));
    const hasSellPrice = sellForm.sellingPrice && String(sellForm.sellingPrice).trim() !== "";

    if (!hasFullReplacements) {
      canSubmit = false;
      submitButtonText = "CHƯA ĐỦ LINH KIỆN THAY THẾ";
    } else if (!hasSellPrice) {
      canSubmit = false;
      submitButtonText = "VUI LÒNG NHẬP GIÁ BÁN";
    }
  } else if (decision === "DISMANTLE") {
    if (dismantleParts.length === 0 || dismantleParts.some(p => !p.itemTypeId || !p.name || !p.price)) {
      canSubmit = false;
      submitButtonText = "ĐIỀN ĐỦ THÔNG TIN RÃ XÁC";
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full"><Settings className="w-8 h-8 text-blue-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Danh sách thiết bị chờ Quyết định</h3>
            <p className="text-blue-700">Tổng số: {waitingPhones.length} máy thu cũ đang chờ phân loại (Tân trang / Rã xác)</p>
          </div>
        </div>
      </div>

      <WaitingDecisionTable waitingPhones={waitingPhones} loading={loading} onProcess={onProcess} />

      {selectedDecisionPhone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-50 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold">Xử lý: <span className="text-blue-600">{selectedDecisionPhone.phoneModelId?.name}</span></h3>
              <button onClick={onCloseModal} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-3 mb-6 bg-white p-2 rounded-xl shadow-sm border">
                <button onClick={() => onDecisionChange("DIRECT_IMPORT")} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${decision === "DIRECT_IMPORT" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Download size={18}/> Nhập kho ngay
                </button>
                <button onClick={() => onDecisionChange("SELL")} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${decision === "SELL" ? "bg-green-100 text-green-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Hammer size={18}/> Tân trang / Sửa bán
                </button>
                <button onClick={() => onDecisionChange("DISMANTLE")} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${decision === "DISMANTLE" ? "bg-red-100 text-red-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                  <Scissors size={18}/> Rã xác lấy linh kiện
                </button>
              </div>

              {parsedChecklist.length > 0 && (
                <div className="bg-white p-5 rounded-xl border shadow-sm mb-6">
                  <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 uppercase text-sm">Kết quả kiểm định thu mua</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parsedChecklist.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                            <span className="font-semibold text-gray-700">{item.name}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${item.isBroken ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                              {item.statusStr}
                            </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {decision === "DIRECT_IMPORT" && (
                <div className="text-center bg-blue-50 border border-blue-200 p-8 rounded-xl shadow-inner">
                    <CheckCircle className="mx-auto w-16 h-16 text-blue-500 mb-4" />
                    <h3 className="text-xl font-bold text-blue-900 mb-2">Nhập nguyên bản vào kho</h3>
                    <p className="text-sm text-blue-700 max-w-md mx-auto">Máy có tình trạng hoàn hảo. Nhấn Xác nhận để chuyển thẳng máy vào trạng thái <strong>Sẵn sàng bán (In Stock)</strong>.</p>
                </div>
              )}

              {decision === "SELL" && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                     <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Wrench size={18}/> Đề xuất thay thế linh kiện</h4>
                     <p className="text-xs text-gray-500 mb-4">Chọn linh kiện từ Kho để thay thế cho các phần bị "Kém/Hỏng". Hệ thống sẽ tự động tạo phiếu xuất kho linh kiện.</p>
                     
                     {parsedChecklist.filter(i => i.isBroken).map((item, idx) => {
                        const isReplaced = replacementParts.some(rp => rp.category === item.name);

                        return (
                        <div key={idx} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-3 border rounded-xl transition-all ${isReplaced ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/30"}`}>
                            <span className={`font-bold ${isReplaced ? "text-green-700" : "text-red-700"} mb-2 sm:mb-0`}>
                              {item.name} bị {item.statusStr.toLowerCase()}
                            </span>
                            {!isReplaced ? (
                                <button onClick={() => handleOpenPartSelector(item.name)} className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition shadow-sm w-full sm:w-auto">
                                    + Chọn linh kiện thay thế
                                </button>
                            ) : (
                                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                                    <CheckCircle size={16}/> Đã chọn
                                </span>
                            )}
                        </div>
                        )
                     })}
                     {parsedChecklist.filter(i => i.isBroken).length === 0 && (
                       <p className="text-sm text-green-600 italic bg-green-50 p-3 rounded border border-green-200">Không phát hiện linh kiện nào hỏng từ báo cáo.</p>
                     )}

                     {replacementParts.length > 0 && (
                         <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <h5 className="text-sm font-bold text-green-800 mb-3 uppercase">Linh kiện đã chọn xuất kho:</h5>
                            {replacementParts.map((rp, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm text-green-700 bg-white p-2 rounded mb-2 border border-green-100 shadow-sm">
                                    <span className="font-medium">- Thay {rp.category}: <strong>{rp.name}</strong> <span className="text-xs text-gray-500 ml-1 font-mono">(SN: {rp.serialCode})</span></span>
                                    <button onClick={() => handleRemoveReplacement(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={16}/></button>
                                </div>
                            ))}
                         </div>
                     )}
                  </div>

                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <h4 className="font-bold text-gray-700 mb-4 uppercase text-sm border-b pb-2">Thông tin Niêm yết Bán</h4>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-2">Dung lượng</label>
                        <input type="text" value={sellForm.capacity || ''} onChange={e => onSellFormChange({...sellForm, capacity: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"/>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-2">Màu sắc</label>
                        <input type="text" value={sellForm.colorName || ''} onChange={e => onSellFormChange({...sellForm, colorName: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"/>
                      </div>
                    </div>
                    <div>
                      <label className="block font-black text-gray-800 mb-2">GIÁ BÁN SAU TÂN TRANG (VNĐ) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={sellForm.sellingPrice ? new Intl.NumberFormat('vi-VN').format(sellForm.sellingPrice) : ''} 
                        onChange={e => onSellFormChange({...sellForm, sellingPrice: e.target.value.replace(/\D/g, '')})} 
                        className="w-full p-4 border-2 border-green-300 rounded-lg outline-none focus:border-green-600 text-2xl font-black text-green-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {decision === "DISMANTLE" && (
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <label className="font-bold text-gray-800 flex items-center gap-2 text-lg"><Package className="text-red-600"/> Khai báo linh kiện tháo rời</label>
                    <button onClick={() => onAddPart({})} className="bg-red-50 text-red-600 border px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-red-100 text-sm transition shadow-sm">
                      <Plus size={16}/> Thêm form trống
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">Gợi ý (Bấm vào các món "Tốt" để gọi Form nhập nhanh):</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                      {parsedChecklist.filter(i => !i.isBroken).map((item, idx) => (
                          <span key={idx} onClick={() => handleExtractPart(item)} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-full text-xs font-bold text-gray-700 cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition shadow-sm">
                              + Bóc {item.name}
                          </span>
                      ))}
                      {parsedChecklist.filter(i => !i.isBroken).length === 0 && <span className="text-xs text-gray-400 italic">Không có linh kiện tốt</span>}
                  </div>
                  
                  <div className="space-y-6">
                      {dismantleParts.map((part, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-gray-200 relative bg-gray-50 shadow-sm group hover:border-red-300 transition">
                              <button onClick={() => onRemovePart(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 bg-white p-2 rounded-full shadow border transition"><Trash2 size={16}/></button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-10 mb-3">
                                  <div className="relative">
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Loại LK *</label>
                                      <div 
                                          onClick={() => {
                                              if (activeDropdown === idx) {
                                                  setActiveDropdown(null);
                                              } else {
                                                  setActiveDropdown(idx);
                                                  setTypeSearchTerm(part.name ? part.name.replace(/bóc máy/gi, '').trim() : "");
                                              }
                                          }}
                                          className={`w-full p-2.5 border rounded-lg bg-white text-sm cursor-pointer flex justify-between items-center transition ${activeDropdown === idx ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                                      >
                                          <span className={part.itemTypeId ? "text-gray-800 font-bold" : "text-gray-400"}>
                                              {part.itemTypeId ? itemTypes.find(it => it._id === part.itemTypeId)?.name : "-- Tìm / Chọn loại --"}
                                          </span>
                                      </div>

                                      {activeDropdown === idx && (
                                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                                              <div className="p-2 border-b bg-gray-50 rounded-t-lg">
                                                  <input 
                                                      type="text" 
                                                      autoFocus
                                                      placeholder="Tìm loại linh kiện..." 
                                                      value={typeSearchTerm} 
                                                      onChange={(e) => setTypeSearchTerm(e.target.value)} 
                                                      className="w-full p-2 border rounded outline-none text-sm focus:ring-2 focus:ring-red-500"
                                                  />
                                              </div>
                                              <div className="max-h-48 overflow-y-auto">
                                                  {itemTypes.filter(it => it.name.toLowerCase().includes(typeSearchTerm.toLowerCase())).map(it => (
                                                      <div 
                                                          key={it._id} 
                                                          onClick={() => {
                                                              onPartChange(idx, "itemTypeId", it._id);
                                                              setActiveDropdown(null);
                                                          }} 
                                                          className="p-3 text-sm hover:bg-red-50 cursor-pointer border-b last:border-0 font-medium text-gray-700 hover:text-red-700"
                                                      >
                                                          {it.name}
                                                      </div>
                                                  ))}
                                                  {itemTypes.filter(it => it.name.toLowerCase().includes(typeSearchTerm.toLowerCase())).length === 0 && (
                                                      <div className="p-3 text-sm text-center text-gray-400 italic">Không tìm thấy loại này</div>
                                                  )}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên hiển thị *</label>
                                      <input type="text" value={part.name || ''} onChange={(e) => onPartChange(idx, "name", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500"/>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Serial (SN)</label>
                                      <input type="text" placeholder="Tự sinh nếu trống" value={part.serialCode} onChange={(e) => onPartChange(idx, "serialCode", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm font-mono bg-white focus:ring-2 focus:ring-red-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tình trạng</label>
                                      <input type="text" value={part.quality} onChange={(e) => onPartChange(idx, "quality", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dung lượng</label>
                                      <input type="text" value={part.capacity} onChange={(e) => onPartChange(idx, "capacity", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">RAM</label>
                                      <input type="text" value={part.ram} onChange={(e) => onPartChange(idx, "ram", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500"/>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-red-50/50 p-3 rounded-lg border border-red-100">
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Màu sắc</label>
                                      <input type="text" value={part.color} onChange={(e) => onPartChange(idx, "color", e.target.value)} className="w-full p-2.5 border rounded-lg outline-none text-sm bg-white focus:ring-2 focus:ring-red-500"/>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giá vốn nhập</label>
                                      <input 
                                        type="text" 
                                        placeholder="0" 
                                        value={part.baseCost ? new Intl.NumberFormat('vi-VN').format(part.baseCost) : ''} 
                                        onChange={(e) => onPartChange(idx, "baseCost", e.target.value.replace(/\D/g, ''))} 
                                        className="w-full p-2.5 border rounded-lg outline-none text-sm font-bold text-gray-700 bg-white focus:ring-2 focus:ring-red-500"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-red-600 uppercase mb-1">Giá bán lẻ (VND) *</label>
                                      <input 
                                        type="text" 
                                        placeholder="0" 
                                        value={part.price ? new Intl.NumberFormat('vi-VN').format(part.price) : ''} 
                                        onChange={(e) => onPartChange(idx, "price", e.target.value.replace(/\D/g, ''))} 
                                        className="w-full p-2.5 border-2 border-red-200 rounded-lg outline-none text-sm font-bold text-red-600 bg-white focus:border-red-500"
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                      {dismantleParts.length === 0 && (
                          <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-red-200">
                              <p className="text-gray-500 text-sm">Bấm "Thêm form trống" hoặc các Gợi ý bên trên để khai báo</p>
                          </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t bg-white flex justify-end gap-4 rounded-b-2xl">
              <button onClick={onCloseModal} className="px-6 py-2.5 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">Đóng</button>
              <button 
                onClick={onSubmit} 
                disabled={!canSubmit}
                className={`px-8 py-2.5 rounded-xl font-black text-white shadow-md transition-all flex items-center gap-2 ${
                  !canSubmit 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : decision === "SELL" 
                        ? "bg-green-600 hover:bg-green-700 hover:-translate-y-1 shadow-green-200" 
                        : "bg-red-600 hover:bg-red-700 hover:-translate-y-1 shadow-red-200"
                }`}
              >
                <Save size={18}/> {submitButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPartSelector && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="p-4 border-b bg-red-50 flex justify-between items-center">
                      <h3 className="font-bold text-red-800">Chọn {partCategoryToReplace} từ Kho</h3>
                      <button onClick={() => setShowPartSelector(false)}><X size={20} className="text-red-500"/></button>
                  </div>
                  <div className="p-4">
                      <div className="relative mb-4">
                          <Search className="absolute left-3 top-3 text-gray-400" size={16}/>
                          <input 
                            type="text" 
                            placeholder="Gõ để tìm thêm..." 
                            value={searchPart} 
                            onChange={e => setSearchPart(e.target.value)} 
                            className="w-full pl-9 pr-3 py-2.5 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-500 bg-gray-50"
                          />
                      </div>
                      
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                          {availablePartsInStock
                              .filter(p => {
                                  const matchesCategory = p.name.toLowerCase().includes(partCategoryToReplace.toLowerCase()) || 
                                                          p.item_type?.name?.toLowerCase().includes(partCategoryToReplace.toLowerCase());
                                  const matchesSearch = p.name.toLowerCase().includes(searchPart.toLowerCase());
                                  return searchPart ? matchesSearch : matchesCategory;
                              })
                              .map(part => (
                              <div key={part._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition border-gray-200">
                                  <div>
                                      <p className="font-bold text-sm text-gray-800">{part.name}</p>
                                      <p className="text-xs text-gray-500 font-mono mt-0.5">SN: {part.serialCode}</p>
                                  </div>
                                  <button onClick={() => handleSelectPartToReplace(part)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-200 transition shadow-sm flex-shrink-0">
                                      + Xuất kho
                                  </button>
                              </div>
                          ))}
                          
                          {availablePartsInStock.filter(p => 
                              searchPart 
                                ? p.name.toLowerCase().includes(searchPart.toLowerCase()) 
                                : p.name.toLowerCase().includes(partCategoryToReplace.toLowerCase()) || p.item_type?.name?.toLowerCase().includes(partCategoryToReplace.toLowerCase())
                          ).length === 0 && (
                              <div className="text-center py-8">
                                  <p className="text-gray-500 text-sm font-bold">Không tìm thấy "{searchPart || partCategoryToReplace}" trong kho!</p>
                                  <p className="text-gray-400 text-xs mt-1">Hãy xóa bớt chữ ở ô tìm kiếm hoặc tạo phiếu Nhập kho mới.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default WaitingDecisionTab;