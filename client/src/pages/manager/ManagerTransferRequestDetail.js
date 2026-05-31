import React, {useEffect, useState, useRef} from "react";
import {useNavigate, useParams} from "react-router-dom";
import { AlertCircle, ArrowLeft, Camera, CheckCircle, Clock, Package, Plus, Save, Scan, Store, Truck, User, X } from "lucide-react";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {Html5Qrcode} from "html5-qrcode";

import { 
    fetchStoresApi, 
    getTransferRequestByIdApi, 
    getTransferRequestDetailsApi, 
    searchItemsApi, 
    confirmShipmentApi, 
    confirmReceiptDetailApi 
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
            itemTypeName: getItemTypeName(item.item_type)
        }));

        const parsedPhones = rawPhones.filter(Boolean).map((phone) => {
            const modelName = phone.phoneModelId?.name || "Máy điện thoại";
            return {
                id: phone._id,
                name: `${modelName} (${phone.colorName} - ${phone.capacity})`,
                serialCode: phone.serialCode || "N/A",
                itemTypeId: `${phone.phoneModelId?._id || phone.phoneModelId}_${phone.colorName}_${phone.capacity}`,
                itemTypeName: "Điện thoại"
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
            isValid: scannedQuantity === requiredQuantity,
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
             isValid: scannedPhones.length === group.requiredQuantity,
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
    const [requestDetails, setRequestDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userStoreId, setUserStoreId] = useState("");
    const [formData, setFormData] = useState({
        fromStoreId: "",
        toStoreId: "",
        note: ""
    });
    const [requestedItems, setRequestedItems] = useState([]);
    const [transferredItems, setTransferredItems] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [qrCode, setQrCode] = useState("");
    const [receiptScanning, setReceiptScanning] = useState(false);
    const [cameraScanning, setCameraScanning] = useState(false);
    const [scannedReceiptItems, setScannedReceiptItems] = useState([]);
    const [receiptNote, setReceiptNote] = useState("");
    const [showReceiptScanner, setShowReceiptScanner] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const scannerRef = useRef(null);

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
            setRequestDetails(detailsData);
            setFormData({
                fromStoreId: requestData.fromStoreId?._id || "",
                toStoreId: requestData.toStoreId?._id || "",
                note: requestData.note || ""
            });

            initializeItems(requestData, detailsData);
        } catch (error) {
            toast.error("Lỗi khi tải thông tin: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const initializeItems = (requestData, detailsData) => {
        const normalizedTransferredItems = normalizeDetailItems(detailsData);
        setTransferredItems(normalizedTransferredItems);
        setRequestedItems(buildRequestedItems(requestData, normalizedTransferredItems));
    };

    const handleDeleteItem = (itemIdToDelete) => {
        const updatedTransferredItems = transferredItems.filter(item => item.id !== itemIdToDelete);
        setTransferredItems(updatedTransferredItems);
        setRequestedItems(buildRequestedItems(transferRequest, updatedTransferredItems));
        toast.success("Đã xóa sản phẩm khỏi danh sách");
    };

    const handleClearItemType = (itemTypeId) => {
        const updatedTransferredItems = transferredItems.filter(item => item.itemTypeId !== itemTypeId);
        setTransferredItems(updatedTransferredItems);
        setRequestedItems(buildRequestedItems(transferRequest, updatedTransferredItems));
        toast.success("Đã xóa tất cả sản phẩm của loại này");
    };

    const handleQRCodeKeyPress = async (e) => {
        if (e.key === "Enter" && qrCode.trim()) {
            await handleAddItem();
        }
    };

    const handleAddItem = async () => {
        if (!qrCode.trim()) {
            toast.error("Vui lòng nhập serial code");
            return;
        }

        try {
            const data = await searchItemsApi(qrCode.trim());
            const foundItem = data?.data?.[0] || data?.[0];

            if (!foundItem) {
                toast.error("Không tìm thấy sản phẩm với mã này");
                return;
            }

            const foundItemTypeId = getItemTypeId(foundItem.item_type);
            const alreadyAdded = transferredItems.some((item) => item.id === foundItem._id);

            if (alreadyAdded) {
                toast.error("Sản phẩm đã có trong danh sách");
                setQrCode("");
                return;
            }

            const itemTypeExists = transferRequest?.itemType?.some(
                (requestItemType) => getItemTypeId(requestItemType?.itemTypes) === foundItemTypeId
            );

            if (!itemTypeExists) {
                toast.error("Loại sản phẩm này không có trong yêu cầu chuyển kho");
                setQrCode("");
                return;
            }

            const updatedTransferredItems = [
                ...transferredItems,
                {
                    id: foundItem._id,
                    name: foundItem.name || foundItem.serialCode || "Unknown item",
                    serialCode: foundItem.serialCode || "N/A",
                    itemTypeId: foundItemTypeId,
                    itemTypeName: getItemTypeName(foundItem.item_type)
                }
            ];

            setTransferredItems(updatedTransferredItems);
            setRequestedItems(buildRequestedItems(transferRequest, updatedTransferredItems));
            setQrCode("");
            toast.success("Đã thêm sản phẩm");
        } catch (error) {
            toast.error("Lỗi khi thêm sản phẩm: " + (error.response?.data?.message || error.message));
        }
    };

    const startReceiptScanning = () => {
        setShowReceiptScanner(true);
        setReceiptScanning(true);
        setScannedReceiptItems([]);
        setReceiptNote("");
    };

    const closeReceiptScanner = () => {
        setShowReceiptScanner(false);
        setReceiptScanning(false);
        setCameraScanning(false);
        setScannedReceiptItems([]);
        setReceiptNote("");
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {});
            scannerRef.current = null;
        }
    };

    const handleReceiptQRCodeKeyPress = async (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
            await searchReceiptItem(e.target.value.trim());
        }
    };

    const searchReceiptItem = async (serialCode) => {
        if (!serialCode.trim()) return;

        try {
            const result = await searchItemsApi(serialCode, 1);
            const items = result.data || result || [];

            if (items.length === 0) {
                toast.error("Không tìm thấy mặt hàng với mã serial này");
                return;
            }

            const item = items[0];

            if (scannedReceiptItems.find(scannedItem => scannedItem.id === item._id)) {
                toast.warning("Mặt hàng này đã được quét");
                return;
            }

            const isTransferredItem = transferredItems.some(transferredItem =>
                transferredItem.id === item._id || transferredItem.serialCode === item.serialCode
            );

            if (!isTransferredItem) {
                toast.error("Mặt hàng này không có trong danh sách chuyển kho");
                return;
            }

            const receiptItem = {
                id: item._id,
                name: item.name || item.serialCode || "Unknown item",
                serialCode: item.serialCode || "N/A",
                itemTypeId: getItemTypeId(item.item_type),
                itemTypeName: getItemTypeName(item.item_type),
                status: "scanned",
                issue: ""
            };

            setScannedReceiptItems(prev => [...prev, receiptItem]);
            toast.success(`Đã quét: ${item.name}`);
        } catch (error) {
            console.error("Error searching receipt item:", error);
            toast.error("Lỗi khi tìm kiếm mặt hàng");
        }
    };

    const removeScannedReceiptItem = (itemId) => {
        setScannedReceiptItems(prev => prev.filter(item => item.id !== itemId));
        toast.info("Đã xóa mặt hàng khỏi danh sách");
    };

    const updateReceiptItemIssue = (itemId, issue) => {
        setScannedReceiptItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, issue } : item
            )
        );
    };

    const startCameraScanning = async () => {
        try {
            const devices = await Html5Qrcode.getCameras();
            setCameras(devices);

            if (devices.length === 0) {
                toast.error("Không tìm thấy camera nào. Vui lòng kiểm tra kết nối camera.");
                return;
            }

            setSelectedCamera(devices[0].id);
            setCameraScanning(true);
            setReceiptScanning(false);

            toast.success(`Phát hiện ${devices.length} camera`);
        } catch (error) {
            console.error("Error accessing cameras:", error);
            toast.error(`Không thể truy cập camera: ${error.message}`);
        }
    };

    const stopCameraScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(error => {
                console.error("Error stopping scanner:", error);
            });
            scannerRef.current = null;
        }
        setCameraScanning(false);
        setSelectedCamera(null);
    };

    const initializeScanner = async (cameraId) => {
        try {
            if (scannerRef.current) {
                await scannerRef.current.stop();
            }

            const scanner = new Html5Qrcode("receipt-qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    handleReceiptQRCodeDetected(decodedText);
                },
                (errorMessage) => { }
            );
        } catch (error) {
            console.error("Error starting scanner:", error);
            toast.error("Không thể khởi động camera. Vui lòng thử lại.");
        }
    };

    const handleReceiptQRCodeDetected = async (qrText) => {
        if (scannerRef.current) {
            await scannerRef.current.pause();
        }

        await searchReceiptItem(qrText);

        setTimeout(() => {
            if (scannerRef.current && cameraScanning) {
                scannerRef.current.resume();
            }
        }, 2000);
    };

    const handleCameraChange = (cameraId) => {
        setSelectedCamera(cameraId);
        if (cameraScanning && cameraId) {
            initializeScanner(cameraId);
        }
    };

    useEffect(() => {
        if (cameraScanning && selectedCamera) {
            initializeScanner(selectedCamera);
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, [cameraScanning, selectedCamera]);

    const validateItems = () => {
        const errors = {};
        let isValid = true;

        requestedItems.forEach((item, index) => {
            if (item.scannedQuantity !== item.requiredQuantity) {
                errors[`item_${index}`] = `Thiếu ${item.requiredQuantity - item.scannedQuantity} SP`;
                isValid = false;
            }
        });

        setValidationErrors(errors);
        return isValid;
    };

    const canSubmit = () => {
        const isFromUserStore = transferRequest?.fromStoreId?._id === userStoreId;
        const isApproved = transferRequest?.status?.toUpperCase() === "APPROVED";
        const isToUserStore = transferRequest?.toStoreId?._id === userStoreId;
        const isInProgress = transferRequest?.status?.toUpperCase() === "IN PROGRESS";
        const itemsValid = requestedItems.every((item) => item.isValid);

        const fromStoreCanSubmit = isFromUserStore && isApproved && itemsValid;
        const toStoreCanSubmit = isToUserStore && isInProgress && canConfirmReceipt();

        return fromStoreCanSubmit || toStoreCanSubmit;
    };

    const canConfirmReceipt = () => {
        const isToUserStore = transferRequest?.toStoreId?._id === userStoreId;
        const isInProgress = transferRequest?.status?.toUpperCase() === "IN PROGRESS";
        const allItemsScanned = transferredItems.length > 0 &&
            scannedReceiptItems.length === transferredItems.length;

        return isToUserStore && isInProgress && allItemsScanned;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isFromUserStore = transferRequest?.fromStoreId?._id === userStoreId;
        const isToUserStore = transferRequest?.toStoreId?._id === userStoreId;

        if (isFromUserStore && !validateItems()) {
            toast.error("Vui lòng kiểm tra lại số lượng sản phẩm");
            return;
        }

        if (isToUserStore && !canConfirmReceipt()) {
            toast.error("Vui lòng quét tất cả các mặt hàng trước khi xác nhận nhận hàng");
            return;
        }

        if (!canSubmit()) {
            toast.error("Bạn không có quyền xác nhận yêu cầu này");
            return;
        }

        setSubmitting(true);

        try {
            const status = transferRequest?.status?.toUpperCase();
            let successMessage;

            if (isFromUserStore && status === "APPROVED") {
                const requestBody = {
                    note: formData.note,
                    items: transferredItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        itemTypeId: item.itemTypeId
                    }))
                };
                await confirmShipmentApi(id, requestBody);
                successMessage = "Đã xác nhận gửi hàng thành công";

            } else if (isToUserStore && status === "IN PROGRESS") {
                const requestBody = {
                    note: receiptNote,
                    scannedItems: scannedReceiptItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        serialCode: item.serialCode,
                        itemTypeId: item.itemTypeId,
                        issue: item.issue || ""
                    }))
                };
                await confirmReceiptDetailApi(id, requestBody);
                successMessage = "Đã xác nhận nhận hàng thành công";

            } else {
                toast.error("Không thể xác nhận yêu cầu ở trạng thái này");
                setSubmitting(false);
                return;
            }

            toast.success(successMessage);
            navigate("/manager/transfer_approvals");
        } catch (error) {
            toast.error("Lỗi khi xác nhận yêu cầu: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "COMPLETED":
                return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium flex items-center gap-1"><CheckCircle size={14}/> Đã hoàn thành</span>;
            case "APPROVED":
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium flex items-center gap-1"><CheckCircle size={14}/> Đã duyệt</span>;
            case "IN PROGRESS":
                return <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium flex items-center gap-1"><Truck size={14}/> Đang vận chuyển</span>;
            case "PENDING":
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium flex items-center gap-1"><Clock size={14}/> Chờ duyệt</span>;
            case "REJECTED":
                return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium flex items-center gap-1"><X size={14}/> Từ chối</span>;
            case "DELIVERING":
                return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs rounded-md font-bold border border-purple-200 whitespace-nowrap"> Đang vận chuyển</span>;
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

    const getSubmitButtonText = () => {
        const isFromUserStore = transferRequest?.fromStoreId?._id === userStoreId;
        const isToUserStore = transferRequest?.toStoreId?._id === userStoreId;
        const status = transferRequest?.status?.toUpperCase();

        if (isFromUserStore && status === "APPROVED") return "Xác nhận gửi hàng";
        if (isToUserStore && status === "IN PROGRESS") return "Xác nhận nhận hàng";
        return "Xác nhận chuyển kho";
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

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000}/>
            <div className="p-4 md:p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
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
                    {getStatusBadge(transferRequest.status)}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Store size={20} className="text-indigo-600"/> Thông tin cửa hàng
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Cửa hàng gửi</label>
                                <input type="text" value={transferRequest.fromStoreId?.name || "N/A"} disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Cửa hàng nhận</label>
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
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData((prev) => ({...prev, note: e.target.value}))}
                                disabled={transferRequest.status !== "APPROVED" || transferRequest.fromStoreId?._id !== userStoreId}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-600 font-medium"
                                placeholder="Không có ghi chú..."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Package size={20} className="text-indigo-600"/> Kiểm tra sản phẩm
                        </h2>

                       
                      
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 font-bold text-center w-12 align-middle">STT</th>
                                        <th className="p-4 font-bold w-[30%] align-middle">Loại sản phẩm yêu cầu</th>
                                        <th className="p-4 font-bold text-center w-[15%] align-middle">Tiến độ</th>
                                        <th className="p-4 font-bold w-[45%] align-middle">Sản phẩm thực tế đã quét</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {requestedItems.map((item, index) => (
                                        <tr key={item.itemTypeId} className="hover:bg-slate-50/50 transition align-top">
                                            <td className="p-4 text-center font-bold text-gray-500">{index + 1}</td>
                                            
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 text-[15px] mb-2">{item.name}</div>
                                                {item.transferredItems.length > 0 && transferRequest.status?.toUpperCase() === "APPROVED" && transferRequest.fromStoreId?._id === userStoreId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleClearItemType(item.itemTypeId)}
                                                        className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                                                    >
                                                        <X size={12}/> Xóa tất cả quét
                                                    </button>
                                                )}
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${item.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.scannedQuantity} / {item.requiredQuantity}
                                                    {item.isValid ? <CheckCircle size={14}/> : <Clock size={14}/>}
                                                </div>
                                                {validationErrors[`item_${index}`] && (
                                                    <p className="text-[11px] text-red-500 mt-2 font-medium flex items-center justify-center gap-1">
                                                        <AlertCircle size={12}/> {validationErrors[`item_${index}`]}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="p-4 bg-gray-50/30">
                                                {item.transferredItems.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {item.transferredItems.map((transferredItem) => (
                                                            <div key={transferredItem.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[13px] font-bold text-gray-800 truncate" title={transferredItem.name}>{transferredItem.name}</p>
                                                                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">SN: {transferredItem.serialCode}</p>
                                                                </div>
                                                                {transferRequest.status?.toUpperCase() === "APPROVED" && transferRequest.fromStoreId?._id === userStoreId && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteItem(transferredItem.id)}
                                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                                                                        title="Xóa sản phẩm"
                                                                    >
                                                                        <X size={14}/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs italic font-medium">
                                                        Chưa quét sản phẩm nào
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate("/manager/transfer_approvals")}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Quay lại
                        </button>

                        {canSubmit() && (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                            >
                                {submitting ? (
                                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...</>
                                ) : (
                                    <><Save size={18}/> {getSubmitButtonText()}</>
                                )}
                            </button>
                        )}

                        {transferRequest?.toStoreId?._id === userStoreId && transferRequest?.status?.toUpperCase() === "IN PROGRESS" && (
                            <button
                                type="button"
                                onClick={startReceiptScanning}
                                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md"
                            >
                                <Scan size={18}/> Quét mã QR Xác nhận Nhận hàng
                            </button>
                        )}
                    </div>
                </form>

                {showReceiptScanner && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <Scan className="text-emerald-600"/> Xác nhận nhận hàng - Quét mã QR
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Vui lòng quét <strong className="text-emerald-600">{transferredItems.length}</strong> sản phẩm để xác nhận nhập kho
                                    </p>
                                </div>
                                <button onClick={closeReceiptScanner} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full transition-colors shadow-sm">
                                    <X size={20}/>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="mb-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <h3 className="text-md font-bold text-gray-800">1. Chọn phương thức quét</h3>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setReceiptScanning(true)}
                                                disabled={cameraScanning}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2 border border-gray-200 shadow-sm"
                                            >
                                                <Scan size={16}/> Nhập Serial tay
                                            </button>
                                            <button
                                                type="button"
                                                onClick={startCameraScanning}
                                                disabled={receiptScanning}
                                                className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                            >
                                                <Camera size={16}/> Mở Camera thiết bị
                                            </button>
                                        </div>
                                    </div>

                                    {cameraScanning && (
                                        <div className="mb-4 p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                                                    <Camera size={18}/> Quét QR Code bằng Camera
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {cameras.length > 1 && (
                                                        <select
                                                            value={selectedCamera || ""}
                                                            onChange={(e) => handleCameraChange(e.target.value)}
                                                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none font-semibold text-gray-700"
                                                        >
                                                            {cameras.map((camera, index) => (
                                                                <option key={camera.id} value={camera.id}>
                                                                    {camera.label || `Camera ${index + 1}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button onClick={stopCameraScanning} className="p-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md transition-colors"><X size={16}/></button>
                                                </div>
                                            </div>
                                            <div className="flex justify-center">
                                                <div id="receipt-qr-reader" className="border-4 border-dashed border-indigo-300 rounded-2xl overflow-hidden" style={{ width: '300px', height: '300px' }}/>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-3 text-center font-medium">Đưa QR code vào khung hình để hệ thống quét tự động</p>
                                        </div>
                                    )}

                                    {receiptScanning && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                                            <Scan size={20} className="text-gray-500"/>
                                            <input
                                                type="text"
                                                placeholder="Nhập mã serial hoặc dùng máy quét..."
                                                className="flex-1 px-4 py-2.5 font-mono font-bold text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                onKeyPress={handleReceiptQRCodeKeyPress}
                                                autoFocus
                                            />
                                            <button onClick={() => setReceiptScanning(false)} className="p-2 bg-white border border-gray-300 text-gray-500 hover:text-gray-700 rounded-lg transition-colors shadow-sm"><X size={20}/></button>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                                        <h3 className="text-md font-bold text-gray-800">
                                            2. Danh sách sản phẩm đã quét 
                                            <span className="ml-2 text-indigo-600">({scannedReceiptItems.length}/{transferredItems.length})</span>
                                        </h3>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${scannedReceiptItems.length === transferredItems.length ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                                            {scannedReceiptItems.length === transferredItems.length ? 'Đã đủ số lượng' : 'Cần quét thêm'}
                                        </div>
                                    </div>

                                
                                    {scannedReceiptItems.length > 0 ? (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-center w-12">STT</th>
                                                        <th className="px-4 py-3 font-semibold w-[35%]">Sản phẩm</th>
                                                        <th className="px-4 py-3 font-semibold w-[40%]">Ghi chú vấn đề</th>
                                                        <th className="px-4 py-3 font-semibold text-center w-16">Xóa</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {scannedReceiptItems.map((item, idx) => (
                                                        <tr key={item.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-4 py-3 text-center font-bold text-gray-400">{idx + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-bold text-gray-800 text-[13px] truncate" title={item.name}>{item.name}</div>
                                                                <div className="text-[11px] text-gray-500 mt-0.5 font-mono">SN: {item.serialCode}</div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="VD: Bị xước, hỏng..."
                                                                    value={item.issue}
                                                                    onChange={(e) => updateReceiptItemIssue(item.id, e.target.value)}
                                                                    className="w-full px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button onClick={() => removeScannedReceiptItem(item.id)} className="p-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-md transition-colors inline-flex"><X size={14}/></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                                            <Package size={40} className="mx-auto mb-3 opacity-30"/>
                                            <p className="text-sm font-medium">Chưa quét sản phẩm nào</p>
                                            <p className="text-xs mt-1">Chọn "Quét Camera" hoặc "Nhập Serial" để bắt đầu</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">3. Ghi chú chung (Không bắt buộc)</label>
                                    <textarea
                                        value={receiptNote}
                                        onChange={(e) => setReceiptNote(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                                        placeholder="Ví dụ: Lô hàng nhận đủ, đóng gói cẩn thận..."
                                    />
                                </div>
                            </div>
                            
                            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
                                <button onClick={closeReceiptScanner} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm">Hủy Bỏ</button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={scannedReceiptItems.length !== transferredItems.length || submitting}
                                    className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-emerald-500/20"
                                >
                                    {submitting ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...</>
                                    ) : (
                                        <><CheckCircle size={18}/> Chốt Nhận Hàng</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }`}} />
        </>
    );
}