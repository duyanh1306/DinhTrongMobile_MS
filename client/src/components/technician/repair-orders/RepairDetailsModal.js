import { useState, useEffect, useMemo, useRef } from "react";
import { X, User, Phone, Store, Check, Wrench, CheckCircle, Package, XCircle, Printer, Download, ScanLine } from "lucide-react";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";
import html2pdf from "html2pdf.js";
import { toast } from "react-toastify";

import { getAllRepairServices } from "../../../api/repairOrder";
import { getAllItems } from "../../../api/item";
import { validateRepairPartApi } from "../../../api/repairPartValidation";
import axiosClient from "../../../api/axiosClient";
import { docSoThanhChu } from "../../../utils/formatCurrency";
import {
  getPartCodesFromServices,
  getRecipeForPhoneModel,
  getAllowedTypeNames,
  formatPartCodesDisplay,
} from "../../../utils/repairPartValidation";

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const InvoicePrintA4 = ({ order, details, activeTab, contentRef }) => {
  let invoiceTitle = "PHIẾU THANH TOÁN KIÊM BẢO HÀNH SỬA CHỮA";

  return (
    <div
      ref={contentRef}
      className="bg-white text-black p-10"
      style={{ width: "210mm", minHeight: "297mm", fontFamily: "'Times New Roman', Times, serif", margin: "0 auto" }}
    >
      <style type="text/css" media="print">{`@page { size: A4 portrait; margin: 10mm; }`}</style>

      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
        <div>
            <h1 className="text-xl font-black uppercase tracking-wide">CÔNG TY TNHH DINH TRONG MOBILE</h1>
            <p className="text-sm mt-1"><strong>Showroom:</strong> {order?.storeId?.address || "Hà Nội"}</p>
            <p className="text-sm"><strong>Điện thoại:</strong> {order?.storeId?.hotline || "0987.654.321"}</p>
            <p className="text-sm"><strong>Website:</strong> dinhtrongmobile.vn | <strong>Email:</strong> cskh@dinhtrongmobile.vn</p>
        </div>
        <div className="text-right">
            <div className="w-20 h-20 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 mb-1">QR CODE</div>
            <p className="text-[10px] italic">Quét để tra cứu bảo hành</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase">{invoiceTitle}</h2>
        <p className="text-sm italic mt-1">Ngày {dayjs(order?.createdAt || order?.repairOrderDate || new Date()).format('DD')} tháng {dayjs(order?.createdAt || order?.repairOrderDate || new Date()).format('MM')} năm {dayjs(order?.createdAt || order?.repairOrderDate || new Date()).format('YYYY')}</p>
        <p className="text-sm font-bold mt-1">Số: #{order?._id?.substring(order._id.length - 8).toUpperCase()}</p>
      </div>

      <div className="mb-6 text-sm space-y-2">
        <p><strong>Tên khách hàng:</strong> {order?.customerName}</p>
        <p><strong>Điện thoại:</strong> {order?.customerPhone || "..........................................................."}</p>
        <p><strong>Nhân viên phục vụ:</strong> {order?.createdBy?.fullName || order?.createdBy?.userName || "N/A"}</p>
      </div>

      <table className="w-full border-collapse border border-gray-800 mb-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 p-2 text-center w-12">STT</th>
            <th className="border border-gray-800 p-2 text-left">Tên Dịch vụ / Linh kiện</th>
            <th className="border border-gray-800 p-2 text-center w-16">SL</th>
            <th className="border border-gray-800 p-2 text-center w-32">Bảo hành</th>
            <th className="border border-gray-800 p-2 text-right w-32">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, idx) => {
            const isWarranty = d.type === "WARRANTY" || order?.repairType === "Bảo hành";
            const targetPhone = d.targetPhoneId?.phoneModelId?.name || order?.phoneModel?.name || order?.phoneModel || "Máy khách";
            
            const services = d.serviceId || [];
            const items = d.itemIds || [];
            
            let srvStr = services.length > 0 ? `DV: ${services.map(s => s.name).join(', ')}` : "";
            let itemStr = items.length > 0 ? `Thay: ${items.map(i => i.name).join(', ')}` : "";
            
            let itemName = `${isWarranty ? "Bảo hành" : "Sửa chữa"}: ${targetPhone}`;
            if (srvStr || itemStr) {
                itemName += ` (${[srvStr, itemStr].filter(Boolean).join(' | ')})`;
            }

            const srvPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
            const itmPrice = items.reduce((sum, i) => sum + (i.price || i.sellingPrice || 0), 0);
            let price = isWarranty ? 0 : (srvPrice + itmPrice);

            return (
              <tr key={idx}>
                <td className="border border-gray-800 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-800 p-2 font-medium">{itemName}</td>
                <td className="border border-gray-800 p-2 text-center">1</td>
                <td className="border border-gray-800 p-2 text-center text-xs">Bảo hành DV</td>
                <td className="border border-gray-800 p-2 text-right font-bold">{formatCurrency(price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-1/2 text-right">
            <div className="text-lg mb-1">
                <strong>Tổng cộng:</strong> <span className="text-xl font-black">{formatCurrency(order?.totalPrice)}</span>
            </div>
            <div className="text-sm italic text-gray-700">
                (Bằng chữ: {docSoThanhChu ? docSoThanhChu(order?.totalPrice || 0) : ""})
            </div>
        </div>
      </div>

      <div className="text-[11px] mb-10 leading-relaxed text-gray-700">
        <p className="font-bold underline text-black mb-1">Lưu ý / Quy định bảo hành:</p>
        <p>- Quý khách vui lòng kiểm tra kỹ thiết bị, hình thức, chức năng trước khi rời khỏi cửa hàng.</p>
        <p>- Cửa hàng không bảo hành đối với các trường hợp: Rơi vỡ, cấn móp, vào nước, chập cháy, đứt cáp, mất Tem bảo hành.</p>
        <p>- Quý khách vui lòng giữ lại phiếu này để thuận tiện cho việc tra cứu và hỗ trợ bảo hành sửa chữa.</p>
      </div>

      <div className="flex justify-between text-center text-sm font-bold pt-8">
        <div className="w-1/3"><p>Khách Hàng</p><p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p></div>
        <div className="w-1/3"><p>Kỹ Thuật Viên</p><p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p></div>
        <div className="w-1/3"><p>Thu Ngân</p><p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p></div>
      </div>
    </div>
  );
};

const RepairDetailsModal = ({
  selectedOrder,
  showDetailsModal,
  onClose,
  onAccept,
  onOrderUpdate,
  onCancel,
  orderDetails,
}) => {
  const [repairServices, setRepairServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef(null);

  const [phoneModels, setPhoneModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [recipes, setRecipes] = useState([]);
  const printRef = useRef(null);

  const isWarranty = selectedOrder?.repairType === "Bảo hành" || orderDetails?.some(d => d.type === "WARRANTY");
  const isReadOnly = selectedOrder?.status === "Completed" || selectedOrder?.status === "Cancelled";

  const selectedPartCodes = useMemo(
    () => getPartCodesFromServices(repairServices, selectedServices),
    [repairServices, selectedServices]
  );

  const recipeForModel = useMemo(
    () => getRecipeForPhoneModel(recipes, selectedModel),
    [recipes, selectedModel]
  );

  const allowedTypeNames = useMemo(
    () => getAllowedTypeNames(recipeForModel, selectedPartCodes),
    [recipeForModel, selectedPartCodes]
  );

  const selectedModelLabel = useMemo(() => {
    const m = phoneModels.find((pm) => String(pm._id) === String(selectedModel));
    return m?.name || "";
  }, [phoneModels, selectedModel]);

  // ĐÃ SỬA: Đổi tên thành canSelectParts
  const canSelectParts =
    isWarranty ||
    (!!selectedModel && selectedServices.length > 0 && selectedPartCodes.length > 0);

  const allowedItemsInStock = useMemo(() => {
    if (!recipeForModel || selectedPartCodes.length === 0) return [];
    const allowedIds = new Set();
    recipeForModel.requiredParts.forEach((part) => {
      if (!selectedPartCodes.includes(part.partCode)) return;
      (part.acceptedItemTypes || []).forEach((t) => {
        allowedIds.add(String(t._id || t));
      });
    });
    return items.filter((item) => {
      const typeId = String(item.item_type?._id || item.item_type || "");
      return typeId && allowedIds.has(typeId);
    });
  }, [items, recipeForModel, selectedPartCodes]);

  useEffect(() => {
    if (showDetailsModal) {
      fetchRepairServices();
      fetchItems();
      fetchPhoneModels();
      fetchRecipes();

      if (orderDetails && orderDetails.length > 0) {
        const existingServiceIds = orderDetails.flatMap(detail => 
          detail.serviceId ? detail.serviceId.map(s => s._id) : []
        );
        setSelectedServices(existingServiceIds);
        
        const existingItemIds = orderDetails.flatMap(detail => 
          detail.itemIds ? detail.itemIds.map(i => i._id) : [] 
        );
        setSelectedItems(existingItemIds);
      }
      
      const detailWithPhone = orderDetails?.find(d => d.targetPhoneId) || null;
      const targetPhone = detailWithPhone?.targetPhoneId;
      
      let initialModelId = targetPhone?.phoneModelId?._id || targetPhone?.phoneModelId || selectedOrder?.phoneModelId?._id || selectedOrder?.phoneModelId || "";
      if (typeof initialModelId === 'object' && initialModelId !== null) {
          initialModelId = initialModelId._id || "";
      }
      setSelectedModel(initialModelId);

      if (!isReadOnly && scanInputRef.current) {
        setTimeout(() => scanInputRef.current.focus(), 100);
      }
    }
  }, [showDetailsModal, orderDetails, selectedOrder]);

  const fetchPhoneModels = async () => {
    try {
      const res = await axiosClient.get("/phone_models/all");
      setPhoneModels(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {}
  };

  const fetchRecipes = async () => {
    try {
      const res = await axiosClient.get("/recipes/all");
      const data = res.data?.data || res.data || [];
      setRecipes(Array.isArray(data) ? data : []);
    } catch (error) {
      setRecipes([]);
    }
  };

  const fetchRepairServices = async () => {
    try {
      setLoadingServices(true);
      const response = await getAllRepairServices();
      setRepairServices(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await getAllItems();
      setItems(Array.isArray(response) ? response : response.data || []);
    } catch (error) {}
  };

  const handleServiceToggle = (serviceId) => {
    if (isReadOnly) return; 
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        const removedService = repairServices.find(s => s._id === serviceId);
        if (removedService && removedService.partCode) {
            setSelectedItems(currentItems => currentItems.filter(id => {
                const item = items.find(i => String(i._id) === String(id));
                return getPartCodeForItem(item) !== removedService.partCode;
            }));
        }
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  const getPartCodeForItem = (item) => {
    if (!recipeForModel) return null;
    const typeId = String(item?.item_type?._id || item?.item_type || "");
    for (const part of recipeForModel.requiredParts) {
      const allowedTypes = part.acceptedItemTypes.map(t => String(t._id || t));
      if (allowedTypes.includes(typeId)) return part.partCode;
    }
    return null;
  };

  const handleAddItem = (item) => {
    if (selectedItems.some((id) => String(id) === String(item._id))) {
      toast.warning("Linh kiện này đã được chọn!");
      return;
    }

    const partCode = getPartCodeForItem(item);
    if (!partCode) {
      toast.error("Linh kiện không khớp với cấu hình máy!");
      return;
    }

    const isSlotFull = selectedItems.some(id => {
      const existingItem = items.find(i => String(i._id) === String(id));
      return getPartCodeForItem(existingItem) === partCode;
    });

    if (isSlotFull) {
      toast.warning(`Chỉ được chọn 1 linh kiện cho [${formatPartCodesDisplay([partCode])}]. Vui lòng xóa linh kiện cũ trước!`);
      return;
    }

    setSelectedItems(prev => [...prev, item._id]);
    toast.success(`Đã thêm: ${item.name}`);
  };

  const validateBeforeSave = async () => {
    if (isWarranty) return true;
    if (!selectedModel) {
      toast.error("Vui lòng chọn mẫu điện thoại");
      return false;
    }
    if (selectedServices.length === 0) {
      toast.error("Vui lòng chọn ít nhất một dịch vụ sửa chữa");
      return false;
    }
    
    for (const code of selectedPartCodes) {
      const isFulfilled = selectedItems.some(id => {
        const item = items.find(i => String(i._id) === String(id));
        return getPartCodeForItem(item) === code;
      });
      if (!isFulfilled) {
        toast.error(`Chưa chọn linh kiện cho dịch vụ thay ${formatPartCodesDisplay([code])}!`);
        return false;
      }
    }

    for (const id of selectedItems) {
      const item = items.find((i) => String(i._id) === String(id));
      if (!item?.serialCode) continue;
      const result = await validateRepairPartApi({
        phoneModelId: selectedModel,
        partCodes: selectedPartCodes,
        serialCode: item.serialCode,
      });
      if (!result.ok) {
        toast.error(result.message || `Linh kiện "${item.name}" không hợp lệ`);
        return false;
      }
    }
    return true;
  };

  const handleScan = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scanInput.trim();
      if (!code) return;

      if (!isWarranty) {
        if (!selectedModel) {
          toast.error("Vui lòng chọn mẫu điện thoại trước khi quét linh kiện");
          setScanInput("");
          return;
        }
        if (selectedServices.length === 0) {
          toast.error("Vui lòng chọn dịch vụ sửa chữa trước khi quét linh kiện");
          setScanInput("");
          return;
        }
        if (selectedPartCodes.length === 0) {
          toast.error('Dịch vụ chưa gán nhóm linh kiện (BAT, SCR...). Liên hệ Admin.');
          setScanInput("");
          return;
        }
      }

      if (isWarranty) {
        const foundItem = items.find(
          (item) => item.serialCode && item.serialCode.toUpperCase() === code.toUpperCase()
        );
        if (!foundItem) {
          toast.error(`Không tìm thấy linh kiện: ${code}`);
        } else {
          handleAddItem(foundItem);
        }
        setScanInput("");
        return;
      }

      try {
        const result = await validateRepairPartApi({
          phoneModelId: selectedModel,
          partCodes: selectedPartCodes,
          serialCode: code,
        });

        if (!result.ok || !result.item) {
          toast.error(result.message || "Linh kiện không phù hợp");
          setScanInput("");
          return;
        }
        handleAddItem(result.item);
      } catch {
        toast.error("Lỗi kiểm tra linh kiện");
      }
      setScanInput("");
    }
  };

  const handleRemoveItem = (itemId) => {
    if (isReadOnly) return; 
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  const getSelectedServiceNames = () => {
    return repairServices.filter(service => selectedServices.includes(service._id)).map(service => service.name).join(', ');
  };

  const getSelectedServiceTotal = () => {
    if (isWarranty) return 0;
    return repairServices.filter(service => selectedServices.includes(service._id)).reduce((total, service) => total + (service.price || 0), 0);
  };

  const getSelectedItemTotal = () => {
    if (isWarranty) return 0;
    return items.filter(item => selectedItems.includes(item._id)).reduce((total, item) => total + (item.price || 0), 0);
  };

  const getGrandTotal = () => {
    return getSelectedServiceTotal() + getSelectedItemTotal();
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `HoaDon_Repair_${selectedOrder?._id.substring(0, 6)}`,
  });

  const handleDownloadPDF = () => {
      const element = printRef.current;
      const opt = {
          margin:       [10, 10, 10, 10], 
          filename:     `HoaDon_Repair_${selectedOrder?._id?.substring(selectedOrder._id.length - 6).toUpperCase() || 'Moi'}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      toast.info("Đang tạo file PDF, vui lòng đợi giây lát...", { autoClose: 2000 });
      html2pdf().set(opt).from(element).save().then(() => {
          toast.success("Tải file PDF thành công!");
      }).catch(err => {
          toast.error("Có lỗi khi tạo PDF!");
      });
  };

  if (!showDetailsModal || !selectedOrder) return null;

  const detailWithPhone = orderDetails?.find(d => d.targetPhoneId) || null;
  const targetPhone = detailWithPhone?.targetPhoneId;
  const deviceSerial = targetPhone?.imei || targetPhone?.serialCode || selectedOrder?.serialCode || selectedOrder?.imei || "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="p-6 border-b flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Chi tiết đơn sửa chữa #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dayjs(selectedOrder.repairOrderDate || selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {selectedOrder.status === "Completed" && (
              <>
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md font-bold text-xs hover:bg-blue-700 shadow-sm transition">
                  <Printer size={16} /> IN BILL
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md font-bold text-xs hover:bg-green-700 shadow-sm transition">
                  <Download size={16} /> TẢI PDF
                </button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-red-600 bg-white p-1 rounded-md shadow-sm border ml-2">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> 
                  <span className="font-medium">{selectedOrder.customerName}</span>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> 
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin thiết bị</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Mẫu điện thoại</label>
                  <select 
                    value={selectedModel} 
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setSelectedItems([]);
                    }} 
                    disabled={isReadOnly}
                    className={`w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 ${isReadOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  >
                    <option value="">-- Chọn mẫu điện thoại --</option>
                    {phoneModels.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                {deviceSerial && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500">S/N:</span> 
                    <span className="font-mono text-gray-800">{deviceSerial}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Thông tin cửa hàng</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-400" /> 
                  <span>{selectedOrder.storeId?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Mã cửa hàng:</span> 
                  <span className="font-mono">{selectedOrder.storeId?.code || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              {isReadOnly ? "Dịch vụ sửa chữa đã thực hiện" : "Chọn dịch vụ sửa chữa"} 
              {isWarranty && <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Bảo hành</span>}
            </h4>
            
            {loadingServices ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Đang tải dịch vụ...
              </div>
            ) : repairServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có dịch vụ nào khả dụng</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {repairServices.map((service) => {
                  if (isReadOnly && !selectedServices.includes(service._id)) return null;

                  return (
                    <div
                      key={service._id}
                      onClick={() => handleServiceToggle(service._id)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedServices.includes(service._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      } ${isReadOnly ? 'cursor-default hover:border-blue-500' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedServices.includes(service._id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {selectedServices.includes(service._id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-gray-800">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-blue-600">
                          {isWarranty ? "0 đ" : (service.price ? `${service.price.toLocaleString('vi-VN')} đ` : 'Liên hệ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-gray-700 mb-2">Dịch vụ đã chọn:</h5>
                <p className="text-sm text-gray-600 mb-2">{getSelectedServiceNames()}</p>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-700">Tổng dịch vụ:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {getSelectedServiceTotal().toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            )}
          </div>

          {canSelectParts && (
              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  {isReadOnly ? "Linh kiện đã xuất kho" : "Chọn linh kiện thay thế từ kho"}
                  {isWarranty && <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Bảo hành</span>}
                </h4>
                
                {!isReadOnly && (
                  <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                        <h5 className="font-bold text-blue-800">Danh sách linh kiện tương thích:</h5>
                        {!isWarranty && (
                            <span className="text-xs font-medium text-blue-700 bg-white px-2 py-1 rounded border border-blue-200">
                              {selectedModelLabel} — {formatPartCodesDisplay(selectedPartCodes)}
                            </span>
                        )}
                    </div>
                    
                    <div className="relative mb-3 group">
                        <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            ref={scanInputRef}
                            type="text"
                            placeholder="Quét mã vạch (SN) linh kiện..."
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            onKeyDown={handleScan}
                            disabled={!canSelectParts}
                            className={`w-full pl-12 pr-4 py-3 border-2 border-white rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all uppercase tracking-widest font-mono text-sm shadow-sm ${!canSelectParts ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-white text-gray-800"}`}
                        />
                    </div>
                    
                    {allowedItemsInStock.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {allowedItemsInStock.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleAddItem(item)}
                            className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">{item.name}</span>
                              <span className="text-xs text-gray-500 font-mono mt-0.5">SN: {item.serialCode}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-blue-600">{formatCurrency(item.price)}</span>
                                <button className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-200 transition">
                                    + Thêm
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                        <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm font-medium">Không có linh kiện nào tương thích trong kho.</p>
                            <p className="text-xs text-gray-400 mt-1">Vui lòng nhập thêm kho hoặc kiểm tra lại cấu hình Recipe.</p>
                        </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {selectedPartCodes.map(code => {
                      const label = formatPartCodesDisplay([code]);
                      const selectedItemId = selectedItems.find(id => {
                          const i = items.find(it => String(it._id) === String(id));
                          return getPartCodeForItem(i) === code;
                      });
                      const selectedItemObj = items.find(it => String(it._id) === String(selectedItemId));

                      return (
                          <div key={code} className="mb-4">
                              <h5 className="font-bold text-gray-700 text-xs mb-2 uppercase flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span> Vị trí: {label}
                              </h5>
                              {selectedItemObj ? (
                                  <div className="flex items-center justify-between p-4 bg-white border-2 border-green-300 rounded-xl shadow-sm transition-all hover:shadow-md">
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                              <Package size={20} />
                                          </div>
                                          <div>
                                              <span className="font-bold text-gray-800 block">{selectedItemObj.name}</span>
                                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border mt-1 inline-block">SN: {selectedItemObj.serialCode}</span>
                                          </div>
                                      </div>
                                      <div className="text-right flex items-center gap-4">
                                          <span className="font-black text-green-600 text-lg">
                                              {isWarranty ? "0 đ" : `${(selectedItemObj.price || 0).toLocaleString('vi-VN')} đ`}
                                          </span>
                                          {!isReadOnly && (
                                              <button onClick={() => handleRemoveItem(selectedItemObj._id)} className="text-red-400 hover:text-white hover:bg-red-500 p-2 rounded-full transition-colors border border-transparent hover:border-red-600 shadow-sm" title="Gỡ linh kiện">
                                                  <XCircle size={20} />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-400 text-sm font-medium flex flex-col items-center justify-center gap-2">
                                      Chưa chọn linh kiện {label}
                                  </div>
                              )}
                          </div>
                      )
                  })}
                  {selectedPartCodes.length === 0 && (
                      <div className="text-center py-10 text-gray-400 font-medium italic">Không có linh kiện nào được yêu cầu thay thế cho các dịch vụ đã chọn.</div>
                  )}
                </div>
                
                {selectedItems.length > 0 && (
                    <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-200">
                      <span className="font-bold text-gray-500 uppercase text-xs">Tổng linh kiện ({selectedItems.length}):</span>
                      <span className="text-xl font-black text-green-600">
                        {getSelectedItemTotal().toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                )}
              </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-100 border-t border-gray-300 flex justify-between items-center">
          <div>
            <span className="font-bold text-gray-800 text-lg">Tổng thanh toán:</span>
          </div>
          <span className="text-3xl font-black text-blue-700">
            {isReadOnly ? selectedOrder.totalPrice?.toLocaleString('vi-VN') : getGrandTotal().toLocaleString('vi-VN')} đ
          </span>
        </div>

        {!isReadOnly && (
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center gap-3 rounded-b-xl">
            <div>
              {(selectedOrder.status === "Pending" || selectedOrder.status === "In Progress") && onCancel && (
                <button
                  onClick={() => {
                    if(window.confirm('Xác nhận hủy đơn sửa chữa này? Toàn bộ linh kiện đã chọn sẽ được trả lại kho.')) {
                      onCancel(selectedOrder._id);
                      onClose();
                    }
                  }}
                  className="px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold flex items-center gap-2"
                >
                  <XCircle size={18} /> Hủy đơn
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-bold"
              >
                Đóng
              </button>
              {selectedOrder.status === "Pending" && onAccept && (
                <button
                  onClick={async () => {
                    if (!(await validateBeforeSave())) return;
                    onAccept(selectedOrder._id, selectedServices, selectedItems, getGrandTotal(), selectedModel);
                    onClose();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-black shadow-md flex items-center gap-2"
                >
                  <CheckCircle size={18}/> Xác nhận nhận đơn
                </button>
              )}
              {selectedOrder.status === "In Progress" && onOrderUpdate && (
                <button
                  onClick={async () => {
                    if (!(await validateBeforeSave())) return;
                    onOrderUpdate(selectedOrder._id, selectedServices, selectedItems, getGrandTotal(), selectedModel);
                    onClose();
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-black shadow-md flex items-center gap-2"
                >
                  <Package size={18}/> Lưu & Cập nhật chi tiết
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none -z-50">
          <InvoicePrintA4 contentRef={printRef} order={selectedOrder} details={orderDetails} activeTab="REPAIR" />
        </div>
      </div>
    </div>
  );
};

export default RepairDetailsModal;