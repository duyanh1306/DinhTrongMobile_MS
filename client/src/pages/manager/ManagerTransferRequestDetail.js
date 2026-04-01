import React, {useEffect, useState, useRef} from "react";
import {useNavigate, useParams} from "react-router-dom";
import { AlertCircle, ArrowLeft, Camera, CheckCircle, Clock, Package, Plus, Save, Scan, Store, Truck, User, X } from "lucide-react";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {Html5Qrcode} from "html5-qrcode";

// 🌟 IMPORT API
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

        return rawItems
            .filter(Boolean)
            .map((item) => ({
                id: item._id,
                name: item.name || item.serialCode || "Unknown item",
                serialCode: item.serialCode || "N/A",
                itemTypeId: getItemTypeId(item.item_type),
                itemTypeName: getItemTypeName(item.item_type)
            }));
    });

const buildRequestedItems = (requestData, transferredItems = []) => {
    const transferredCountByType = transferredItems.reduce((acc, item) => {
        if (!item.itemTypeId) return acc;
        acc[item.itemTypeId] = (acc[item.itemTypeId] || 0) + 1;
        return acc;
    }, {});

    return (requestData?.itemType || []).map((itemTypeEntry) => {
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
            transferredItems: itemsForType
        };
    });
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

    // Receipt QR Code Scanning Functions
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

            // Check if item already exists in scanned receipt list
            if (scannedReceiptItems.find(scannedItem => scannedItem.id === item._id)) {
                toast.warning("Mặt hàng này đã được quét");
                return;
            }

            // Check if this item is part of the transferred items
            const isTransferredItem = transferredItems.some(transferredItem =>
                transferredItem.id === item._id || transferredItem.serialCode === item.serialCode
            );

            if (!isTransferredItem) {
                toast.error("Mặt hàng này không có trong danh sách chuyển kho");
                return;
            }

            // Add item to scanned receipt list
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
            console.log("Starting camera detection...");

            // Get available cameras
            const devices = await Html5Qrcode.getCameras();
            console.log("Detected devices:", devices);

            setCameras(devices);

            if (devices.length === 0) {
                console.log("No cameras detected");
                toast.error("Không tìm thấy camera nào. Vui lòng kiểm tra kết nối camera.");
                return;
            }

            console.log("Found cameras:", devices.map(d => ({ id: d.id, label: d.label })));

            // Select first camera by default
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
            // Stop existing scanner if any
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
                    // QR Code detected
                    console.log("QR Code detected:", decodedText);
                    handleReceiptQRCodeDetected(decodedText);
                },
                (errorMessage) => {
                    // Ignore errors during scanning
                }
            );
        } catch (error) {
            console.error("Error starting scanner:", error);
            toast.error("Không thể khởi động camera. Vui lòng thử lại.");
        }
    };

    const handleReceiptQRCodeDetected = async (qrText) => {
        // Stop scanning temporarily to prevent multiple reads
        if (scannerRef.current) {
            await scannerRef.current.pause();
        }

        // Search for item with the QR code text
        await searchReceiptItem(qrText);

        // Resume scanning after a delay
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
                errors[`item_${index}`] = `Số lượng không khớp: cần ${item.requiredQuantity}, có ${item.scannedQuantity}`;
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

        // FROM store can only submit when status is APPROVED and items are valid
        // TO store can only submit when status is IN PROGRESS and all items are scanned
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
                return <span
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium flex items-center gap-1"><CheckCircle
                    size={14}/> Đã hoàn thành</span>;
            case "APPROVED":
                return <span
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium flex items-center gap-1"><CheckCircle
                    size={14}/> Đã duyệt</span>;
            case "IN PROGRESS":
                return <span
                    className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium flex items-center gap-1"><Truck
                    size={14}/> Đang vận chuyển</span>;
            case "PENDING":
                return <span
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium flex items-center gap-1"><Clock
                    size={14}/> Chờ duyệt</span>;
            case "REJECTED":
                return <span
                    className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium flex items-center gap-1"><X
                    size={14}/> Từ chối</span>;
            default:
                return <span
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const getSubmitButtonText = () => {
        const isFromUserStore = transferRequest?.fromStoreId?._id === userStoreId;
        const isToUserStore = transferRequest?.toStoreId?._id === userStoreId;
        const status = transferRequest?.status?.toUpperCase();

        if (isFromUserStore && status === "APPROVED") {
            return "Xác nhận gửi hàng";
        }
        if (isToUserStore && status === "IN PROGRESS") {
            return "Xác nhận nhận hàng";
        }
        return "Xác nhận chuyển kho";
    };

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Đang tải thông tin...</div>
                </div>
            </div>
        );
    }

    if (!transferRequest) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Không tìm thấy yêu cầu chuyển kho</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000}/>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/manager/transfer_approvals")}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Store size={20} className="text-indigo-600"/>
                            Thông tin cửa hàng
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cửa hàng gửi
                                </label>
                                <input
                                    type="text"
                                    value={transferRequest.fromStoreId?.name || "N/A"}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cửa hàng nhận
                                </label>
                                <input
                                    type="text"
                                    value={transferRequest.toStoreId?.name || "N/A"}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-indigo-600"/>
                            Thông tin yêu cầu
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Người yêu cầu
                                </label>
                                <input
                                    type="text"
                                    value={transferRequest.requestedBy?.fullName || "N/A"}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ngày tạo
                                </label>
                                <input
                                    type="text"
                                    value={formatDate(transferRequest.createdAt)}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Người duyệt
                                </label>
                                <input
                                    type="text"
                                    value={transferRequest.approvedBy?.fullName || "Chưa có"}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ghi chú
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData((prev) => ({...prev, note: e.target.value}))}
                                disabled={transferRequest.status !== "APPROVED" || transferRequest.fromStoreId?._id !== userStoreId}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-600"
                                placeholder="Thêm ghi chú..."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Package size={20} className="text-indigo-600"/>
                            Kiểm tra sản phẩm
                        </h2>

                        {transferRequest.status?.toUpperCase() === "APPROVED" && transferRequest.fromStoreId?._id === userStoreId && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <Plus size={18} className="text-blue-600"/>
                                    Thêm sản phẩm vào yêu cầu
                                </h3>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mã sản phẩm (QR Code)
                                        </label>
                                        <input
                                            type="text"
                                            value={qrCode}
                                            onChange={(e) => setQrCode(e.target.value)}
                                            onKeyPress={handleQRCodeKeyPress}
                                            placeholder="Quét mã QR hoặc nhập mã sản phẩm"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        disabled={!qrCode.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Plus size={16}/>
                                        Thêm sản phẩm
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {requestedItems.map((item, index) => (
                                <div key={item.itemTypeId} className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Loại sản phẩm
                                                yêu cầu</p>
                                            {item.transferredItems.length > 0 && transferRequest.status?.toUpperCase() === "APPROVED" && transferRequest.fromStoreId?._id === userStoreId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearItemType(item.itemTypeId)}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    Xóa tất cả
                                                </button>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-gray-800">{item.name}</h3>

                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-sm text-gray-600">Yêu cầu: <span className="font-medium">{item.requiredQuantity}</span></span>
                                            <span className="text-sm text-gray-600">Đã thêm: <span className={`font-medium ${item.isValid ? "text-green-600" : "text-red-600"}`}>{item.scannedQuantity}</span></span>
                                        </div>

                                        {validationErrors[`item_${index}`] && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle size={14}/>
                                                {validationErrors[`item_${index}`]}
                                            </p>
                                        )}

                                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Danh sách
                                                sản phẩm thực tế</p>
                                            {item.transferredItems.length > 0 ? (
                                                <div className="space-y-2">
                                                    {item.transferredItems.map((transferredItem) => (
                                                        <div key={transferredItem.id}
                                                             className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-white px-3 py-2">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-800">{transferredItem.name}</p>
                                                                <p className="text-xs text-gray-500">Serial: {transferredItem.serialCode}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-xs text-gray-500">{transferredItem.itemTypeName}</span>
                                                                {transferRequest.status?.toUpperCase() === "APPROVED" && transferRequest.fromStoreId?._id === userStoreId && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteItem(transferredItem.id)}
                                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                        title="Xóa sản phẩm"
                                                                    >
                                                                        <X size={14}/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Chưa có sản phẩm nào được thêm cho loại này.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        {item.isValid ? (
                                            <div className="text-green-600"><CheckCircle size={20}/></div>
                                        ) : (
                                            <div className="text-red-600"><X size={20}/></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate("/manager/transfer_approvals")}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Quay lại
                        </button>

                        {canSubmit() && (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16}/>
                                        {getSubmitButtonText()}
                                    </>
                                )}
                            </button>
                        )}

                        {transferRequest?.toStoreId?._id === userStoreId && transferRequest?.status?.toUpperCase() === "IN PROGRESS" && (
                            <button
                                type="button"
                                onClick={startReceiptScanning}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Scan size={16}/>
                                Quét mã QR xác nhận nhận hàng
                            </button>
                        )}
                    </div>
                </form>

                {showReceiptScanner && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Scan className="text-green-600"/>
                                        Xác nhận nhận hàng - Quét mã QR
                                    </h2>
                                    <button
                                        onClick={closeReceiptScanner}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X size={20}/>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Vui lòng quét tất cả các mặt hàng ({transferredItems.length} sản phẩm) để xác nhận nhận hàng
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-800">
                                            Quét mã QR sản phẩm
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setReceiptScanning(true)}
                                                disabled={cameraScanning}
                                                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <Scan size={14}/> Nhập Serial
                                            </button>
                                            <button
                                                type="button"
                                                onClick={startCameraScanning}
                                                disabled={receiptScanning}
                                                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <Camera size={14}/> Quét Camera
                                            </button>
                                        </div>
                                    </div>

                                    {cameraScanning && (
                                        <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-indigo-700">
                                                    <Camera size={16} className="inline mr-1"/> Quét QR Code bằng Camera
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {cameras.length > 1 && (
                                                        <select
                                                            value={selectedCamera || ""}
                                                            onChange={(e) => handleCameraChange(e.target.value)}
                                                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                                                        >
                                                            {cameras.map((camera, index) => (
                                                                <option key={camera.id} value={camera.id}>
                                                                    {camera.label || `Camera ${index + 1}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button onClick={stopCameraScanning} className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors"><X size={16}/></button>
                                                </div>
                                            </div>
                                            <div className="flex justify-center">
                                                <div id="receipt-qr-reader" className="border-2 border-indigo-300 rounded-lg" style={{ width: '300px', height: '300px' }}/>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2 text-center">Đưa QR code vào khung để quét tự động</p>
                                        </div>
                                    )}

                                    {receiptScanning && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <Scan size={16} className="text-gray-600"/>
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã serial hoặc quét QR code..."
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    onKeyPress={handleReceiptQRCodeKeyPress}
                                                    autoFocus
                                                />
                                                <button onClick={() => setReceiptScanning(false)} className="px-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"><X size={16}/></button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-medium text-gray-800">
                                            Danh sách sản phẩm đã quét ({scannedReceiptItems.length}/{transferredItems.length})
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${scannedReceiptItems.length === transferredItems.length ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {scannedReceiptItems.length === transferredItems.length ? 'Hoàn thành' : 'Cần quét thêm'}
                                        </div>
                                    </div>

                                    {scannedReceiptItems.length > 0 ? (
                                        <div className="space-y-2">
                                            {scannedReceiptItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{item.name}</div>
                                                        <div className="text-xs text-gray-500">Serial: {item.serialCode} | Loại: {item.itemTypeName}</div>
                                                        <input
                                                            type="text"
                                                            placeholder="Ghi chú vấn đề (nếu có)..."
                                                            value={item.issue}
                                                            onChange={(e) => updateReceiptItemIssue(item.id, e.target.value)}
                                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                                        />
                                                    </div>
                                                    <button onClick={() => removeScannedReceiptItem(item.id)} className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"><X size={14}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <Package size={32} className="mx-auto mb-2"/>
                                            <p className="text-sm">Chưa quét sản phẩm nào</p>
                                            <p className="text-xs">Nhấn "Quét Camera" hoặc "Nhập Serial" để bắt đầu</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú chung về việc nhận hàng</label>
                                    <textarea
                                        value={receiptNote}
                                        onChange={(e) => setReceiptNote(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Nhập ghi chú về tình trạng nhận hàng (nếu có)..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button onClick={closeReceiptScanner} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={scannedReceiptItems.length !== transferredItems.length || submitting}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...</>
                                        ) : (
                                            <><CheckCircle size={16}/> Xác nhận nhận hàng</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}