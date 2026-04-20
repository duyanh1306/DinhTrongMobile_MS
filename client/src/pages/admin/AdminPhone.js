import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Smartphone, Search, ChevronDown, X, MapPin, Tag, Image as ImageIcon, QrCode, Eye, ArrowUpDown } from "lucide-react";

import { fetchStoresAndModelsApi, fetchPhonesApi, deletePhoneApi, fetchPhoneQrCodeApi, createPhoneApi, updatePhoneApi } from "../../api/admin/phone"; 

const initialFormState = {
    serialCode: '', phoneModelId: '', storeId: '', colorName: '', capacity: '',
    grade: 'Mới', status: 'in_stock', importPrice: 0, sellingPrice: 0,
    warrantyPeriod: 12, source: 'supplier', notes: '',
    imageFiles: [], previewImages: [], retainedImages: []
};
const formatPriceInput = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsePriceInput = (str) => {
    if (!str) return '';
    return str.toString().replace(/\./g, '');
};

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
    const [editingDots, setEditingDots] = useState(null); 
    const [jumpPage, setJumpPage] = useState('');

    if (totalPages <= 1) return null;

    const handleJumpSubmit = () => {
        let page = parseInt(jumpPage, 10);
        if (!isNaN(page)) {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            onPageChange(page);
        }
        setEditingDots(null);
        setJumpPage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleJumpSubmit();
        } else if (e.key === 'Escape') {
            setEditingDots(null);
            setJumpPage('');
        }
    };

    const renderInteractiveDots = (position) => {
        if (editingDots === position) {
            return (
                <input
                    key={`input-${position}`}
                    type="number"
                    autoFocus
                    min={1}
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    onBlur={handleJumpSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-14 px-1 py-1.5 border-2 border-blue-500 rounded-lg text-center text-sm font-bold text-blue-700 outline-none hide-arrows shadow-sm"
                    placeholder="..."
                />
            );
        }
        return (
            <button
                key={`dots-${position}`}
                onClick={() => setEditingDots(position)}
                className="px-2 text-gray-400 font-bold tracking-widest hover:text-blue-600 transition cursor-pointer"
                title="Nhấn để nhập số trang"
            >
                ...
            </button>
        );
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = startPage + maxVisible - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button key="first" onClick={() => onPageChange(1)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">1</button>
            );
            if (startPage > 2) {
                pages.push(renderInteractiveDots('start'));
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm ${
                        i === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(renderInteractiveDots('end'));
            }
            pages.push(
                <button key="last" onClick={() => onPageChange(totalPages)} className="px-3.5 py-1.5 border rounded-lg text-sm font-bold transition shadow-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-100">{totalPages}</button>
            );
        }

        return pages;
    };

    return (
        <div className="flex gap-1.5 items-center">
            <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm"
            >
                Trước
            </button>
            
            {renderPageNumbers()}
            
            <button
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1.5 border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm rounded-lg shadow-sm"
            >
                Sau
            </button>
            
            <style dangerouslySetInnerHTML={{__html: `
                .hide-arrows::-webkit-outer-spin-button,
                .hide-arrows::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .hide-arrows {
                    -moz-appearance: textfield;
                }
            `}} />
        </div>
    );
};
export default function AdminPhone() {
    const [phones, setPhones] = useState([]);
    const [models, setModels] = useState([]);
    const [stores, setStores] = useState([]);
    
    const [loading, setLoading] = useState(true);
    
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedStoreFilter, setSelectedStoreFilter] = useState("");
    const [selectedBrandFilter, setSelectedBrandFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const groupsPerPage = 10; 

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedGroupModel, setSelectedGroupModel] = useState(null);
    const [detailSearch, setDetailSearch] = useState('');
    const [detailSortPrice, setDetailSortPrice] = useState(''); 
    const [detailCurrentPage, setDetailCurrentPage] = useState(1);
    const detailItemsPerPage = 5;

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);
    const [selectedFormBrand, setSelectedFormBrand] = useState('');

    useEffect(() => { fetchStoresAndModels(); }, []);
    useEffect(() => { fetchPhones(); }, [selectedStoreFilter]);

    useEffect(() => { setCurrentPage(1); }, [searchKeyword, selectedBrandFilter, selectedStoreFilter]);
    useEffect(() => { setDetailCurrentPage(1); }, [detailSearch, detailSortPrice]);

    const filteredModelsForForm = useMemo(() => {
        if (!selectedFormBrand) return [];
        return models.filter(m => {
            const brandName = m.brand?.name || m.brand || 'Hãng khác';
            return brandName === selectedFormBrand;
        });
    }, [models, selectedFormBrand]);

    const fetchStoresAndModels = async () => {
        const { stores: fetchedStores, models: fetchedModels } = await fetchStoresAndModelsApi();
        setStores(fetchedStores);
        if (fetchedStores.length > 0 && !selectedStoreFilter) setSelectedStoreFilter(fetchedStores[0]._id);
        setModels(fetchedModels);
    };

    const fetchPhones = async () => {
        if (!selectedStoreFilter) return;
        setLoading(true);
        const phonesData = await fetchPhonesApi(selectedStoreFilter);
        setPhones(phonesData);
        setLoading(false);
    };

    const uniqueBrands = useMemo(() => {
        const brands = new Set();
        models.forEach(m => {
            if (m.brand?.name) brands.add(m.brand.name);
            else if (typeof m.brand === 'string') brands.add(m.brand);
        });
        return Array.from(brands);
    }, [models]);

    const handleOpenModal = (phone = null) => {
        if (phone) {
            setIsEditing(true); setEditingId(phone._id);
            const modelObj = models.find(m => m._id === (phone.phoneModelId?._id || phone.phoneModelId));
            if (modelObj) {
                setSelectedFormBrand(modelObj.brand?.name || modelObj.brand || 'Hãng khác');
            } else {
                setSelectedFormBrand('');
            }

            setFormData({
                serialCode: phone.serialCode || '', phoneModelId: phone.phoneModelId?._id || phone.phoneModelId,
                storeId: phone.storeId?._id || phone.storeId, colorName: phone.colorName || '', capacity: phone.capacity || '',
                grade: phone.grade || 'Mới', status: phone.status || 'in_stock', importPrice: phone.importPrice || 0,
                sellingPrice: phone.sellingPrice || 0, warrantyPeriod: phone.warrantyPeriod || 12, source: phone.source || 'supplier',
                notes: phone.notes || '', imageFiles: [], previewImages: phone.specificImages || [], retainedImages: phone.specificImages || []
            });
        } else {
            setIsEditing(false); setEditingId(null);
            setSelectedFormBrand(''); 
            setFormData({ ...initialFormState, storeId: selectedStoreFilter });
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Chiếc điện thoại này sẽ bị xóa khỏi kho và không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy bỏ',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 mx-2 shadow-sm',
                cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 mx-2 shadow-sm'
            }
        });

        if (result.isConfirmed) {
            const success = await deletePhoneApi(id);
            if (success) {
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Máy đã được xóa khỏi hệ thống.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchPhones();
            }
        }
    };

    const handleGenerateQR = async (phoneId, serialCode) => {
        const blobData = await fetchPhoneQrCodeApi(phoneId);
        if (!blobData) { toast.error("Lỗi khi tải mã QR."); return; }

        const blob = new Blob([blobData], { type: "image/png" });
        const qrUrl = window.URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
        iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc || !iframe.contentWindow) {
            document.body.removeChild(iframe); window.URL.revokeObjectURL(qrUrl);
            toast.error("Không thể khởi tạo chế độ in."); return;
        }

        iframeDoc.open();
        iframeDoc.write(`
          <!doctype html>
          <html>
            <head><style>@page { margin: 0; } html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; display: flex; align-items: center; justify-content: center; } img { width: 180px; height: 180px; object-fit: contain; }</style></head>
            <body><img id="qr-print-image" src="${qrUrl}" alt="QR code" /></body>
          </html>
        `);
        iframeDoc.close();

        const img = iframeDoc.getElementById("qr-print-image");
        if (img) {
            img.onload = () => {
                iframe.contentWindow.focus(); iframe.contentWindow.print();
                setTimeout(() => { window.URL.revokeObjectURL(qrUrl); if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 500);
            };
        }
    };

    const handleGenerateSerial = () => {
        if (!formData.phoneModelId) return toast.warning("Vui lòng chọn Dòng máy trước!");
        const selectedModel = models.find(m => m._id === formData.phoneModelId);
        if (!selectedModel) return;

        let prefix = selectedModel.name.toUpperCase().replace(/\s+/g, '');
        prefix = prefix.replace('IPHONE', 'IP').replace('SAMSUNGGALAXY', 'SS').replace('XIAOMI', 'MI');
        if (prefix.length > 8) prefix = prefix.substring(0, 8);

        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setFormData({ ...formData, serialCode: `${prefix}-${ddmmyyyy}-${randomStr}` });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 0) {
            const existingFileNames = formData.imageFiles.map(f => f.name);
            
            let validFiles = [];
            let hasOversizedFile = false;
            let hasDuplicateFile = false;
            let currentBatchNames = new Set(); 

            files.forEach(file => {
                if (existingFileNames.includes(file.name) || currentBatchNames.has(file.name)) {
                    hasDuplicateFile = true;
                } else if (file.size > 10 * 1024 * 1024) {
                    hasOversizedFile = true;
                } else {
                    validFiles.push(file);
                    currentBatchNames.add(file.name);
                }
            });

            const currentTotalImages = formData.previewImages.length;
            const newTotalImages = currentTotalImages + validFiles.length;
    
   
            if (newTotalImages > 5) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Vượt quá giới hạn!',
                    text: `Bạn chỉ được phép có tối đa 5 ảnh. Hiện tại bạn đang có ${currentTotalImages} ảnh. Vui lòng chọn thêm tối đa ${5 - currentTotalImages} ảnh hợp lệ.`,
                    buttonsStyling: false,
                    customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
                });
                e.target.value = null; 
                return; 
            }
    
            if (hasDuplicateFile) {
                Swal.fire({
                    icon: 'info',
                    title: 'Bỏ qua ảnh trùng lặp!',
                    text: 'Một hoặc nhiều ảnh bạn chọn đã có sẵn trong danh sách nên đã bị bỏ qua.',
                    buttonsStyling: false,
                    customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
                });
            } else if (hasOversizedFile) { 
                Swal.fire({
                    icon: 'error',
                    title: 'Ảnh quá lớn!',
                    text: 'Một hoặc nhiều ảnh có dung lượng vượt quá 10MB đã bị loại bỏ.',
                    buttonsStyling: false,
                    customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
                });
            }
            
            e.target.value = null; 
    
            if (validFiles.length > 0) {
                const newPreviews = validFiles.map(file => URL.createObjectURL(file));
                setFormData(prev => ({ 
                    ...prev, 
                    imageFiles: [...prev.imageFiles, ...validFiles], 
                    previewImages: [...prev.previewImages, ...newPreviews]
                }));
            }
        }
    };
    
    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => {
            const newPreviewImages = [...prev.previewImages];
            const removedSrc = newPreviewImages.splice(indexToRemove, 1)[0];
    
            let newRetainedImages = [...(prev.retainedImages || [])];
            let newImageFiles = [...prev.imageFiles];
    
            if (removedSrc.startsWith('blob:')) {
                const fileIndex = indexToRemove - newRetainedImages.length;
                if (fileIndex >= 0) newImageFiles.splice(fileIndex, 1);
            } 
            else {
                newRetainedImages = newRetainedImages.filter(img => img !== removedSrc);
            }
    
            return {
                ...prev,
                previewImages: newPreviewImages,
                imageFiles: newImageFiles,
                retainedImages: newRetainedImages
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const submitData = new FormData();
        submitData.append("serialCode", formData.serialCode); submitData.append("phoneModelId", formData.phoneModelId);
        submitData.append("storeId", formData.storeId); submitData.append("colorName", formData.colorName);
        
        let finalCapacity = formData.capacity.trim().toUpperCase();
        if (finalCapacity && !finalCapacity.includes('GB') && !finalCapacity.includes('TB')) finalCapacity += 'GB';
        
        submitData.append("capacity", finalCapacity); submitData.append("grade", formData.grade);
        submitData.append("status", formData.status); submitData.append("importPrice", formData.importPrice);
        submitData.append("sellingPrice", formData.sellingPrice); submitData.append("warrantyPeriod", formData.warrantyPeriod);
        submitData.append("source", formData.source); submitData.append("notes", formData.notes);

        if (isEditing && formData.retainedImages?.length > 0) submitData.append("retainedImages", JSON.stringify(formData.retainedImages));
        if (formData.imageFiles?.length > 0) formData.imageFiles.forEach(file => submitData.append("images", file));

        let isSuccess = false;
        try {
            if (isEditing) {
                isSuccess = await updatePhoneApi(editingId, submitData);
            } else {
                isSuccess = await createPhoneApi(submitData);
            }

            if (isSuccess) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: isEditing ? 'Cập nhật thông tin máy thành công!' : 'Đã thêm máy mới vào kho!',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false); 
                fetchPhones();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Thất bại!',
                    text: 'Có lỗi xảy ra (có thể trùng mã Serial), vui lòng kiểm tra lại!',
                    buttonsStyling: false,
                    customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi hệ thống!',
                text: error.response?.data?.message || 'Không thể kết nối đến server.',
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }
    };

    const groupedBaseData = useMemo(() => {
        const result = {};
        
        const filteredByBrand = phones.filter(p => {
            if (p.status === 'sold') return false; 
            
            const brandName = p.phoneModelId?.brand?.name || p.phoneModelId?.brand || 'Hãng khác';
            if (selectedBrandFilter && brandName !== selectedBrandFilter) return false;
            
            return true;
        });

        filteredByBrand.forEach(phone => {
            const modelName = phone.phoneModelId?.name || 'Model không xác định';
            if (!result[modelName]) result[modelName] = [];
            result[modelName].push(phone);
        });
        
        return result;
    }, [phones, selectedBrandFilter]);

    const filteredGroups = useMemo(() => {
        const entries = Object.entries(groupedBaseData);
        if (!searchKeyword) return entries;
        const safeKeyword = searchKeyword.toLowerCase();
        return entries.filter(([modelName, _]) => modelName.toLowerCase().includes(safeKeyword));
    }, [groupedBaseData, searchKeyword]);

    const paginatedGroups = useMemo(() => {
        const totalGroups = filteredGroups.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        const startIndex = (currentPage - 1) * groupsPerPage;
        const endIndex = startIndex + groupsPerPage;
        const currentGroups = filteredGroups.slice(startIndex, endIndex);

        let totalItemsCount = 0;
        filteredGroups.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount };
    }, [filteredGroups, currentPage, groupsPerPage]);

    const detailItemsProcessed = useMemo(() => {
        if (!selectedGroupModel) return { items: [], totalPages: 1, totalCount: 0 };
        
        let list = groupedBaseData[selectedGroupModel] || [];

        if (detailSearch) {
            const keyword = detailSearch.toLowerCase();
            list = list.filter(item => 
                (item.phoneModelId?.name || '').toLowerCase().includes(keyword) || 
                (item.serialCode || '').toLowerCase().includes(keyword)
            );
        }

        if (detailSortPrice === 'asc') {
            list = [...list].sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
        } else if (detailSortPrice === 'desc') {
            list = [...list].sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
        }

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const startIndex = (detailCurrentPage - 1) * detailItemsPerPage;
        const paginatedList = list.slice(startIndex, startIndex + detailItemsPerPage);

        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedBaseData, selectedGroupModel, detailSearch, detailSortPrice, detailCurrentPage]);

    const openDetailModal = (modelName) => {
        setSelectedGroupModel(modelName);
        setDetailSearch('');
        setDetailSortPrice('');
        setDetailCurrentPage(1);
        setShowDetailModal(true);
    };

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Smartphone className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho Điện Thoại</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select value={selectedStoreFilter} onChange={(e) => setSelectedStoreFilter(e.target.value)} className="appearance-none border border-gray-300 bg-white text-sm font-bold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                            {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">
                        <Plus size={20} /><span>Nhập Máy</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative min-w-[250px]">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select value={selectedBrandFilter} onChange={(e) => setSelectedBrandFilter(e.target.value)} className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                        <option value="">Tất cả Hãng (Brands)</option>
                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder="Tìm theo tên dòng máy (Ví dụ: Iphone 13)..." 
                        value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm" 
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {loading ? (
                    <div className="flex justify-center items-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                ) : paginatedGroups.groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy dòng máy nào phù hợp.</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-[50%]">Dòng Máy (Model)</th>
                                    <th className="px-6 py-4 font-semibold text-center w-[25%]">Số lượng trong kho</th>
                                    <th className="px-6 py-4 font-semibold text-center w-[25%]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedGroups.groups.map(([modelName, phonesList]) => {
                                    const inStockCount = phonesList.filter(p => p.status === 'in_stock').length;
                                    return (
                                        <tr key={modelName} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    <Smartphone size={20} />
                                                </div>
                                                {modelName}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {inStockCount} Sẵn sàng
                                                </span>
                                                <span className="text-gray-400 text-xs ml-2 font-medium">/ {phonesList.length} Tổng</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => openDetailModal(modelName)} 
                                                    className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200"
                                                >
                                                    <Eye size={18} /> <span className="font-semibold text-sm">Xem chi tiết</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && paginatedGroups.totalItemsCount > 0 && (
                <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Đang xem trang <strong className="text-blue-600">{currentPage}</strong> / {paginatedGroups.totalPages}</span>
                        <span className="text-gray-300">|</span>
                        <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedGroups.totalItemsCount}</strong> chiếc</span>
                    </div>
                    <CustomPagination 
                        currentPage={currentPage} 
                        totalPages={paginatedGroups.totalPages} 
                        onPageChange={setCurrentPage} 
                    />
                </div>
            )}

         
            {showDetailModal && selectedGroupModel && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                        
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                <Smartphone className="text-blue-600" /> Chi tiết kho: {selectedGroupModel}
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 shadow-sm transition"><X size={24}/></button>
                        </div>
                        
                       
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Tìm theo Mã Serial Code..." 
                                    value={detailSearch} onChange={e => setDetailSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="relative min-w-[200px]">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select 
                                    value={detailSortPrice} onChange={e => setDetailSortPrice(e.target.value)} 
                                    className="appearance-none w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                                >
                                    <option value="">Sắp xếp Giá Bán</option>
                                    <option value="asc">Giá bán: Thấp đến Cao</option>
                                    <option value="desc">Giá bán: Cao đến Thấp</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                       
                        <div className="p-0 overflow-auto flex-1 bg-white">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[11px] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-[25%]">Ảnh & Serial</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[8%]">QR</th>
                                        <th className="px-4 py-3 font-semibold w-[22%]">Màu / ROM / Hình thức</th>
                                        <th className="px-4 py-3 font-semibold w-[18%]">Giá vốn / Bán</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[17%]">Trạng thái</th>
                                        <th className="px-4 py-3 font-semibold text-right w-[10%]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailItemsProcessed.items.map(phone => (
                                        <tr key={phone._id} className="hover:bg-blue-50/40 transition">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded border border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                        {phone.specificImages?.length > 0 ? <img src={phone.specificImages[0]} alt="img" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-300"/>}
                                                    </div>
                                                    <div className="truncate">
                                                        <div className="font-bold text-gray-800 text-sm truncate" title={phone.phoneModelId?.name}>{phone.phoneModelId?.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border truncate max-w-full">{phone.serialCode}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => handleGenerateQR(phone._id, phone.serialCode)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition inline-flex justify-center" title="In mã QR">
                                                    <QrCode size={18} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-600 truncate">
                                                <div className="mb-1.5">
                                                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">{phone.grade}</span>
                                                </div>
                                                <div className="flex gap-2 truncate">
                                                    <span>Màu: <strong>{phone.colorName}</strong></span>
                                                    <span>ROM: <strong>{phone.capacity}</strong></span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 truncate">
                                                <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{formatMoney(phone.importPrice)}</div>
                                                <div className="font-bold text-red-600 truncate text-sm">{formatMoney(phone.sellingPrice)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center truncate">
                                                <div className="truncate">
                                                    {phone.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold inline-block">Sẵn sàng</span> : 
                                                     phone.status === 'waiting_for_tech_decision' ? <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold inline-block">Đang xử lý</span> :
                                                     phone.status === 'reserved' ? <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold inline-block">Đặt trước</span> :
                                                     <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold inline-block">{phone.status}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(phone)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition border border-transparent hover:border-blue-200"><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(phone._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition border border-transparent hover:border-red-200"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {detailItemsProcessed.items.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-gray-500 italic">Không tìm thấy máy nào khớp với bộ lọc.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

        
                        {detailItemsProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailCurrentPage}</strong> / {detailItemsProcessed.totalPages} (Tổng: {detailItemsProcessed.totalCount} máy)</span>
                                <CustomPagination 
                                    currentPage={detailCurrentPage} 
                                    totalPages={detailItemsProcessed.totalPages} 
                                    onPageChange={setDetailCurrentPage} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Cập nhật Thông tin Máy' : 'Nhập Máy Mới Vào Kho'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={24} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-1.5">Chọn Hãng sản xuất <span className="text-red-500">*</span></label>
                                        <select 
                                            value={selectedFormBrand} 
                                            onChange={(e) => {
                                                setSelectedFormBrand(e.target.value);
                                                setFormData({...formData, phoneModelId: ''}); 
                                            }} 
                                            className="w-full border border-blue-200 bg-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Chọn Hãng --</option>
                                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-blue-800 mb-1.5">Chọn Dòng máy (Model) <span className="text-red-500">*</span></label>
                                        <select 
                                            value={formData.phoneModelId} 
                                            onChange={e => setFormData({...formData, phoneModelId: e.target.value})} 
                                            required 
                                            disabled={!selectedFormBrand}
                                            className="w-full border border-blue-200 bg-white p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">-- Chọn Model --</option>
                                            {filteredModelsForForm.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Cửa hàng chứa máy <span className="text-red-500">*</span></label>
                                    <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="">-- Chọn Cửa Hàng --</option>
                                        {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Serial Code <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.serialCode} onChange={e => setFormData({...formData, serialCode: e.target.value.toUpperCase()})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 font-mono" placeholder="Nhập hoặc tạo tự động"/>
                                        <button type="button" onClick={handleGenerateSerial} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 font-bold rounded-xl hover:bg-blue-100 transition whitespace-nowrap">Tạo mã</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Dung lượng (ROM) <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" placeholder="Chỉ cần nhập số, VD: 128 hoặc 256"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Màu sắc <span className="text-red-500">*</span></label>
                                        <input type="text" value={formData.colorName} onChange={e => setFormData({...formData, colorName: e.target.value})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" placeholder="VD: Titan Tự Nhiên"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình thức <span className="text-red-500">*</span></label>
                                        <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                            {['Mới', 'Đã kích hoạt', 'Cũ Đẹp', 'Trầy Xước', 'Xước Cấn'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình ảnh thực tế của máy (Chụp tình trạng xước xát nếu có)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[100px]">
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {formData.previewImages?.length > 0 ? formData.previewImages.map((src, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={src} alt="preview" className="h-20 w-20 object-cover rounded-md shadow-sm border border-gray-200" />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )) : null}
                                            
                                            <label className="h-20 w-20 border-2 border-dashed border-blue-300 rounded-md flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 cursor-pointer transition shadow-sm bg-white">
                                                <Plus size={24} />
                                                <span className="text-[10px] mt-1 font-semibold">Thêm ảnh</span>
                                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">Hỗ trợ tải lên nhiều ảnh (Dưới 10MB/ảnh)</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nguồn gốc</label>
                                    <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="supplier">Nhập từ nhà cung cấp</option>
                                        <option value="customer_trade_in">Khách thu cũ đổi mới</option>
                                        <option value="assembled">Máy tự ráp</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Trạng thái máy <span className="text-red-500">*</span></label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500">
                                        <option value="in_stock">Sẵn sàng (Trong kho)</option>
                                        <option value="reserved">Đang giữ (Đặt trước)</option>
                                        <option value="waiting_for_tech_decision">Đang chờ xử lý</option>
                                        <option value="defective">Hàng lỗi / Hỏng</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá vốn (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="text" value={formatPriceInput(formData.importPrice)} onChange={e => setFormData({...formData, importPrice: parsePriceInput(e.target.value)})} required className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500 font-medium" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="text" value={formatPriceInput(formData.sellingPrice)} onChange={e => setFormData({...formData, sellingPrice: parsePriceInput(e.target.value)})} required className="w-full border-2 border-red-200 bg-red-50 p-2.5 rounded-xl outline-none focus:border-red-500 font-bold text-red-700" />
                                </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Bảo hành (Tháng)</label>
                                        <input type="number" value={formData.warrantyPeriod} onChange={e => setFormData({...formData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-200 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold border border-gray-300 rounded-xl hover:bg-gray-100 transition">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition">{isEditing ? 'Lưu Cập Nhật' : 'Nhập Vào Kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}