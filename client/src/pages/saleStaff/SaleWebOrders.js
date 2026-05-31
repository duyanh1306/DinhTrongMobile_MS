import React, { useState, useEffect, useRef } from "react";
import { ScanLine, CheckCircle, Clock, Truck, Search, X, Globe, CornerDownRight, AlertCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "../../utils/formatCurrency";
import { fetchWebOrdersApi, fulfillOrderApi } from "../../api/saleStaff/webOrder"

export default function SaleWebOrders() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanInput, setScanInput] = useState("");
    const [scannedSerials, setScannedSerials] = useState([]);
    const scanInputRef = useRef(null);

    useEffect(() => {
        loadWebOrders();
    }, []);

    useEffect(() => {
        if (selectedOrder && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [selectedOrder]);

    const loadWebOrders = async () => {
        setLoading(true);
        const data = await fetchWebOrdersApi(); 
        setOrders(data.filter(o => ['Pending', 'Processing'].includes(o.orderStatus)));
        setLoading(false);
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        const savedDrafts = JSON.parse(localStorage.getItem('scannedOrdersDraft') || '{}');
        const existingScansForThisOrder = savedDrafts[order._id] || [];
        setScannedSerials(existingScansForThisOrder);
        
        setScanInput("");
    };

    const getRequiredItems = (order) => {
        if (!order) return [];
        let reqItems = [];
        order.items?.forEach(item => {
            if (item.productType === 'PHONE' && item.phoneId?.serialCode) {
                reqItems.push({ serial: item.phoneId.serialCode.toUpperCase(), name: item.name });
            } else if (item.productType === 'CUSTOM_BUILD' && item.selectedParts) {
                item.selectedParts.forEach(part => {
                    if (part.serialCode) {
                        reqItems.push({ serial: part.serialCode.toUpperCase(), name: part.name, parent: item.name });
                    }
                });
            }
        });
        return reqItems;
    };

    const handleScan = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const code = scanInput.trim().toUpperCase();
            if (!code) return;

            const requiredItems = getRequiredItems(selectedOrder);
            const matchedItem = requiredItems.find(item => item.serial === code);

            if (!matchedItem) {
                toast.error(` MÃ SAI: ${code} không thuộc đơn hàng này!`);
            } else if (scannedSerials.includes(code)) {
                toast.warning(` Mã ${code} đã được quét rồi!`);
            } else {
                const newScannedSerials = [...scannedSerials, code];
                setScannedSerials(newScannedSerials);
                
                const savedDrafts = JSON.parse(localStorage.getItem('scannedOrdersDraft') || '{}');
                savedDrafts[selectedOrder._id] = newScannedSerials;
                localStorage.setItem('scannedOrdersDraft', JSON.stringify(savedDrafts));

                toast.success(` Đã nhận: ${matchedItem.name}`);
            }
            setScanInput("");
        }
    };

    const handleFulfillOrder = async () => {
        const success = await fulfillOrderApi(selectedOrder._id, scannedSerials);
    
        if (success) {
            const savedDrafts = JSON.parse(localStorage.getItem('scannedOrdersDraft') || '{}');
            delete savedDrafts[selectedOrder._id];
            localStorage.setItem('scannedOrdersDraft', JSON.stringify(savedDrafts));
    
            setSelectedOrder(null);
            setScannedSerials([]);
            loadWebOrders(); 
        }
    };

    const requiredList = getRequiredItems(selectedOrder);
    const isReadyToShip = requiredList.length > 0 && scannedSerials.length === requiredList.length;

    return (
        <div className="flex h-full gap-6 p-2">
            <ToastContainer autoClose={2000} />
       
            <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Globe size={18} className="text-blue-600"/> Đơn Web Chờ Xử Lý
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                        {orders.length} đơn
                    </span>
                </div>
                
                <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Tìm mã đơn, SĐT..." className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-200"/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <p className="text-center text-sm text-gray-500 mt-10">Đang tải...</p>
                    ) : orders.length === 0 ? (
                        <div className="text-center mt-10 text-gray-400">
                            <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Không có đơn hàng nào cần xử lý</p>
                        </div>
                    ) : (
                        orders.map(order => {
                            const savedDrafts = JSON.parse(localStorage.getItem('scannedOrdersDraft') || '{}');
                            const scannedCount = savedDrafts[order._id] ? savedDrafts[order._id].length : 0;
                            const totalRequired = getRequiredItems(order).length;

                            return (
                                <div 
                                    key={order._id} 
                                    onClick={() => handleSelectOrder(order)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder?._id === order._id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-gray-800">#{order.orderCode || order._id.substring(order._id.length-6).toUpperCase()}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {order.paymentStatus === 'Paid' ? 'Đã Thanh Toán' : 'COD'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2">
                                        <span className="font-medium text-gray-800">{order.shippingInfo?.fullName || 'Khách hàng'}</span> - {order.shippingInfo?.phone}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                                        <span className="text-[11px] text-gray-500 flex items-center gap-1"><Clock size={12}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                        
                                        {scannedCount > 0 && scannedCount < totalRequired && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                                Đang quét ({scannedCount}/{totalRequired})
                                            </span>
                                        )}
                                        {scannedCount > 0 && scannedCount === totalRequired && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                                                Sẵn sàng xuất
                                            </span>
                                        )}
                                        
                                        <span className="font-bold text-blue-600 text-sm">{formatCurrency(order.totalAmount)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

   
            <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                {!selectedOrder ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Globe size={64} className="mb-4 opacity-20" />
                        <p>Chọn một đơn hàng bên trái để bắt đầu xử lý</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-800 text-lg">
                                Đơn hàng #{selectedOrder.orderCode || selectedOrder._id.substring(selectedOrder._id.length-6).toUpperCase()}
                            </h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2"><ScanLine size={16} className="text-blue-600"/> Quét Serial đóng gói</h3>
                                    <div className="text-sm font-bold">
                                        Tiến độ: <span className="text-green-600">{scannedSerials.length} / {requiredList.length}</span>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <input 
                                        ref={scanInputRef}
                                        type="text" 
                                        placeholder="Tít mã vạch / Nhập Serial Code vào đây..." 
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        onKeyDown={handleScan}
                                        className="w-full pl-4 pr-12 py-4 bg-white border-2 border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-lg font-mono tracking-wider transition-all uppercase shadow-sm"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold">Enter</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase flex items-center gap-2"><Globe size={16} className="text-blue-600"/> Đối chiếu sản phẩm</h3>
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="p-3">Tên Hàng Hóa / Linh Kiện</th>
                                                <th className="p-3 text-center w-16">SL</th>
                                                <th className="p-3 text-right">Trạng Thái Quét (Mã Yêu Cầu)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    {item.productType === 'PHONE' && (
                                                        <tr className="border-t hover:bg-gray-50">
                                                            <td className="p-3 font-medium text-gray-800">
                                                                {item.name} 
                                                                <div className="text-[11px] text-gray-500 font-normal mt-0.5">{item.capacity && item.colorName ? `${item.capacity} - ${item.colorName}` : ''}</div>
                                                            </td>
                                                            <td className="p-3 text-center font-bold">1</td>
                                                            <td className="p-3 text-right">
                                                            {item.phoneId?.serialCode ? (
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-[12px] border ${scannedSerials.includes(item.phoneId.serialCode.toUpperCase()) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                                    {scannedSerials.includes(item.phoneId.serialCode.toUpperCase()) ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                                                                    {item.phoneId.serialCode}
                                                                </span>
                                                            ) : (
                                                                <span className="text-red-500 italic text-xs">Lỗi: Chưa gán mã</span>
                                                            )}
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {item.productType === 'CUSTOM_BUILD' && (
                                                        <>
                                                            <tr className="border-t bg-gray-50/80">
                                                                <td className="p-3 font-bold text-blue-800" colSpan={3}>
                                                                    🔧 {item.name} <span className="text-xs font-normal text-gray-500 ml-2">(Máy tự ráp)</span>
                                                                </td>
                                                            </tr>
                                                            {item.selectedParts?.map((part, pIdx) => (
                                                                <tr key={`part-${pIdx}`} className="border-t border-dashed border-gray-200 bg-white hover:bg-gray-50">
                                                                    <td className="p-3 pl-8 text-[13px] text-gray-700 flex items-center gap-2">
                                                                        <CornerDownRight size={14} className="text-gray-400"/> {part.name}
                                                                    </td>
                                                                    <td className="p-3 text-center text-gray-500 text-[13px]">1</td>
                                                                    <td className="p-3 text-right">
                                                                        {part.serialCode ? (
                                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-[12px] border ${scannedSerials.includes(part.serialCode.toUpperCase()) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                                                {scannedSerials.includes(part.serialCode.toUpperCase()) ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                                                                                {part.serialCode}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-red-500 italic text-xs">Lỗi: Lắp ráp thiếu linh kiện</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
            
                        <div className="p-4 border-t bg-white">
                            <button 
                                onClick={handleFulfillOrder}
                                disabled={!isReadyToShip}
                                className={`w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all ${isReadyToShip ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:-translate-y-0.5' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                {isReadyToShip ? (
                                    <><Truck size={20}/> ĐÃ QUÉT ĐỦ - XÁC NHẬN XUẤT KHO & GIAO HÀNG</>
                                ) : (
                                    <><ScanLine size={20}/> VUI LÒNG QUÉT ĐỦ MÃ SERIAL ĐỂ XUẤT KHO ({scannedSerials.length}/{requiredList.length})</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}