import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Package, Smartphone, Truck, QrCode, Camera, X, Scan } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import Swal from 'sweetalert2';

import { fetchTransferRequestDetailApi, fetchInventoryForExportApi, confirmShipmentApi } from "../../api/saleStaff/transferExport";
import { getTransferRequestDetailsApi } from "../../api/manager/transferRequest";

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

    const [oldItemReqs, setOldItemReqs] = useState([]);
    const [oldPhoneReqs, setOldPhoneReqs] = useState([]);
    const [newItemReqs, setNewItemReqs] = useState({});
    const [newPhoneReqs, setNewPhoneReqs] = useState({});

    const [scannedItems, setScannedItems] = useState(() => {
        const saved = localStorage.getItem(`transfer_items_${id}`);
        return saved ? JSON.parse(saved) : [];
    });
    
    const [scannedPhones, setScannedPhones] = useState(() => {
        const saved = localStorage.getItem(`transfer_phones_${id}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [showScanner, setShowScanner] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const scannerRef = useRef(null);

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

        let detailsData = [];
        try {
            detailsData = await getTransferRequestDetailsApi(id);
        } catch (e) {
            console.error("Lỗi khi tải chi tiết phiếu", e);
            toast.error("Không thể tải chi tiết mã Serial yêu cầu!");
        }

        const details = detailsData[0] || {};
        const specificItems = details.itemId || []; 
        const specificPhones = details.phoneId || [];

        let tempOldItems = [];
        let tempNewItemsReqs = {};

        (requestInfo.itemType || []).forEach(req => {
            const typeId = req.itemTypes?._id || req.itemTypes;
            tempNewItemsReqs[typeId] = req.quantity;
        });

     
        specificItems.forEach(item => {
            const sItem = itemsData.find(i => i._id === item._id) || item;
            if (sItem.origin !== 'new') {
                tempOldItems.push(sItem);
                const typeId = sItem.item_type?._id || sItem.item_type;
                if (tempNewItemsReqs[typeId] > 0) {
                    tempNewItemsReqs[typeId] -= 1; 
                }
            }
        });

        let tempOldPhones = [];
        let tempNewPhonesReqs = {};

      
        const phonesToProcess = specificPhones.length > 0 ? specificPhones : (requestInfo.phones || []);
        phonesToProcess.forEach(phone => {
            const sPhone = phonesData.find(p => p._id === phone._id) || phone;
            if (sPhone.grade && sPhone.grade !== 'Mới') {
                tempOldPhones.push(sPhone);
            } else {
                const modelId = sPhone.phoneModelId?._id || sPhone.phoneModelId;
                const variationKey = `${modelId}_${sPhone.colorName}_${sPhone.capacity}`;
                tempNewPhonesReqs[variationKey] = (tempNewPhonesReqs[variationKey] || 0) + 1;
            }
        });

        setOldItemReqs(tempOldItems);
        setOldPhoneReqs(tempOldPhones);
        setNewItemReqs(tempNewItemsReqs);
        setNewPhoneReqs(tempNewPhonesReqs);

        setStoreItems(itemsData);
        setStorePhones(phonesData);
        setLoading(false);
    };

    const processSerialNumber = (serialInput) => {
        if (!serialInput.trim()) return;
        const serial = serialInput.trim().toUpperCase(); 

        if (scannedItems.some(i => i.serialCode.toUpperCase() === serial) || scannedPhones.some(p => p.serialCode.toUpperCase() === serial)) {
            toast.warning("Mã này đã được đưa vào giỏ xuất rồi!");
            return;
        }

        const matchedOldPhone = oldPhoneReqs.find(p => p.serialCode?.toUpperCase() === serial);
        if (matchedOldPhone) {
            setScannedPhones(prev => [...prev, matchedOldPhone]);
            toast.success(`Đã quét Điện thoại cũ: ${matchedOldPhone.phoneModelId?.name}`);
            return;
        }

       
        const matchedOldItem = oldItemReqs.find(i => i.serialCode?.toUpperCase() === serial);
        if (matchedOldItem) {
            setScannedItems(prev => [...prev, matchedOldItem]);
            toast.success(`Đã quét Linh kiện bóc máy: ${matchedOldItem.name || matchedOldItem.item_type?.name}`);
            return;
        }

    
        const foundPhone = storePhones.find(p => p.serialCode?.toUpperCase() === serial && p.status === 'in_stock');
        if (foundPhone) {
            if (foundPhone.grade !== 'Mới') {
                toast.error("Lỗi: Máy này là máy cũ/đã SD nhưng KHÔNG nằm trong danh sách yêu cầu đích danh!");
                return;
            }
            
            const modelId = foundPhone.phoneModelId?._id || foundPhone.phoneModelId;
            const variationKey = `${modelId}_${foundPhone.colorName}_${foundPhone.capacity}`;
            
            const requiredQty = newPhoneReqs[variationKey] || 0;
            if (requiredQty === 0) {
                toast.error("Phiếu này không yêu cầu thêm máy MỚI có cấu hình này!");
                return;
            }

            const currentScannedQty = scannedPhones.filter(p => {
                const mId = p.phoneModelId?._id || p.phoneModelId;
                return `${mId}_${p.colorName}_${p.capacity}` === variationKey && p.grade === 'Mới';
            }).length;

            if (currentScannedQty >= requiredQty) {
                toast.warning("Đã quét đủ số lượng cho dòng máy mới cấu hình này rồi!");
                return;
            }

            setScannedPhones(prev => [...prev, foundPhone]);
            toast.success(`Đã quét: ${foundPhone.phoneModelId?.name}`);
            return;
        }

        
        const foundItem = storeItems.find(i => i.serialCode?.toUpperCase() === serial && i.status === 'in_stock');
        if (foundItem) {
            if (foundItem.origin !== 'new') {
                toast.error("Lỗi: Linh kiện này là đồ bóc máy nhưng KHÔNG nằm trong danh sách yêu cầu đích danh!");
                return;
            }

            const typeId = foundItem.item_type?._id || foundItem.item_type;
            const requiredQty = newItemReqs[typeId] || 0;
            
            if (requiredQty === 0) {
                toast.error("Phiếu này không yêu cầu thêm Linh kiện MỚI loại này!");
                return;
            }

            const currentScannedQty = scannedItems.filter(i => {
                const tId = i.item_type?._id || i.item_type;
                return tId === typeId && i.origin === 'new';
            }).length;

            if (currentScannedQty >= requiredQty) {
                toast.warning("Đã quét đủ số lượng linh kiện mới loại này rồi!");
                return;
            }

            setScannedItems(prev => [...prev, foundItem]);
            toast.success(`Đã quét: ${foundItem.name || foundItem.item_type?.name}`);
            return;
        }

        toast.error(`Sai mã: Serial "${serial}" không tồn tại hoặc không còn trong kho!`);
    };

    const handleScan = (e) => {
        e.preventDefault();
        processSerialNumber(scannedSerial);
        setScannedSerial(""); 
        if (inputRef.current) inputRef.current.focus();
    };

    const startScanner = async () => {
        setShowScanner(true);
        try {
            const devices = await Html5Qrcode.getCameras();
            setCameras(devices);
            if (devices && devices.length) {
                const rearCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('sau'));
                const cameraId = rearCamera ? rearCamera.id : devices[devices.length - 1].id;
                setSelectedCamera(cameraId);
                initializeScanner(cameraId);
            } else {
                toast.error("Không tìm thấy camera trên thiết bị này!");
            }
        } catch (err) {
            toast.error("Lỗi truy cập camera: " + err.message);
        }
    };

    const stopScanner = () => {
        setShowScanner(false);
        if (scannerRef.current) {
            try {
                scannerRef.current.stop().catch(() => {});
            } catch (error) {}
            scannerRef.current = null;
        }
    };

    const initializeScanner = (cameraId) => {
        if (scannerRef.current) {
            try {
                scannerRef.current.stop().catch(() => {});
            } catch (error) {}
        }
        
        const html5QrCode = new Html5Qrcode("sale-qr-reader");
        scannerRef.current = html5QrCode;
        html5QrCode.start(
            cameraId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.333334, 
                videoConstraints: { width: { ideal: 640 }, height: { ideal: 480 } }
            },
            (decodedText) => {
                processSerialNumber(decodedText);
                html5QrCode.pause();
                setTimeout(() => html5QrCode.resume(), 2000);
            },
        ).catch(err => {
            toast.error("Không thể khởi động luồng Camera.");
        });
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(() => {});
                } catch (error) {}
            }
        };
    }, []);

    const removeScanned = (type, idToRemove) => {
        if (type === 'ITEM') setScannedItems(prev => prev.filter(i => i._id !== idToRemove));
        else setScannedPhones(prev => prev.filter(p => p._id !== idToRemove));
        if (inputRef.current) inputRef.current.focus();
    };

    const isReadyToShip = () => {
        if (!requestData) return false;
        
        let newItemsComplete = true;
        Object.entries(newItemReqs).forEach(([typeId, reqQty]) => {
            const scannedQty = scannedItems.filter(i => (i.item_type?._id || i.item_type) === typeId && i.origin === 'new').length;
            if (scannedQty < reqQty) newItemsComplete = false;
        });

        let oldItemsComplete = oldItemReqs.every(item => scannedItems.some(i => i._id === item._id));

        let newPhonesComplete = true;
        Object.entries(newPhoneReqs).forEach(([variationKey, reqQty]) => {
            const scannedQty = scannedPhones.filter(p => {
                const mId = p.phoneModelId?._id || p.phoneModelId;
                return `${mId}_${p.colorName}_${p.capacity}` === variationKey && p.grade === 'Mới';
            }).length;
            if (scannedQty < reqQty) newPhonesComplete = false;
        });

        let oldPhonesComplete = oldPhoneReqs.every(phone => scannedPhones.some(p => p._id === phone._id));

        return newItemsComplete && oldItemsComplete && newPhonesComplete && oldPhonesComplete;
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
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><QrCode size={18}/> Quét mã QR Code</label>
                            <button onClick={startScanner} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-200 transition flex items-center gap-2">
                                <Camera size={16}/> Mở Camera
                            </button>
                        </div>
                        <form onSubmit={handleScan} className="flex gap-2 mb-4">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={scannedSerial}
                                onChange={(e) => setScannedSerial(e.target.value)}
                                placeholder="Hoặc nhập mã vào đây..."
                                className="w-full px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none focus:border-blue-500 font-mono font-bold text-lg"
                            />
                            <button type="submit" className="hidden">Quét</button>
                        </form>

                        <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 mt-2">Tiến độ xuất kho</h3>
                        <div className="space-y-3">
                           
                            {Object.entries(newPhoneReqs).map(([variationKey, reqQty]) => {
                                if (reqQty === 0) return null;
                                const samplePhone = storePhones.find(p => `${p.phoneModelId?._id || p.phoneModelId}_${p.colorName}_${p.capacity}` === variationKey);
                                const name = samplePhone ? `${samplePhone.phoneModelId?.name} (${samplePhone.colorName} - ${samplePhone.capacity})` : 'Điện thoại mới';
                                const scannedQty = scannedPhones.filter(p => `${p.phoneModelId?._id || p.phoneModelId}_${p.colorName}_${p.capacity}` === variationKey && p.grade === 'Mới').length;
                                const isDone = scannedQty >= reqQty;
                                return (
                                    <div key={`new-phone-${variationKey}`} className="flex justify-between items-center text-sm">
                                        <span className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{name} <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded ml-1">Mới</span></span>
                                        <span className={`font-bold ${isDone ? 'text-emerald-500' : 'text-blue-600'}`}>{scannedQty} / {reqQty}</span>
                                    </div>
                                )
                            })}

                          
                            {oldPhoneReqs.map(phone => {
                                const isDone = scannedPhones.some(p => p._id === phone._id);
                                return (
                                    <div key={`old-phone-${phone._id}`} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-gray-100">
                                        <div className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {phone.phoneModelId?.name} ({phone.colorName} - {phone.capacity}) <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded ml-1">Cũ</span>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">SN: {phone.serialCode}</div>
                                        </div>
                                        <span className={`font-bold ${isDone ? 'text-emerald-500' : 'text-orange-600'}`}>{isDone ? '1 / 1' : '0 / 1'}</span>
                                    </div>
                                )
                            })}

                       
                            {Object.entries(newItemReqs).map(([typeId, reqQty]) => {
                                if (reqQty === 0) return null;
                                const typeName = requestData.itemType?.find(i => (i.itemTypes?._id || i.itemTypes) === typeId)?.itemTypes?.name || 'Linh kiện mới';
                                const scannedQty = scannedItems.filter(i => (i.item_type?._id || i.item_type) === typeId && i.origin === 'new').length;
                                const isDone = scannedQty >= reqQty;
                                return (
                                    <div key={`new-item-${typeId}`} className="flex justify-between items-center text-sm">
                                        <span className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{typeName} <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded ml-1">Mới</span></span>
                                        <span className={`font-bold ${isDone ? 'text-emerald-500' : 'text-blue-600'}`}>{scannedQty} / {reqQty}</span>
                                    </div>
                                )
                            })}
                            
                          
                            {oldItemReqs.map(item => {
                                const isDone = scannedItems.some(i => i._id === item._id);
                                return (
                                    <div key={`old-item-${item._id}`} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-gray-100">
                                        <div className={`font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {item.name || item.item_type?.name} <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded ml-1">Cũ</span>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">SN: {item.serialCode}</div>
                                        </div>
                                        <span className={`font-bold ${isDone ? 'text-emerald-500' : 'text-orange-600'}`}>{isDone ? '1 / 1' : '0 / 1'}</span>
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
                                                <td className="px-4 py-3 font-bold text-gray-800">
                                                    {phone.phoneModelId?.name || "Điện thoại"} 
                                                    <span className="text-xs text-gray-500 font-normal ml-1">({phone.colorName} - {phone.capacity})</span>
                                                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${phone.grade === 'Mới' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {phone.grade === 'Mới' ? 'Mới' : 'Cũ'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-gray-600 font-bold">{phone.serialCode}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => removeScanned('PHONE', phone._id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded transition font-bold text-lg">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {scannedItems.map(item => (
                                            <tr key={item._id} className="bg-emerald-50/20">
                                                <td className="px-4 py-3 text-center text-emerald-600"><Package size={18} className="mx-auto"/></td>
                                                <td className="px-4 py-3 font-bold text-gray-800">
                                                    {item.name || item.item_type?.name}
                                                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${item.origin === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.origin === 'new' ? 'Mới' : 'Cũ'}
                                                    </span>
                                                </td>
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

           
            {showScanner && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><Scan size={18}/> Quét mã QR Sản phẩm</h3>
                            <button onClick={stopScanner} className="p-1 hover:bg-white/20 rounded-full transition"><X size={20}/></button>
                        </div>
                        <div className="p-4 bg-gray-100 flex flex-col items-center">
                            {cameras.length > 1 && (
                                <select 
                                    value={selectedCamera} 
                                    onChange={(e) => { setSelectedCamera(e.target.value); initializeScanner(e.target.value); }}
                                    className="mb-4 w-full p-2 rounded border outline-none text-sm font-medium"
                                >
                                    {cameras.map((c, i) => <option key={c.id} value={c.id}>{c.label || `Camera ${i + 1}`}</option>)}
                                </select>
                            )}
                            <div id="sale-qr-reader" className="w-full max-w-[300px] border-4 border-dashed border-indigo-300 rounded-xl overflow-hidden bg-black min-h-[225px]"></div>
                            <p className="mt-4 text-sm text-gray-500 text-center font-medium">Đưa mã QR/Barcode vào khung hình. Trình duyệt sẽ tự nhận diện.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}