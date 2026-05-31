import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Package, Smartphone, Truck, Barcode } from "lucide-react";
import Swal from 'sweetalert2';
import { fetchTransferRequestDetailApi, fetchInventoryForExportApi, confirmShipmentApi } from "../../api/saleStaff/transferExport";

export default function SaleTransferExportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [scannedSerial, setScannedSerial] = useState("");
    const inputRef = useRef(null);

    const [storeItems, setStoreItems] = useState([]);
    const [storePhones, setStorePhones] = useState([]);

    const [scannedItems, setScannedItems] = useState(() => {
        const saved = localStorage.getItem(`transfer_items_${id}`);
        return saved ? JSON.parse(saved) : [];
    });
    
    const [scannedPhones, setScannedPhones] = useState(() => {
        const saved = localStorage.getItem(`transfer_phones_${id}`);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(`transfer_items_${id}`, JSON.stringify(scannedItems));
    }, [scannedItems, id]);

    useEffect(() => {
        localStorage.setItem(`transfer_phones_${id}`, JSON.stringify(scannedPhones));
    }, [scannedPhones, id]);

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!loading && inputRef.current) inputRef.current.focus();
    }, [loading]);

    const fetchData = async () => {
        setLoading(true);
        const requestInfo = await fetchTransferRequestDetailApi(id);
        if (!requestInfo) {
            navigate("/sale/transfer-export");
            return;
        }
        setRequestData(requestInfo);

        const storeId = requestInfo.fromStoreId?._id || requestInfo.fromStoreId;
        const { itemsData, phonesData } = await fetchInventoryForExportApi(storeId);

        setStoreItems(itemsData);
        setStorePhones(phonesData);
        setLoading(false);
    };

    const handleScan = (e) => {
        e.preventDefault();
        if (!scannedSerial.trim()) return;

        const serial = scannedSerial.trim().toUpperCase(); 
        setScannedSerial(""); 
        
        if (inputRef.current) inputRef.current.focus();

        if (scannedItems.some(i => i.serialCode.toUpperCase() === serial) || scannedPhones.some(p => p.serialCode.toUpperCase() === serial)) {
            toast.warning("Mã này đã được đưa vào giỏ xuất rồi!");
            return;
        }

       const foundPhone = storePhones.find(p => p.serialCode.toUpperCase() === serial && p.status === 'in_stock');
        if (foundPhone) {
            const modelId = foundPhone.phoneModelId?._id || foundPhone.phoneModelId;
            const color = foundPhone.colorName;
            const capacity = foundPhone.capacity;
            const variationKey = `${modelId}_${color}_${capacity}`;

            const phoneRequiredMap = {};
            (requestData.phones || []).forEach(phone => {
                const key = `${phone.phoneModelId?._id || phone.phoneModelId}_${phone.colorName}_${phone.capacity}`;
                phoneRequiredMap[key] = (phoneRequiredMap[key] || 0) + 1;
            });

            const requiredQty = phoneRequiredMap[variationKey] || 0;
            
            if (requiredQty === 0) {
                toast.error("Phiếu này không yêu cầu máy có cấu hình (Màu sắc/Dung lượng) này!");
                return;
            }

            const currentScannedQty = scannedPhones.filter(p => 
                `${p.phoneModelId?._id || p.phoneModelId}_${p.colorName}_${p.capacity}` === variationKey
            ).length;

            if (currentScannedQty >= requiredQty) {
                toast.warning("Đã quét đủ số lượng cho dòng máy cấu hình này rồi!");
                return;
            }

            setScannedPhones(prev => [...prev, foundPhone]);
            toast.success(`Đã thêm: ${foundPhone.phoneModelId?.name}`);
            return;
        }

        const foundItem = storeItems.find(i => i.serialCode.toUpperCase() === serial && i.status === 'in_stock');
        if (foundItem) {
            if (foundItem.origin !== 'new') {
                toast.error("Lỗi: Chỉ được xuất linh kiện MỚI 100%. Hàng cũ/bóc máy không được phép!");
                return;
            }

            const typeId = foundItem.item_type?._id || foundItem.item_type;
            const requiredItem = requestData.itemType?.find(i => (i.itemTypes?._id || i.itemTypes) === typeId);
            
            if (!requiredItem) {
                toast.error("Phiếu này không yêu cầu Loại linh kiện này!");
                return;
            }

            const currentScannedQty = scannedItems.filter(i => (i.item_type?._id || i.item_type) === typeId).length;
            if (currentScannedQty >= requiredItem.quantity) {
                toast.warning("Đã quét đủ số lượng linh kiện này rồi!");
                return;
            }

            setScannedItems(prev => [...prev, foundItem]);
            toast.success(`Đã thêm: ${foundItem.name || foundItem.item_type?.name}`);
            return;
        }

        toast.error(`Sai mã: Serial "${serial}" không tồn tại hoặc không còn trong kho!`);
    };

    const removeScanned = (type, idToRemove) => {
        if (type === 'ITEM') setScannedItems(prev => prev.filter(i => i._id !== idToRemove));
        else setScannedPhones(prev => prev.filter(p => p._id !== idToRemove));
        if (inputRef.current) inputRef.current.focus();
    };

    const isReadyToShip = () => {
        if (!requestData) return false;
        
        let isItemsComplete = true;
        (requestData.itemType || []).forEach(req => {
            const typeId = req.itemTypes?._id || req.itemTypes;
            const scannedCount = scannedItems.filter(i => (i.item_type?._id || i.item_type) === typeId).length;
            if (scannedCount < req.quantity) isItemsComplete = false;
        });


        let isPhonesComplete = true;
        
        const phoneRequiredMap = {};
        (requestData.phones || []).forEach(phone => {
            const variationKey = `${phone.phoneModelId?._id || phone.phoneModelId}_${phone.colorName}_${phone.capacity}`;
            phoneRequiredMap[variationKey] = (phoneRequiredMap[variationKey] || 0) + 1;
        });

        const phoneScannedMap = {};
        scannedPhones.forEach(phone => {
            const variationKey = `${phone.phoneModelId?._id || phone.phoneModelId}_${phone.colorName}_${phone.capacity}`;
            phoneScannedMap[variationKey] = (phoneScannedMap[variationKey] || 0) + 1;
        });

        Object.keys(phoneRequiredMap).forEach(key => {
             if ((phoneScannedMap[key] || 0) < phoneRequiredMap[key]) {
                 isPhonesComplete = false;
             }
        });

        return isItemsComplete && isPhonesComplete;
    };

    const handleConfirmShipment = async () => {
        if (!isReadyToShip()) {
            toast.error("Phải quét đủ 100% hàng hóa mới được xuất kho!");
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'Chốt phiếu xuất kho?',
            text: "Bạn có chắc chắn muốn xuất kho các sản phẩm này? Hành động này không thể hoàn tác.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận Xuất kho',
            cancelButtonText: 'Kiểm tra lại',
            customClass: {
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                popup: 'rounded-2xl' 
            },
            buttonsStyling: false 
        });

       
        if (!confirmResult.isConfirmed) return; 

        setSubmitting(true);
        const payload = {
            items: scannedItems.map(i => ({ id: i._id })),
            phones: scannedPhones.map(p => ({ id: p._id })),
            note: "Đã xuất kho"
        };

        const result = await confirmShipmentApi(id, payload);
        
        if (result) {
            localStorage.removeItem(`transfer_items_${id}`);
            localStorage.removeItem(`transfer_phones_${id}`);
            toast.success("Đã chốt phiếu và chuyển cho Đơn vị vận chuyển.");
            navigate("/sale/transfer-export");
        } else {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="py-20 text-center flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>;
    if (!requestData) return <div className="text-center text-red-500 p-10 font-bold">Không tìm thấy dữ liệu phiếu!</div>;

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* 🌟 GẮN TOAST CONTAINER VÀO GIAO DIỆN */}
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="flex items-center gap-4">
                <button onClick={() => navigate("/sale/transfer-export")} className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quét / Nhập Mã Xuất Kho</h1>
                    <p className="text-sm text-gray-600">Mã phiếu: <strong className="uppercase">{requestData._id}</strong> | Xuất đến: <strong className="text-blue-600">{requestData.toStoreId?.name}</strong></p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/3 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Barcode size={18}/> Nhập hoặc quét mã Serial Code</label>
                        <form onSubmit={handleScan} className="flex gap-2 mb-4">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={scannedSerial}
                                onChange={(e) => setScannedSerial(e.target.value)}
                                placeholder="Nhập mã vào đây..."
                                className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none focus:border-blue-500 font-mono font-bold text-lg"
                            />
                            <button type="submit" className="hidden">Quét</button>
                        </form>

                        <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 mt-2">Tiến độ xuất kho</h3>
                        <div className="space-y-3">
                            {(requestData.itemType || []).map((req, idx) => {
                                const typeId = req.itemTypes?._id || req.itemTypes;
                                const scannedQty = scannedItems.filter(i => (i.item_type?._id || i.item_type) === typeId).length;
                                const isDone = scannedQty >= req.quantity;
                                return (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{req.itemTypes?.name || 'Linh kiện'}</span>
                                        <span className={`font-bold ${isDone ? 'text-emerald-500' : 'text-blue-600'}`}>{scannedQty} / {req.quantity}</span>
                                    </div>
                                )
                            })}
                            
                          {Object.entries((requestData.phones || []).reduce((acc, phone) => {
                                const modelId = phone.phoneModelId?._id || phone.phoneModelId;
                                const modelName = phone.phoneModelId?.name || "Máy điện thoại";
                                const variationKey = `${modelId}_${phone.colorName}_${phone.capacity}`;
                                
                                if (!acc[variationKey]) {
                                    acc[variationKey] = {
                                        name: `${modelName} (${phone.colorName} - ${phone.capacity})`,
                                        required: 0
                                    };
                                }
                                acc[variationKey].required += 1;
                                return acc;
                            }, {})).map(([variationKey, data], idx) => {
                                const scannedQty = scannedPhones.filter(p => 
                                    `${p.phoneModelId?._id || p.phoneModelId}_${p.colorName}_${p.capacity}` === variationKey
                                ).length;
                                
                                const isDone = scannedQty >= data.required;
                                
                                return (
                                    <div key={`p${idx}`} className="flex justify-between items-center text-sm">
                                        <span className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{data.name}</span>
                                        <span className={`font-bold ${isDone ? 'text-emerald-500' : 'text-blue-600'}`}>{scannedQty} / {data.required}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-8">
                            <button 
                                onClick={handleConfirmShipment}
                                disabled={!isReadyToShip() || submitting}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg shadow-md ${isReadyToShip() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                {submitting ? "Đang xử lý..." : <><Truck size={24}/> XÁC NHẬN XUẤT KHO</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 p-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2"><CheckCircle size={20} className="text-emerald-500"/> Danh sách đã xác nhận ({scannedItems.length + scannedPhones.length} món)</h2>
                        </div>
                        
                        <div className="p-0">
                            {scannedItems.length === 0 && scannedPhones.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-medium">Bạn chưa quét mã vạch nào!</div>
                            ) : (
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-center w-16">Loại</th>
                                            <th className="px-4 py-3 font-semibold">Tên Sản Phẩm</th>
                                            <th className="px-4 py-3 font-semibold">Serial Code</th>
                                            <th className="px-4 py-3 font-semibold text-center w-20">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {scannedPhones.map(phone => (
                                            <tr key={phone._id} className="bg-blue-50/20">
                                                <td className="px-4 py-3 text-center text-blue-600"><Smartphone size={18} className="mx-auto"/></td>
                                                <td className="px-4 py-3 font-bold text-gray-800">{phone.phoneModelId?.name || "Điện thoại"} <span className="text-xs text-gray-500 font-normal ml-1">({phone.colorName} - {phone.capacity})</span></td>
                                                <td className="px-4 py-3 font-mono text-gray-600 font-bold">{phone.serialCode}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => removeScanned('PHONE', phone._id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded transition font-bold text-lg">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {scannedItems.map(item => (
                                            <tr key={item._id} className="bg-emerald-50/20">
                                                <td className="px-4 py-3 text-center text-emerald-600"><Package size={18} className="mx-auto"/></td>
                                                <td className="px-4 py-3 font-bold text-gray-800">{item.name || item.item_type?.name}</td>
                                                <td className="px-4 py-3 font-mono text-gray-600 font-bold">{item.serialCode}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => removeScanned('ITEM', item._id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded transition font-bold text-lg">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}