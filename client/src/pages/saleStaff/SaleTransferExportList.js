import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Truck, ArrowRight, Search, Clock, CheckSquare } from "lucide-react";

// 🌟 IMPORT API
import { fetchStoresApi, fetchTransferRequestsApi } from "../../api/saleStaff/transferExport";

export default function SaleTransferExportList() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        fetchApprovedRequests();
    }, []);

    const fetchApprovedRequests = async () => {
        setLoading(true);
        try {
            // 1. Lấy thông tin cửa hàng của Sale hiện tại
            const storesArray = await fetchStoresApi();
            const userStore = storesArray.find(store => store.staff && store.staff.includes(user._id || user.id));

            if (!userStore) {
                toast.error("Không tìm thấy thông tin cửa hàng của bạn!");
                setLoading(false);
                return;
            }

            // 2. Lấy danh sách yêu cầu luân chuyển
            const allReqs = await fetchTransferRequestsApi();

            // 3. Lọc: Chỉ lấy phiếu có nguồn là cửa hàng này & Trạng thái APPROVED
            const approvedReqs = allReqs.filter(r => 
                r.fromStoreId?._id === userStore._id && 
                r.status === "APPROVED"
            );

            setRequests(approvedReqs);
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(r => 
        r._id.toLowerCase().includes(search.toLowerCase()) || 
        r.toStoreId?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl"><Truck className="text-blue-600" size={28} /></div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Lệnh Xuất Kho Luân Chuyển</h1>
                    <p className="text-gray-500 text-sm">Các phiếu đã được duyệt chờ bạn quét mã đóng gói xuất đi</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm theo Mã phiếu hoặc Tên cửa hàng nhận..." 
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>
            ) : filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <CheckSquare size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">Tuyệt vời! Hiện không có lệnh xuất kho nào chờ xử lý.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredRequests.map(req => {
                        const totalItems = (req.itemType || []).reduce((sum, i) => sum + i.quantity, 0);
                        const totalPhones = (req.phones || []).length;
                        
                        return (
                            <div key={req._id} className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">Xuất đến: {req.toStoreId?.name}</h3>
                                        <p className="text-sm font-mono text-gray-500 mt-1">Mã phiếu: {req._id.substring(req._id.length - 8).toUpperCase()}</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                        <Clock size={14}/> Chờ xuất
                                    </span>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 flex gap-4 text-sm font-medium text-gray-700">
                                    <div>Linh kiện: <span className="text-blue-600 text-lg">{totalItems}</span></div>
                                    <div>Điện thoại: <span className="text-blue-600 text-lg">{totalPhones}</span></div>
                                </div>

                                <button onClick={() => navigate(`/sale/transfer-export/${req._id}`)} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                    Tiến Hành Quét Mã Xuất Kho <ArrowRight size={18}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}