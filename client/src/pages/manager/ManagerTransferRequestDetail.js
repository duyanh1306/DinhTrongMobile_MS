import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Package,
    Plus,
    Save,
    Store,
    Truck,
    User,
    X
} from "lucide-react";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        fetchUserStore(userData._id || userData.id);
        fetchTransferRequestDetails();
    }, [id]);

    const fetchUserStore = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:9999/api/stores", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) return;

            const result = await response.json();
            const storesArray = result.data || result;

            if (!Array.isArray(storesArray)) return;

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
            const token = localStorage.getItem("token");

            const requestResponse = await fetch(`http://localhost:9999/api/transfer-requests/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const detailsResponse = await fetch(`http://localhost:9999/api/transfer-requests/${id}/details`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!requestResponse.ok || !detailsResponse.ok) {
                toast.error("Không thể tải thông tin yêu cầu chuyển kho");
                return;
            }

            const requestData = await requestResponse.json();
            const detailsData = await detailsResponse.json();

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
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:9999/api/items?search=${encodeURIComponent(qrCode.trim())}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                toast.error("Không tìm thấy sản phẩm");
                return;
            }

            const data = await response.json();
            const foundItem = data?.data?.[0];

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
            toast.error("Lỗi khi thêm sản phẩm: " + error.message);
        }
    };

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

        return (isFromUserStore && isApproved && itemsValid) || (isToUserStore && isInProgress);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isFromUserStore = transferRequest?.fromStoreId?._id === userStoreId;
        if (isFromUserStore && !validateItems()) {
            toast.error("Vui lòng kiểm tra lại số lượng sản phẩm");
            return;
        }

        if (!canSubmit()) {
            toast.error("Bạn không có quyền xác nhận yêu cầu này");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const isToUserStore = transferRequest?.toStoreId?._id === userStoreId;
            const status = transferRequest?.status?.toUpperCase();
            let endpoint;
            let successMessage;

            if (isFromUserStore && status === "APPROVED") {
                endpoint = `http://localhost:9999/api/transfer-requests/${id}/confirm-shipment`;
                successMessage = "Đã xác nhận gửi hàng thành công";
            } else if (isToUserStore && status === "IN PROGRESS") {
                endpoint = `http://localhost:9999/api/transfer-requests/${id}/confirm-receipt`;
                successMessage = "Đã xác nhận nhận hàng thành công";
            } else {
                toast.error("Không thể xác nhận yêu cầu ở trạng thái này");
                setSubmitting(false);
                return;
            }

            const requestBody = {};
            if (isFromUserStore && status === "APPROVED") {
                requestBody.note = formData.note;
                requestBody.items = transferredItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    itemTypeId: item.itemTypeId
                }));
            }

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
            });
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.message || "Không thể xác nhận yêu cầu");
                return;
            }

            toast.success(successMessage);
            navigate("/manager/transfer_approvals");
        } catch (error) {
            toast.error("Lỗi khi xác nhận yêu cầu: " + error.message);
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
                                <div
                                    className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
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
                      <span className="text-sm text-gray-600">
                        Yêu cầu: <span className="font-medium">{item.requiredQuantity}</span>
                      </span>
                                            <span className="text-sm text-gray-600">
                        Đã thêm: <span className={`font-medium ${item.isValid ? "text-green-600" : "text-red-600"}`}>{item.scannedQuantity}</span>
                      </span>
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
                                                <p className="text-sm text-gray-500">Chưa có sản phẩm nào được thêm cho
                                                    loại này.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        {item.isValid ? (
                                            <div className="text-green-600">
                                                <CheckCircle size={20}/>
                                            </div>
                                        ) : (
                                            <div className="text-red-600">
                                                <X size={20}/>
                                            </div>
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
                                        <div
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                    </div>
                </form>
            </div>
        </>
    );
}
