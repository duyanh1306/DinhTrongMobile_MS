import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, Package, Store, Truck, User, X } from "lucide-react";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';

import { 
    fetchStoresApi, 
    getTransferRequestByIdApi, 
    getTransferRequestDetailsApi, 
    approveTransferRequestApi,
    rejectTransferRequestApi,
    confirmReceiptApi 
} from "../../api/manager/transferRequest";

const getItemTypeId = (itemTypeEntry) => {
    if (!itemTypeEntry) return "";
    if (typeof itemTypeEntry === "string") return itemTypeEntry;
    if (itemTypeEntry._id) return itemTypeEntry._id;
    if (itemTypeEntry.itemTypes) return getItemTypeId(itemTypeEntry.itemTypes);
    return "";
};

const getItemTypeName = (itemTypeEntry) => {
    if (!itemTypeEntry) return "Unknown";
    if (typeof itemTypeEntry === "string") return itemTypeEntry;
    if (itemTypeEntry.name) return itemTypeEntry.name;
    if (itemTypeEntry.itemTypes) return getItemTypeName(itemTypeEntry.itemTypes);
    return "Unknown";
};

const normalizeDetailItems = (detailsData = []) =>
    detailsData.flatMap((detail) => {
        const rawItems = Array.isArray(detail?.itemId) ? detail.itemId : detail?.itemId ? [detail.itemId] : [];
        const rawPhones = Array.isArray(detail?.phoneId) ? detail.phoneId : detail?.phoneId ? [detail.phoneId] : [];

        const parsedItems = rawItems.filter(Boolean).map((item) => ({
            id: item._id,
            name: item.name || item.serialCode || "Unknown item",
            serialCode: item.serialCode || "N/A",
            itemTypeId: getItemTypeId(item.item_type),
            itemTypeName: getItemTypeName(item.item_type),
            origin: item.origin || 'new',
            isPhone: false
        }));

        const parsedPhones = rawPhones.filter(Boolean).map((phone) => {
            const modelName = phone.phoneModelId?.name || "Máy điện thoại";
            return {
                id: phone._id,
                name: `${modelName} (${phone.colorName} - ${phone.capacity})`,
                serialCode: phone.serialCode || "N/A",
                itemTypeId: `${phone.phoneModelId?._id || phone.phoneModelId}_${phone.colorName}_${phone.capacity}`,
                itemTypeName: "Điện thoại",
                grade: phone.grade || 'Mới',
                isPhone: true
            };
        });

        return [...parsedItems, ...parsedPhones];
    });

const buildRequestedItems = (requestData, transferredItems = []) => {
    const transferredCountByType = transferredItems.reduce((acc, item) => {
        if (!item.itemTypeId) return acc;
        acc[item.itemTypeId] = (acc[item.itemTypeId] || 0) + 1;
        return acc;
    }, {});

    const itemRequests = (requestData?.itemType || []).map((itemTypeEntry) => {
        const itemTypeId = getItemTypeId(itemTypeEntry?.itemTypes || itemTypeEntry);
        const itemsForType = transferredItems.filter((item) => item.itemTypeId === itemTypeId);
        const requiredQuantity = itemTypeEntry?.quantity || 0;
        const scannedQuantity = transferredCountByType[itemTypeId] || 0;

        return {
            id: itemTypeId,
            itemTypeId,
            name: getItemTypeName(itemTypeEntry?.itemTypes || itemTypeEntry),
            requiredQuantity,
            scannedQuantity,
            isValid: scannedQuantity >= requiredQuantity,
            transferredItems: itemsForType,
            type: 'ITEM'
        };
    });

    const phoneRequests = [];
    const phonesList = requestData?.phones || [];
    
    const phoneGroups = {};
    phonesList.forEach(phone => {
         const modelId = phone.phoneModelId?._id || phone.phoneModelId;
         const modelName = phone.phoneModelId?.name || "Máy chưa rõ tên";
         const variationKey = `${modelId}_${phone.colorName}_${phone.capacity}`;
         
         if (!phoneGroups[variationKey]) {
             phoneGroups[variationKey] = {
                 id: variationKey,
                 variationKey,
                 name: `${modelName} (${phone.colorName} - ${phone.capacity})`,
                 requiredQuantity: 0,
                 type: 'PHONE',
                 targetPhoneIds: []
             };
         }
         phoneGroups[variationKey].requiredQuantity += 1;
         phoneGroups[variationKey].targetPhoneIds.push(phone._id);
    });

   Object.values(phoneGroups).forEach(group => {
         const scannedPhones = transferredItems.filter(item => item.itemTypeId === group.variationKey);
         
         phoneRequests.push({
             id: group.id,
             variationKey: group.variationKey,
             name: group.name,
             requiredQuantity: group.requiredQuantity,
             scannedQuantity: scannedPhones.length,
             isValid: scannedPhones.length >= group.requiredQuantity,
             transferredItems: scannedPhones,
             type: 'PHONE',
             targetPhoneIds: group.targetPhoneIds
         });
    });

    return [...phoneRequests, ...itemRequests];
};

export default function ManagerTransferRequestDetail() {
    const navigate = useNavigate();
    const {id} = useParams();
    const [user, setUser] = useState({});
    const [transferRequest, setTransferRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userStoreId, setUserStoreId] = useState("");
    const [requestedItems, setRequestedItems] = useState([]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        fetchUserStore(userData._id || userData.id);
        fetchTransferRequestDetails();
    }, [id]);

    const fetchUserStore = async (userId) => {
        try {
            const storesArray = await fetchStoresApi();
            const userStore = storesArray.find((store) => store.staff && store.staff.includes(userId));
            if (userStore) {
                setUserStoreId(userStore._id);
            }
        } catch (error) {
            console.error("Error fetching user store:", error);
        }
    };

    const fetchTransferRequestDetails = async () => {
        setLoading(true);
        try {
            const [requestData, detailsData] = await Promise.all([
                getTransferRequestByIdApi(id),
                getTransferRequestDetailsApi(id)
            ]);

            setTransferRequest(requestData);
            
            const normalizedTransferredItems = normalizeDetailItems(detailsData);
            setRequestedItems(buildRequestedItems(requestData, normalizedTransferredItems));
        } catch (error) {
            toast.error("Lỗi khi tải thông tin: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Duyệt yêu cầu này?',
            text: "Xác nhận đồng ý xuất kho cấp hàng cho yêu cầu này?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý duyệt',
            cancelButtonText: 'Hủy bỏ',
            customClass: {
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                popup: 'rounded-2xl'
            },
            buttonsStyling: false
        });
    
        if (!result.isConfirmed) return;
        setSubmitting(true);
        try {
          await approveTransferRequestApi(id, user._id || user.id);
          toast.success("Đã duyệt yêu cầu chuyển kho");
          navigate("/manager/transfer_approvals");
        } catch (error) {
          toast.error(error.response?.data?.message || "Không thể duyệt yêu cầu");
          setSubmitting(false);
        }
    };
    
    const handleReject = async () => {
        const result = await Swal.fire({
            title: 'Từ chối yêu cầu?',
            text: "Bạn có chắc chắn muốn từ chối yêu cầu luân chuyển này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận Từ chối',
            cancelButtonText: 'Hủy bỏ',
            customClass: {
                confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                popup: 'rounded-2xl'
            },
            buttonsStyling: false
        });
    
        if (!result.isConfirmed) return;
        setSubmitting(true);
        try {
          await rejectTransferRequestApi(id, user._id || user.id);
          toast.success("Đã từ chối yêu cầu chuyển kho");
          navigate("/manager/transfer_approvals");
        } catch (error) {
          toast.error(error.response?.data?.message || "Không thể từ chối yêu cầu");
          setSubmitting(false);
        }
    };
    
    const handleConfirmReceipt = async () => {
        const result = await Swal.fire({
            title: 'Xác nhận nhận hàng?',
            text: "Sản phẩm sẽ được tự động cập nhật vào kho của bạn. Hành động này không thể hoàn tác!",
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Vâng, tôi đã nhận đủ!',
            cancelButtonText: 'Hủy bỏ',
            customClass: {
                confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg mx-2 transition-all',
                popup: 'rounded-2xl'
            },
            buttonsStyling: false
        });
    
        if (!result.isConfirmed) return;
        setSubmitting(true);
        try {
          await confirmReceiptApi(id);
          toast.success("Đã xác nhận nhận hàng và nhập kho thành công!");
          navigate("/manager/transfer_approvals");
        } catch (error) {
          toast.error(error.response?.data?.message || "Không thể xác nhận nhận hàng");
          setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "COMPLETED":
                return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium flex items-center gap-1"><CheckCircle size={14}/> Đã hoàn thành</span>;
            case "APPROVED":
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium flex items-center gap-1"><CheckCircle size={14}/> Đã duyệt (Chờ xuất)</span>;
            case "IN PROGRESS":
            case "DELIVERING":
                return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium flex items-center gap-1"><Truck size={14}/> Đang vận chuyển</span>;
            case "PENDING":
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium flex items-center gap-1"><Clock size={14}/> Chờ duyệt</span>;
            case "REJECTED":
                return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium flex items-center gap-1"><X size={14}/> Từ chối</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("vi-VN", {
            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (!transferRequest) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center h-64 text-red-500 font-bold">Không tìm thấy yêu cầu chuyển kho</div>
            </div>
        );
    }

    const isFromUserStore = transferRequest.fromStoreId?._id === userStoreId;
    const isToUserStore = transferRequest.toStoreId?._id === userStoreId;
    const reqStatus = transferRequest.status?.toUpperCase();
    const hasExported = ["DELIVERING", "IN PROGRESS", "COMPLETED"].includes(reqStatus);
    return (
        <>
            <ToastContainer position="top-right" autoClose={3000}/>
            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/manager/transfer_approvals")}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white shadow-sm"
                        >
                            <ArrowLeft size={20}/>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Truck className="text-indigo-600"/>
                            Chi tiết yêu cầu chuyển kho
                        </h1>
                    </div>
                    {getStatusBadge(reqStatus)}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Store size={20} className="text-indigo-600"/> Thông tin cửa hàng
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Cửa hàng gửi (Xuất đi)</label>
                            <input type="text" value={transferRequest.fromStoreId?.name || "N/A"} disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Cửa hàng nhận (Nhập về)</label>
                            <input type="text" value={transferRequest.toStoreId?.name || "N/A"} disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User size={20} className="text-indigo-600"/> Thông tin yêu cầu
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Người yêu cầu</label>
                            <input type="text" value={transferRequest.requestedBy?.fullName || "N/A"} disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ngày tạo</label>
                            <input type="text" value={formatDate(transferRequest.createdAt)} disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Người duyệt</label>
                            <input 
                                type="text" 
                                value={transferRequest.approvedBy ? (transferRequest.approvedBy.fullName || transferRequest.approvedBy.name || "Đã duyệt") : "Chưa có"} 
                                disabled 
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold" 
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú yêu cầu</label>
                        <textarea
                            value={transferRequest.note || ""}
                            disabled
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none disabled:bg-gray-50 disabled:text-gray-600 font-medium"
                            placeholder="Không có ghi chú..."
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Package size={20} className="text-indigo-600"/> Chi tiết Sản phẩm
                    </h2>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4 font-bold text-center w-12 align-middle">STT</th>
                                    <th className="p-4 font-bold w-[30%] align-middle">Sản phẩm yêu cầu</th>
                                    <th className="p-4 font-bold text-center w-[15%] align-middle">Tiến độ xuất</th>
                                    <th className="p-4 font-bold w-[45%] align-middle">Thực tế Sale đã xuất (Nếu có)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requestedItems.map((item, index) => (
                                    <tr key={item.itemTypeId} className="hover:bg-slate-50/50 transition align-top">
                                        <td className="p-4 text-center font-bold text-gray-500">{index + 1}</td>
                                        
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800 text-[15px]">{item.name}</div>
                                        </td>

                                  
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${hasExported && item.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {hasExported ? item.scannedQuantity : 0} / {item.requiredQuantity}
                                                {hasExported && item.isValid ? <CheckCircle size={14}/> : <Clock size={14}/>}
                                            </div>
                                        </td>

                                 
                                        <td className="p-4 bg-gray-50/30">
                                            {hasExported && item.transferredItems.length > 0 ? (
                                                <div className="space-y-2">
                                                    {item.transferredItems.map((transferredItem) => (
                                                        <div key={transferredItem.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-bold text-gray-800 truncate flex items-center gap-2" title={transferredItem.name}>
                                                                    {transferredItem.name}
                                                                    {transferredItem.isPhone ? (
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                                                            transferredItem.grade === 'Mới' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                            transferredItem.grade === 'Máy dựng' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                            'bg-orange-50 text-orange-700 border-orange-200'
                                                                        }`}>
                                                                            {transferredItem.grade}
                                                                        </span>
                                                                    ) : (
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                                                            transferredItem.origin === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                                                        }`}>
                                                                            {transferredItem.origin === 'new' ? 'Mới' : 'Bóc máy'}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">SN: {transferredItem.serialCode}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs italic font-medium">
                                                    Kho nguồn chưa xuất
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate("/manager/transfer_approvals")}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Quay lại
                    </button>

                    {isFromUserStore && reqStatus === "PENDING" && (
                        <>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                            >
                                <X size={18}/> Từ chối
                            </button>
                            <button
                                type="button"
                                onClick={handleApprove}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                            >
                                <CheckCircle size={18}/> Duyệt Yêu Cầu
                            </button>
                        </>
                    )}

                    {isToUserStore && (reqStatus === "DELIVERING" || reqStatus === "IN PROGRESS") && (
                        <button
                            type="button"
                            onClick={handleConfirmReceipt}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            <Package size={18}/> Xác Nhận Đã Nhận Đủ
                        </button>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
        </>
    );
}