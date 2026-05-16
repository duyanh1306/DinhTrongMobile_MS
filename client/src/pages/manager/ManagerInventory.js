import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify"; 
import { Plus, Edit, Trash2, Package, Search, X, Settings, ChevronDown, Tag, QrCode, Smartphone, Eye, ArrowUpDown, Image as ImageIcon } from "lucide-react";
import Swal from 'sweetalert2';

import { 
    fetchItemTypesApi, fetchModelsApi, fetchItemsApi, fetchPhonesApi, 
    deleteItemApi, deletePhoneApi, submitItemApi, submitPhoneApi, getQrBlobApi 
} from "../../api/manager/inventory";

const BASE_CODES = {
    "MB": "Mainboard", "SCR": "Màn hình", "BAT": "Pin", "HSG": "Vỏ máy",
    "CAM-R": "Camera Sau", "CAM-F": "Camera Trước", "CPT": "Cụm chân sạc",
    "SPK": "Loa ngoài", "FGL": "Mặt kính", "BGL": "Kính lưng", "OTH": "Khác"
};

const getBaseCodeFromItemTypeCode = (code) => {
    if (!code) return 'OTH';
    const parts = code.split('-');
    if (parts[0] === 'CAM') return `CAM-${parts[1]}`;
    if (BASE_CODES[parts[0]]) return parts[0];
    if (BASE_CODES[code]) return code;
    return 'OTH';
};

const initialItemFormState = {
    name: '', serialCode: '', item_type: '', status: 'in_stock', storeId: '',
    origin: 'new', sourceDevice: '', quality: '', warrantyPeriod: 12, baseCost: '', price: '',
    ram: '', capacity: '', color: ''
};

const initialPhoneFormState = {
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
export default function ManagerInventory() {
    const [activeTab, setActiveTab] = useState('items');
    const [user, setUser] = useState({});
    const [userStore, setUserStore] = useState(null);
    const groupsPerPage = 10; 
    
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [itemLoading, setItemLoading] = useState(true);
    const [itemFilters, setItemFilters] = useState({ search: '', status: '', item_type: '' });
    const [itemCurrentPage, setItemCurrentPage] = useState(1);
    const [selectedBaseFilter, setSelectedBaseFilter] = useState(''); 
    
    const [showItemModal, setShowItemModal] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemFormData, setItemFormData] = useState(initialItemFormState);
    const [selectedBaseCategory, setSelectedBaseCategory] = useState('');

    const [showItemDetailModal, setShowItemDetailModal] = useState(false);
    const [selectedItemTypeGroup, setSelectedItemTypeGroup] = useState(null);
    const [detailItemSearch, setDetailItemSearch] = useState('');
    const [detailItemSortPrice, setDetailItemSortPrice] = useState(''); 
    const [detailItemCurrentPage, setDetailItemCurrentPage] = useState(1);
    
  
    const [phones, setPhones] = useState([]);
    const [models, setModels] = useState([]);
    const [phoneLoading, setPhoneLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [phoneCurrentPage, setPhoneCurrentPage] = useState(1);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState(''); 

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneFormData, setPhoneFormData] = useState(initialPhoneFormState);
    const [editingPhoneId, setEditingPhoneId] = useState(null);
    const [selectedFormBrand, setSelectedFormBrand] = useState('');

    const [showPhoneDetailModal, setShowPhoneDetailModal] = useState(false);
    const [selectedPhoneModelGroup, setSelectedPhoneModelGroup] = useState(null);
    const [detailPhoneSearch, setDetailPhoneSearch] = useState('');
    const [detailPhoneSortPrice, setDetailPhoneSortPrice] = useState(''); 
    const [detailPhoneCurrentPage, setDetailPhoneCurrentPage] = useState(1);

    const detailItemsPerPage = 5; 

 
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        if (userData.storeId) {
            const storeIdValue = userData.storeId._id || userData.storeId;
            setUserStore({
                id: storeIdValue,
                name: userData.storeName || "Cửa hàng của bạn"
            });
            setItemFormData(prev => ({ ...prev, storeId: storeIdValue }));
            setPhoneFormData(prev => ({ ...prev, storeId: storeIdValue }));
        }
    }, []);

    useEffect(() => {
        if (userStore) {
            loadInitData();
            loadItems();
            loadPhones();
        }
    }, [userStore, itemFilters.status, itemFilters.item_type]);

    useEffect(() => {
        const timeout = setTimeout(() => { 
            setItemCurrentPage(1);
            if (userStore) loadItems(); 
        }, 500);
        return () => clearTimeout(timeout);
    }, [itemFilters.search, userStore]);

    useEffect(() => { setPhoneCurrentPage(1); }, [searchKeyword, selectedBrandFilter]); 
    useEffect(() => { setItemCurrentPage(1); }, [selectedBaseFilter]); 
    useEffect(() => { setDetailItemCurrentPage(1); }, [detailItemSearch, detailItemSortPrice]);
    useEffect(() => { setDetailPhoneCurrentPage(1); }, [detailPhoneSearch, detailPhoneSortPrice]);

 
    const loadInitData = async () => {
        const types = await fetchItemTypesApi();
        const modelsData = await fetchModelsApi();
        setItemTypes(types);
        setModels(modelsData);
    };

    const loadItems = async () => {
        setItemLoading(true);
        const data = await fetchItemsApi({
            limit: 9999,
            search: itemFilters.search, status: itemFilters.status, 
            item_type: itemFilters.item_type, 
            storeId: userStore?.id 
        });
        if (data) setItems(data.data || []);
        setItemLoading(false);
    };

    const loadPhones = async () => {
        setPhoneLoading(true);
        const data = await fetchPhonesApi(userStore?.id); 
        setPhones(data);
        setPhoneLoading(false);
    };


    const handleDeleteItem = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?', text: "Hành động này không thể hoàn tác!", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy', buttonsStyling: false, 
            customClass: {
                confirmButton: 'bg-red-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-600 transition ml-3 shadow-md',
                cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition shadow-md'
            }
        });
        if (result.isConfirmed) {
            const success = await deleteItemApi(id);
            if (success) {
                Swal.fire({ title: 'Thành công!', text: 'Linh kiện đã được xóa.', icon: 'success', timer: 1500, showConfirmButton: false });
                loadItems();
            }
        }
    };

    const handleDeletePhone = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?', text: "Máy sẽ bị xóa khỏi kho và không thể hoàn tác!", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy bỏ', buttonsStyling: false,
            customClass: {
                confirmButton: 'bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 ml-3 shadow-sm',
                cancelButton: 'bg-gray-500 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-600 shadow-sm'
            }
        });
        if (result.isConfirmed) {
            const success = await deletePhoneApi(id);
            if (success) {
                Swal.fire({ title: 'Đã xóa!', text: 'Máy đã được xóa khỏi hệ thống.', icon: 'success', timer: 1500, showConfirmButton: false }); 
                loadPhones(); 
            }
        }
    };

    const handlePrintQR = async (type, id, serialCode) => {
        const blob = await getQrBlobApi(type, id);
        if (!blob) return;

        const qrUrl = window.URL.createObjectURL(blob);
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
        iframe.setAttribute("aria-hidden", "true");
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(qrUrl);
            toast.error("Không thể khởi tạo chế độ in.");
            return;
        }

        iframeDoc.open();
        iframeDoc.write(`
          <!doctype html>
          <html>
            <head>
              <style>
                @page { margin: 0; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; }
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .qr-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }
                img { width: 180px; height: 180px; object-fit: contain; }
                .serial-code { font-family: monospace; font-size: 14px; font-weight: bold; color: #000; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <img id="qr-print-image" src="${qrUrl}" alt="QR code" />
                <div class="serial-code">${serialCode}</div>
              </div>
            </body>
          </html>
        `);
        iframeDoc.close();

        const img = iframeDoc.getElementById("qr-print-image");
        if (img) {
            img.onload = () => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    window.URL.revokeObjectURL(qrUrl);
                    if (document.body.contains(iframe)) document.body.removeChild(iframe);
                }, 500);
            };
        }
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
      
        const result = await submitItemApi(isEditingItem, editingItemId, itemFormData);
        
        if (result.success) {
            setShowItemModal(false);
            Swal.fire({ title: 'Thành công!', text: 'Lưu linh kiện thành công.', icon: 'success', timer: 1500, showConfirmButton: false });
            loadItems();
        } else {
         
            Swal.fire({ 
                icon: 'error', 
                title: 'Lỗi thao tác', 
                text: result.message, 
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        const submitData = new FormData();
        submitData.append("serialCode", phoneFormData.serialCode); submitData.append("phoneModelId", phoneFormData.phoneModelId);
        submitData.append("storeId", phoneFormData.storeId); submitData.append("colorName", phoneFormData.colorName);
        
        let finalCapacity = phoneFormData.capacity.trim().toUpperCase();
        if (finalCapacity && !finalCapacity.includes('GB') && !finalCapacity.includes('TB')) finalCapacity += 'GB';
        
        submitData.append("capacity", finalCapacity); submitData.append("grade", phoneFormData.grade);
        submitData.append("status", phoneFormData.status); submitData.append("importPrice", phoneFormData.importPrice);
        submitData.append("sellingPrice", phoneFormData.sellingPrice); submitData.append("warrantyPeriod", phoneFormData.warrantyPeriod);
        submitData.append("source", phoneFormData.source); submitData.append("notes", phoneFormData.notes);
        
        if (isEditingPhone && phoneFormData.retainedImages?.length > 0) submitData.append("retainedImages", JSON.stringify(phoneFormData.retainedImages));
        if (phoneFormData.imageFiles?.length > 0) phoneFormData.imageFiles.forEach(file => submitData.append("images", file));

      
        const result = await submitPhoneApi(isEditingPhone, editingPhoneId, submitData);
        
        if (result.success) {
            setShowPhoneModal(false);
            Swal.fire({ title: 'Thành công!', text: 'Lưu điện thoại thành công.', icon: 'success', timer: 1500, showConfirmButton: false });
            loadPhones();
        } else {
        
            Swal.fire({ 
                icon: 'error', 
                title: 'Lỗi thao tác', 
                text: result.message, 
                buttonsStyling: false,
                customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }
            });
        }
    };


    const handleOpenItemModal = (item = null) => {
        if (item) {
            setIsEditingItem(true); setEditingItemId(item._id);
            const typeObj = itemTypes.find(t => t._id === (item.item_type?._id || item.item_type));
            if (typeObj) setSelectedBaseCategory(getBaseCodeFromItemTypeCode(typeObj.code));
            else setSelectedBaseCategory('');

            setItemFormData({
                name: item.name || '', serialCode: item.serialCode || '', item_type: item.item_type?._id || '',
                status: item.status || 'in_stock', storeId: userStore?.id, origin: item.origin || 'new', sourceDevice: item.sourceDevice || '', 
                quality: item.quality || '', warrantyPeriod: item.warrantyPeriod || (item.origin === 'new' ? 12 : 3),
                baseCost: item.baseCost || '', price: item.price || '', ram: item.ram || '', capacity: item.capacity || '', color: item.color || ''
            });
        } else {
            setIsEditingItem(false); setEditingItemId(null);
            setSelectedBaseCategory('');
            setItemFormData({ ...initialItemFormState, storeId: userStore?.id });
        }
        setShowItemModal(true);
    };

    const handleOpenPhoneModal = (phone = null) => {
        if (phone) {
            setIsEditingPhone(true); setEditingPhoneId(phone._id);
            const modelObj = models.find(m => m._id === (phone.phoneModelId?._id || phone.phoneModelId));
            if (modelObj) setSelectedFormBrand(modelObj.brand?.name || modelObj.brand || 'Hãng khác');
            else setSelectedFormBrand('');

            setPhoneFormData({
                serialCode: phone.serialCode || '', phoneModelId: phone.phoneModelId?._id || phone.phoneModelId,
                storeId: userStore?.id, colorName: phone.colorName || '', capacity: phone.capacity || '', grade: phone.grade || 'Mới',
                status: phone.status || 'in_stock', importPrice: phone.importPrice || 0, sellingPrice: phone.sellingPrice || 0,
                warrantyPeriod: phone.warrantyPeriod || 12, source: phone.source || 'supplier', notes: phone.notes || '',
                imageFiles: [], previewImages: phone.specificImages || [], retainedImages: phone.specificImages || []
            });
        } else {
            setIsEditingPhone(false); setEditingPhoneId(null);
            setSelectedFormBrand('');
            setPhoneFormData({ ...initialPhoneFormState, storeId: userStore?.id });
        }
        setShowPhoneModal(true);
    };

    const handleGenerateItemSerial = () => {
        if (!itemFormData.item_type) return Swal.fire({icon: 'warning', title: 'Thiếu thông tin!', text: 'Vui lòng chọn Phân loại linh kiện trước!'});
        const selectedType = itemTypes.find(t => t._id === itemFormData.item_type);
        if (!selectedType) return;
        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(2)}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setItemFormData({ ...itemFormData, serialCode: `${selectedType.code}-${ddmmyyyy}-${randomStr}` });
    };

    const handleGeneratePhoneSerial = () => {
        if (!phoneFormData.phoneModelId) return Swal.fire({icon: 'warning', title: 'Thiếu thông tin!', text: 'Vui lòng chọn Dòng máy trước!'});
        const selectedModel = models.find(m => m._id === phoneFormData.phoneModelId);
        if (!selectedModel) return;

        let prefix = selectedModel.name.toUpperCase().replace(/\s+/g, '');
        prefix = prefix.replace('IPHONE', 'IP').replace('SAMSUNGGALAXY', 'SS').replace('XIAOMI', 'MI');
        if (prefix.length > 8) prefix = prefix.substring(0, 8);

        const date = new Date();
        const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setPhoneFormData({ ...phoneFormData, serialCode: `${prefix}-${ddmmyyyy}-${randomStr}` });
    };


    const handlePhoneFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const existingFileNames = phoneFormData.imageFiles.map(f => f.name);
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

            const currentTotalImages = phoneFormData.previewImages.length;
            const newTotalImages = currentTotalImages + validFiles.length;
    
            if (newTotalImages > 5) {
                Swal.fire({ icon: 'warning', title: 'Vượt quá giới hạn!', text: `Tối đa 5 ảnh. Bạn đang có ${currentTotalImages} ảnh. Vui lòng chọn thêm tối đa ${5 - currentTotalImages} ảnh.`, buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm' }});
                e.target.value = null;
                return; 
            }
            if (hasDuplicateFile) {
                Swal.fire({ icon: 'info', title: 'Bỏ qua ảnh trùng!', text: 'Vài ảnh bị bỏ qua do trùng lặp.', buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold' }});
            } else if (hasOversizedFile) { 
                Swal.fire({ icon: 'error', title: 'Ảnh quá lớn!', text: 'Ảnh > 10MB đã bị loại bỏ.', buttonsStyling: false, customClass: { confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold' }});
            }
            
            if (validFiles.length > 0) {
                const newPreviews = validFiles.map(file => URL.createObjectURL(file));
                setPhoneFormData(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...validFiles], previewImages: [...prev.previewImages, ...newPreviews] }));
            }
            
            e.target.value = null; 
        }
    };
    
    const handleRemovePhoneImage = (indexToRemove) => {
        setPhoneFormData(prev => {
            const newPreviewImages = [...prev.previewImages];
            const removedSrc = newPreviewImages.splice(indexToRemove, 1)[0];
            let newRetainedImages = [...(prev.retainedImages || [])];
            let newImageFiles = [...prev.imageFiles];
            if (removedSrc.startsWith('blob:')) {
                const fileIndex = indexToRemove - newRetainedImages.length;
                if (fileIndex >= 0) newImageFiles.splice(fileIndex, 1);
            } else {
                newRetainedImages = newRetainedImages.filter(img => img !== removedSrc);
            }
            return { ...prev, previewImages: newPreviewImages, imageFiles: newImageFiles, retainedImages: newRetainedImages };
        });
    };


    const filteredItemTypesForModal = useMemo(() => {
        if (!selectedBaseCategory) return []; 
        return itemTypes.filter(t => getBaseCodeFromItemTypeCode(t.code) === selectedBaseCategory);
    }, [itemTypes, selectedBaseCategory]);

    const groupedItemData = useMemo(() => {
        const result = {};
        items.forEach(item => {
            if (item.status === 'sold' || item.status === 'assembled_and_sold' || item.status === 'consumed') return;
            
    
            const typeCode = item.item_type?.code || 'OTH';
            const base = getBaseCodeFromItemTypeCode(typeCode);
            if (selectedBaseFilter && base !== selectedBaseFilter) return;

            const typeName = item.item_type?.name || 'Loại không xác định';
            if (!result[typeName]) result[typeName] = [];
            result[typeName].push(item);
        });
        return Object.entries(result);
    }, [items, selectedBaseFilter]);

    const paginatedItemGroups = useMemo(() => {
        const totalGroups = groupedItemData.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        const startIndex = (itemCurrentPage - 1) * groupsPerPage;
        const currentGroups = groupedItemData.slice(startIndex, startIndex + groupsPerPage);

        let totalItemsCount = 0;
        groupedItemData.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount };
    }, [groupedItemData, itemCurrentPage, groupsPerPage]);

    const detailItemsProcessed = useMemo(() => {
        if (!selectedItemTypeGroup) return { items: [], totalPages: 1, totalCount: 0 };
        const foundGroup = groupedItemData.find(([name]) => name === selectedItemTypeGroup);
        let list = foundGroup ? foundGroup[1] : [];

        if (detailItemSearch) {
            const keyword = detailItemSearch.toLowerCase();
            list = list.filter(item => (item.name || '').toLowerCase().includes(keyword) || (item.serialCode || '').toLowerCase().includes(keyword));
        }
        if (detailItemSortPrice === 'asc') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (detailItemSortPrice === 'desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const paginatedList = list.slice((detailItemCurrentPage - 1) * detailItemsPerPage, detailItemCurrentPage * detailItemsPerPage);
        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedItemData, selectedItemTypeGroup, detailItemSearch, detailItemSortPrice, detailItemCurrentPage]);

    const openItemDetailModal = (typeName) => {
        setSelectedItemTypeGroup(typeName); setDetailItemSearch(''); setDetailItemSortPrice(''); setDetailItemCurrentPage(1);
        setShowItemDetailModal(true);
    };

    const uniqueBrands = useMemo(() => {
        const brands = new Set();
        models.forEach(m => {
            if (m.brand?.name) brands.add(m.brand.name);
            else if (typeof m.brand === 'string') brands.add(m.brand);
        });
        return Array.from(brands);
    }, [models]);

    const filteredModelsForForm = useMemo(() => {
        if (!selectedFormBrand) return [];
        return models.filter(m => {
            const brandName = m.brand?.name || m.brand || 'Hãng khác';
            return brandName === selectedFormBrand;
        });
    }, [models, selectedFormBrand]);

    const groupedPhoneData = useMemo(() => {
        const result = {};
        const safeKeyword = searchKeyword.toLowerCase();
     
        const filtered = phones.filter(p => {
            if (p.status === 'sold') return false; 
            
            const brandName = p.phoneModelId?.brand?.name || p.phoneModelId?.brand || 'Hãng khác';
            if (selectedBrandFilter && brandName !== selectedBrandFilter) return false;

            const serialMatch = (p.serialCode || '').toLowerCase().includes(safeKeyword);
            const nameMatch = (p.phoneModelId?.name || '').toLowerCase().includes(safeKeyword);
            return serialMatch || nameMatch;
        });

        filtered.forEach(phone => {
            const modelName = phone.phoneModelId?.name || 'Model không xác định';
            if (!result[modelName]) result[modelName] = [];
            result[modelName].push(phone);
        });
        return Object.entries(result);
    }, [phones, searchKeyword, selectedBrandFilter]);

    const paginatedPhoneGroups = useMemo(() => {
        const totalGroups = groupedPhoneData.length;
        const totalPages = Math.ceil(totalGroups / groupsPerPage);
        const startIndex = (phoneCurrentPage - 1) * groupsPerPage;
        const currentGroups = groupedPhoneData.slice(startIndex, startIndex + groupsPerPage);

        let totalItemsCount = 0;
        groupedPhoneData.forEach(([_, list]) => { totalItemsCount += list.length });

        return { groups: currentGroups, totalPages: totalPages || 1, totalItemsCount };
    }, [groupedPhoneData, phoneCurrentPage, groupsPerPage]);

    const detailPhonesProcessed = useMemo(() => {
        if (!selectedPhoneModelGroup) return { items: [], totalPages: 1, totalCount: 0 };
        const foundGroup = groupedPhoneData.find(([name]) => name === selectedPhoneModelGroup);
        let list = foundGroup ? foundGroup[1] : [];

        if (detailPhoneSearch) {
            const keyword = detailPhoneSearch.toLowerCase();
            list = list.filter(item => (item.phoneModelId?.name || '').toLowerCase().includes(keyword) || (item.serialCode || '').toLowerCase().includes(keyword));
        }
        if (detailPhoneSortPrice === 'asc') list = [...list].sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
        else if (detailPhoneSortPrice === 'desc') list = [...list].sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));

        const totalPages = Math.ceil(list.length / detailItemsPerPage);
        const paginatedList = list.slice((detailPhoneCurrentPage - 1) * detailItemsPerPage, detailPhoneCurrentPage * detailItemsPerPage);
        return { items: paginatedList, totalPages: totalPages || 1, totalCount: list.length };
    }, [groupedPhoneData, selectedPhoneModelGroup, detailPhoneSearch, detailPhoneSortPrice, detailPhoneCurrentPage]);

    const openPhoneDetailModal = (modelName) => {
        setSelectedPhoneModelGroup(modelName); setDetailPhoneSearch(''); setDetailPhoneSortPrice(''); setDetailPhoneCurrentPage(1);
        setShowPhoneDetailModal(true);
    };

    const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);


    const selectedItemTypeObj = itemTypes.find(t => t._id === itemFormData.item_type);
    const selectedItemTypeName = selectedItemTypeObj ? selectedItemTypeObj.name.toLowerCase() : '';
    const isMainboard = selectedItemTypeName.includes('main');
    const isColorPart = selectedItemTypeName.includes('vỏ') || selectedItemTypeName.includes('kính') || selectedItemTypeName.includes('màn') || selectedItemTypeName.includes('camera') || selectedItemTypeName.includes('khay sim');


    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings className="text-blue-600" size={28} />
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Kho Cửa Hàng</h1>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('items')} className={`flex items-center space-x-2 px-6 py-3 font-medium transition ${activeTab === 'items' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Package size={20} /><span>Linh kiện</span>
                    </button>
                    <button onClick={() => setActiveTab('phones')} className={`flex items-center space-x-2 px-6 py-3 font-medium transition ${activeTab === 'phones' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Smartphone size={20} /><span>Điện thoại</span>
                    </button>
                </div>

          
                {activeTab === 'items' && (
                    <div className="p-6 flex flex-col h-[calc(100vh-200px)]">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h2 className="text-lg font-semibold text-gray-800">Kho Linh Kiện</h2>
                            <button onClick={() => handleOpenItemModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition">
                                <Plus size={20} /> <span>Nhập linh kiện mới</span>
                            </button>
                        </div>

                 
                        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center border border-gray-100 mb-6 shrink-0">
                            <div className="relative min-w-[250px] w-full md:w-auto">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <select value={selectedBaseFilter} onChange={(e) => setSelectedBaseFilter(e.target.value)} className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="">Tất cả loại linh kiện</option>
                                    {Object.entries(BASE_CODES).map(([code, label]) => (
                                        <option key={code} value={code}>{label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                            
                            <div className="relative flex-1 w-full min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Tìm theo tên nhóm (Ví dụ: Màn hình Iphone 13)..." 
                                    value={itemFilters.search} onChange={e => setItemFilters({...itemFilters, search: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div className="relative min-w-[200px] w-full md:w-auto">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select value={itemFilters.status} onChange={e => setItemFilters({...itemFilters, status: e.target.value})} className="appearance-none border border-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm outline-none focus:border-blue-500 bg-gray-50 w-full font-semibold cursor-pointer">
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="in_stock">Đang tồn kho</option>
                                    <option value="sold">Đã xuất (bán/ráp)</option>
                                    <option value="defective">Hàng lỗi</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pb-4">
                            {itemLoading ? (
                                <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                            ) : paginatedItemGroups.groups.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">Không tìm thấy nhóm linh kiện nào.</div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold w-[50%]">Loại Linh Kiện / Máy</th>
                                                <th className="px-6 py-4 font-semibold text-center w-[25%]">Số lượng trong kho</th>
                                                <th className="px-6 py-4 font-semibold text-center w-[25%]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedItemGroups.groups.map(([typeName, itemsList]) => {
                                                const inStockCount = itemsList.filter(i => i.status === 'in_stock').length;
                                                return (
                                                    <tr key={typeName} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Package size={20} /></div>
                                                            {typeName}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {inStockCount} Sẵn sàng
                                                            </span>
                                                            <span className="text-gray-400 text-xs ml-2 font-medium">/ {itemsList.length} Tổng</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => openItemDetailModal(typeName)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200">
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
                        {!itemLoading && paginatedItemGroups.totalItemsCount > 0 && (
                            <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span>Đang xem trang <strong className="text-blue-600">{itemCurrentPage}</strong> / {paginatedItemGroups.totalPages}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedItemGroups.totalItemsCount}</strong> linh kiện</span>
                                </div>
                                <CustomPagination currentPage={itemCurrentPage} totalPages={paginatedItemGroups.totalPages} onPageChange={setItemCurrentPage} />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'phones' && (
                    <div className="p-6 flex flex-col h-[calc(100vh-200px)]">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h2 className="text-lg font-semibold text-gray-800">Kho Điện Thoại</h2>
                            <button onClick={() => handleOpenPhoneModal()} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition">
                                <Plus size={20} /><span>Nhập Máy Mới</span>
                            </button>
                        </div>

                   
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col md:flex-row gap-4 mb-6 shrink-0">
                            <div className="relative min-w-[200px] w-full md:w-auto">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <select value={selectedBrandFilter} onChange={(e) => setSelectedBrandFilter(e.target.value)} className="w-full appearance-none border border-gray-200 bg-gray-50 text-sm font-semibold py-2.5 pl-9 pr-8 rounded-lg outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="">Tất cả Hãng (Brands)</option>
                                    {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                            <div className="relative flex-1 w-full min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Tìm theo tên dòng máy (Ví dụ: Iphone 13)..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-4">
                            {phoneLoading ? (
                                <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div></div>
                            ) : paginatedPhoneGroups.groups.length === 0 ? (
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
                                            {paginatedPhoneGroups.groups.map(([modelName, phonesList]) => {
                                                const inStockCount = phonesList.filter(p => p.status === 'in_stock').length;
                                                return (
                                                    <tr key={modelName} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3 text-base">
                                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Smartphone size={20} /></div>
                                                            {modelName}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${inStockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {inStockCount} Sẵn sàng
                                                            </span>
                                                            <span className="text-gray-400 text-xs ml-2 font-medium">/ {phonesList.length} Tổng</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => openPhoneDetailModal(modelName)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200">
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
                        {!phoneLoading && paginatedPhoneGroups.totalItemsCount > 0 && (
                            <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 mt-auto rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <span>Đang xem trang <strong className="text-blue-600">{phoneCurrentPage}</strong> / {paginatedPhoneGroups.totalPages}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Tổng tìm thấy: <strong className="text-gray-800">{paginatedPhoneGroups.totalItemsCount}</strong> chiếc</span>
                                </div>
                                <CustomPagination currentPage={phoneCurrentPage} totalPages={paginatedPhoneGroups.totalPages} onPageChange={setPhoneCurrentPage} />
                            </div>
                        )}
                    </div>
                )}
            </div>

     
            {showItemDetailModal && selectedItemTypeGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><Package className="text-blue-600" /> Chi tiết: {selectedItemTypeGroup}</h2>
                            <button onClick={() => setShowItemDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 transition"><X size={24}/></button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Tìm theo Tên hoặc mã Serial..." value={detailItemSearch} onChange={e => setDetailItemSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"/>
                            </div>
                            <div className="relative min-w-[200px]">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select value={detailItemSortPrice} onChange={e => setDetailItemSortPrice(e.target.value)} className="appearance-none w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
                                    <option value="">Sắp xếp Giá mặc định</option>
                                    <option value="asc">Giá: Thấp đến Cao</option>
                                    <option value="desc">Giá: Cao đến Thấp</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div className="p-0 overflow-auto flex-1 bg-white">
                            <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[11px] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-[30%]">Tên & Mã Serial</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[8%]">QR</th>
                                        <th className="px-4 py-3 font-semibold w-[22%]">Tình trạng / Thuộc tính</th>
                                        <th className="px-4 py-3 font-semibold w-[15%]">Giá vốn / Bán</th>
                                        <th className="px-4 py-3 font-semibold text-center w-[15%]">Trạng thái</th>
                                        <th className="px-4 py-3 font-semibold text-right w-[10%]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailItemsProcessed.items.map(item => (
                                        <tr key={item._id} className="hover:bg-blue-50/40 transition">
                                            <td className="px-4 py-4 truncate">
                                                <div className="font-bold text-gray-800 text-sm truncate" title={item.name}>{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border truncate max-w-full">{item.serialCode}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center"><button onClick={() => handlePrintQR('item', item._id, item.serialCode)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><QrCode size={18} /></button></td>
                                            <td className="px-4 py-4 text-xs text-gray-600 truncate">
                                                <div className="mb-1.5">{item.origin === 'disassembled' ? <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Bóc máy</span> : <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Hàng mới</span>}</div>
                                                {(item.ram || item.capacity || item.color) ? (<div className="flex gap-2 truncate">{item.ram && <span>RAM: <strong>{item.ram}</strong></span>}{item.capacity && <span>ROM: <strong>{item.capacity}</strong></span>}{item.color && <span>Màu: <strong>{item.color}</strong></span>}</div>) : <span className="text-gray-400 italic">Tiêu chuẩn</span>}
                                            </td>
                                            <td className="px-4 py-4 truncate">
                                                <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{formatMoney(item.baseCost)}</div>
                                                <div className="font-bold text-red-600 truncate text-sm">{formatMoney(item.price)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center truncate">
                                                {item.status === 'in_stock' ? <span className="text-green-600 font-bold text-xs">Sẵn sàng</span> : 
                                                 item.status === 'reserved' ? <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-xs font-bold inline-block">Đặt trước</span> :
                                                 <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold inline-block">{item.status}</span>}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenItemModal(item)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg border border-transparent hover:border-blue-200"><Edit size={16}/></button>
                                                    <button onClick={() => handleDeleteItem(item._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-200"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {detailItemsProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailItemCurrentPage}</strong> / {detailItemsProcessed.totalPages}</span>
                                <CustomPagination currentPage={detailItemCurrentPage} totalPages={detailItemsProcessed.totalPages} onPageChange={setDetailItemCurrentPage} />
                            </div>
                        )}
                    </div>
                </div>
            )}
          
            {showPhoneDetailModal && selectedPhoneModelGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2"><Smartphone className="text-blue-600" /> Chi tiết: {selectedPhoneModelGroup}</h2>
                            <button onClick={() => setShowPhoneDetailModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border border-gray-200 transition"><X size={24}/></button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-4 shrink-0">
                            <div className="relative flex-1 min-w-[250px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Tìm theo Mã Serial Code..." value={detailPhoneSearch} onChange={e => setDetailPhoneSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"/>
                            </div>
                            <div className="relative min-w-[200px]">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <select value={detailPhoneSortPrice} onChange={e => setDetailPhoneSortPrice(e.target.value)} className="appearance-none w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-blue-500 bg-white cursor-pointer">
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
                                    {detailPhonesProcessed.items.map(phone => (
                                        <tr key={phone._id} className="hover:bg-blue-50/40 transition">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded border border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                        {phone.specificImages?.length > 0 ? <img src={phone.specificImages[0]} alt="img" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-300"/>}
                                                    </div>
                                                    <div className="truncate">
                                                        <div className="font-bold text-gray-800 text-sm truncate">{phone.phoneModelId?.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block border truncate max-w-full">{phone.serialCode}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center"><button onClick={() => handlePrintQR('phone', phone._id, phone.serialCode)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded transition"><QrCode size={18} /></button></td>
                                            <td className="px-4 py-4 text-xs text-gray-600 truncate">
                                                <div className="mb-1.5"><span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">{phone.grade}</span></div>
                                                <div className="flex gap-2 truncate"><span>Màu: <strong>{phone.colorName}</strong></span><span>ROM: <strong>{phone.capacity}</strong></span></div>
                                            </td>
                                            <td className="px-4 py-4 truncate">
                                                <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{formatMoney(phone.importPrice)}</div>
                                                <div className="font-bold text-red-600 truncate text-sm">{formatMoney(phone.sellingPrice)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center truncate">
                                                {phone.status === 'in_stock' ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold inline-block">Sẵn sàng</span> : 
                                                phone.status === 'waiting_for_tech_decision' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold inline-block">Đang xử lý</span> :
                                                phone.status === 'reserved' ? <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-xs font-bold inline-block">Đặt trước</span> :
                                                phone.status === 'defective' ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold inline-block">Thiếu linh kiện</span> :
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold inline-block">{phone.status}</span>}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenPhoneModal(phone)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg border border-transparent hover:border-blue-200"><Edit size={16}/></button>
                                                    <button onClick={() => handleDeletePhone(phone._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-200"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {detailPhonesProcessed.totalCount > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                                <span className="text-sm text-gray-600">Trang <strong className="text-blue-600">{detailPhoneCurrentPage}</strong> / {detailPhonesProcessed.totalPages}</span>
                                <CustomPagination currentPage={detailPhoneCurrentPage} totalPages={detailPhonesProcessed.totalPages} onPageChange={setDetailPhoneCurrentPage} />
                            </div>
                        )}
                    </div>
                </div>
            )}

           
{showItemModal && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-800">{isEditingItem ? 'Sửa thông tin linh kiện' : 'Nhập linh kiện vào kho'}</h2>
                <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
            </div>

            <form onSubmit={handleItemSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  
                    <div className="space-y-5">
                        <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 uppercase text-sm tracking-wide">1. PHÂN LOẠI & THÔNG SỐ</h3>
                        <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-blue-900">Danh mục chính *</label>
                                <select value={selectedBaseCategory} onChange={(e) => { setSelectedBaseCategory(e.target.value); setItemFormData({...itemFormData, item_type: '', name: '', serialCode: ''}); }} className="w-full border border-blue-200 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- Chọn Danh mục (VD: Màn hình, Pin...) --</option>
                                    {Object.entries(BASE_CODES).map(([code, label]) => ( <option key={code} value={code}>{label}</option> ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-blue-900">Phân loại chi tiết *</label>
                                <select required value={itemFormData.item_type} onChange={e => { const typeObj = itemTypes.find(t => t._id === e.target.value); setItemFormData({...itemFormData, item_type: e.target.value, name: typeObj ? `${typeObj.name} ` : itemFormData.name}); }} className="w-full border border-blue-200 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" disabled={!selectedBaseCategory}>
                                    <option value="">-- Chọn Phân loại (VD: Màn hình IP14) --</option>
                                    {filteredItemTypesForModal.map(t => ( <option key={t._id} value={t._id}>{t.name}</option> ))}
                                </select>
                            </div>
                        </div>
                    </div>

                 
                    <div className="space-y-5">
                        <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 uppercase text-sm tracking-wide">2. NGUỒN GỐC & GIÁ BÁN</h3>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">Tình trạng linh kiện</label>
                            <div className="flex gap-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm"><input type="radio" name="origin" value="new" checked={itemFormData.origin === 'new'} onChange={e => setItemFormData({...itemFormData, origin: e.target.value, warrantyPeriod: 12})} /> Hàng Mới (New)</label>
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm"><input type="radio" name="origin" value="disassembled" checked={itemFormData.origin === 'disassembled'} onChange={e => setItemFormData({...itemFormData, origin: e.target.value, warrantyPeriod: 3})} /> Bóc Máy (Zin)</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Giá nhập (VNĐ)</label>
                                <input type="text" value={formatPriceInput(itemFormData.baseCost)} onChange={e => setItemFormData({...itemFormData, baseCost: parsePriceInput(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-red-600">Giá bán ra (VNĐ) *</label>
                                <input type="text" value={formatPriceInput(itemFormData.price)} onChange={e => setItemFormData({...itemFormData, price: parsePriceInput(e.target.value)})} className="w-full border-2 border-red-200 bg-red-50 p-2.5 rounded-lg font-bold text-red-700 outline-none focus:border-red-500" placeholder="0" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">Thời gian Bảo hành (Tháng)</label>
                            <input type="number" value={itemFormData.warrantyPeriod} onChange={e => setItemFormData({...itemFormData, warrantyPeriod: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

             
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-5">
                    <h3 className="font-bold text-blue-800 border-b border-blue-100 pb-2 uppercase text-sm tracking-wide">3. THÔNG TIN HIỂN THỊ & QUẢN LÝ VỊ TRÍ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">Tên linh kiện hiển thị *</label>
                            <input required type="text" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} className="w-full h-[46px] border border-gray-300 px-3 rounded-lg font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: Mainboard iPhone 13 Zin..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">Trạng thái tồn kho</label>
                            <select value={itemFormData.status} onChange={e => setItemFormData({...itemFormData, status: e.target.value})} className="w-full h-[46px] border border-gray-300 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                <option value="in_stock">Trong kho (Sẵn sàng bán/ráp)</option>
                                <option value="sold">Đã xuất (Đã bán/Lắp ráp xong)</option>
                                <option value="defective">Hàng lỗi / Bảo hành</option>
                            </select>
                        </div>
                        
                     
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">Kho nhận <span className="text-red-500">*</span></label>
                            <input type="text" value={userStore ? userStore.name : "Đang tải..."} readOnly className="w-full h-[46px] border border-gray-300 px-3 rounded-lg bg-gray-100 text-gray-700 font-bold cursor-not-allowed outline-none shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mã Serial / Định danh *</label>
                            <div className="flex gap-2 h-[46px]">
                                <input required type="text" value={itemFormData.serialCode} onChange={e => setItemFormData({...itemFormData, serialCode: e.target.value})} className="w-full border border-gray-300 px-3 rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-500 h-full" placeholder="Nhập mã hoặc tạo tự động" />
                                <button type="button" onClick={handleGenerateItemSerial} className="px-4 h-full bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition shadow-sm whitespace-nowrap">Tạo mã</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6 p-5 rounded-b-2xl">
                    <button type="button" onClick={() => setShowItemModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 font-bold rounded-xl hover:bg-gray-100 text-gray-700 transition shadow-sm">Hủy bỏ</button>
                    <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition">{isEditingItem ? 'Lưu Cập Nhật' : 'Thêm Vào Kho'}</button>
                </div>
            </form>
        </div>
    </div>
)}

        
{showPhoneModal && (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between p-5 border-b bg-gray-50 shrink-0">
                <h2 className="text-xl font-bold text-gray-800">{isEditingPhone ? 'Cập nhật Thông tin Máy' : 'Nhập Máy Mới Vào Kho'}</h2>
                <button onClick={() => setShowPhoneModal(false)} className="text-gray-400 hover:text-red-500 transition bg-white p-1 rounded-full"><X size={24} /></button>
            </div>
            
            <form onSubmit={handlePhoneSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-blue-50/30 p-5 rounded-xl border border-blue-100">
                    <div>
                        <label className="block text-sm font-bold text-blue-800 mb-1.5">Hãng sản xuất <span className="text-red-500">*</span></label>
                        <select value={selectedFormBrand} onChange={(e) => { setSelectedFormBrand(e.target.value); setPhoneFormData({...phoneFormData, phoneModelId: ''}); }} className="w-full h-[46px] border border-blue-200 bg-white px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">-- Chọn Hãng --</option>
                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-blue-800 mb-1.5">Dòng máy (Model) <span className="text-red-500">*</span></label>
                        <select required value={phoneFormData.phoneModelId} onChange={e => setPhoneFormData({...phoneFormData, phoneModelId: e.target.value})} disabled={!selectedFormBrand} className="w-full h-[46px] border border-blue-200 bg-white px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                            <option value="">-- Chọn Model --</option>
                            {filteredModelsForForm.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Kho nhận <span className="text-red-500">*</span></label>
                        <input type="text" value={userStore ? userStore.name : "Đang tải..."} readOnly className="w-full h-[46px] border border-gray-300 px-3 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-not-allowed outline-none shadow-inner" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Serial Code <span className="text-red-500">*</span></label>
                        <div className="flex gap-2 h-[46px]">
                            <input type="text" value={phoneFormData.serialCode} onChange={e => setPhoneFormData({...phoneFormData, serialCode: e.target.value.toUpperCase()})} required className="w-full border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono h-full" placeholder="Nhập hoặc tạo tự động" />
                            <button type="button" onClick={handleGeneratePhoneSerial} className="px-4 h-full bg-blue-50 text-blue-600 border border-blue-200 font-bold rounded-xl hover:bg-blue-100 transition shadow-sm whitespace-nowrap">Tạo mã</button>
                        </div>
                    </div>
                </div>

          
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Dung lượng (ROM) <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="Chỉ cần nhập số, VD: 128 hoặc 256" value={phoneFormData.capacity} onChange={e => setPhoneFormData({...phoneFormData, capacity: e.target.value})} required className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Màu sắc <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="VD: Titan Tự Nhiên" value={phoneFormData.colorName} onChange={e => setPhoneFormData({...phoneFormData, colorName: e.target.value})} required className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Hình thức <span className="text-red-500">*</span></label>
                        <select value={phoneFormData.grade} onChange={e => setPhoneFormData({...phoneFormData, grade: e.target.value})} className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            {['Mới', 'Đã kích hoạt', 'Cũ Đẹp', 'Trầy Xước', 'Xước Cấn'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh thực tế của máy (Chụp tình trạng xước xát nếu có)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[100px]">
                        <div className="flex flex-wrap gap-3 mb-3">
                            {phoneFormData.previewImages?.length > 0 ? phoneFormData.previewImages.map((src, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={src} alt="preview" className="h-20 w-20 object-cover rounded-md shadow-sm border border-gray-200" />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemovePhoneImage(idx)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )) : null}
                            
                            <label className="h-20 w-20 border-2 border-dashed border-blue-300 rounded-md flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 cursor-pointer transition shadow-sm bg-white">
                                <Plus size={24} />
                                <span className="text-[10px] mt-1 font-semibold">Thêm ảnh</span>
                                <input type="file" multiple accept="image/*" onChange={handlePhoneFileChange} className="hidden" />
                            </label>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Hỗ trợ tải lên nhiều ảnh (Dưới 10MB/ảnh)</span>
                    </div>
                </div>

          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-200">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Nguồn gốc</label>
                        <select value={phoneFormData.source} onChange={e => setPhoneFormData({...phoneFormData, source: e.target.value})} className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="supplier">Nhập từ nhà cung cấp</option>
                            <option value="customer_trade_in">Khách thu cũ đổi mới</option>
                            <option value="assembled">Máy tự ráp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Trạng thái máy <span className="text-red-500">*</span></label>
                        <select value={phoneFormData.status} onChange={e => setPhoneFormData({...phoneFormData, status: e.target.value})} className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="in_stock">Sẵn sàng (Trong kho)</option>
                            <option value="reserved">Đặt trước</option>
                            <option value="waiting_for_tech_decision">Đang chờ xử lý</option>
                            <option value="defective">Thiếu linh kiện</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá vốn (VNĐ) <span className="text-red-500">*</span></label>
                        <input type="text" value={formatPriceInput(phoneFormData.importPrice)} onChange={e => setPhoneFormData({...phoneFormData, importPrice: parsePriceInput(e.target.value)})} required className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-red-600 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                        <input type="text" value={formatPriceInput(phoneFormData.sellingPrice)} onChange={e => setPhoneFormData({...phoneFormData, sellingPrice: parsePriceInput(e.target.value)})} required className="w-full h-[46px] border-2 border-red-200 bg-red-50 px-3 rounded-xl outline-none focus:border-red-500 font-bold text-red-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Bảo hành (Tháng)</label>
                        <input type="number" value={phoneFormData.warrantyPeriod} onChange={e => setPhoneFormData({...phoneFormData, warrantyPeriod: e.target.value})} className="w-full h-[46px] border border-gray-300 px-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 bg-gray-50 -mx-6 -mb-6 p-5 rounded-b-2xl border-t border-gray-200">
                    <button type="button" onClick={() => setShowPhoneModal(false)} className="px-6 py-2.5 text-gray-600 font-bold border border-gray-300 rounded-xl hover:bg-gray-100 transition shadow-sm">Hủy bỏ</button>
                    <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition">{isEditingPhone ? 'Lưu Cập Nhật' : 'Nhập Vào Kho'}</button>
                </div>
            </form>
        </div>
    </div>
)}

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `}</style>
        </div>
    );
}