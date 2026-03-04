import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Smartphone, Package, Check, X } from "lucide-react";

export default function AssemblePhone() {
    const [phoneModels, setPhoneModels] = useState([]);
    const [selectedPhoneModel, setSelectedPhoneModel] = useState(null);
    const [itemTypes, setItemTypes] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [showItemModal, setShowItemModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetchPhoneModels();
        fetchItemTypes();
        fetchItems();
    }, []);

    const fetchPhoneModels = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get("http://localhost:9999/api/phone_models/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPhoneModels(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch phone models");
        }
    };

    const fetchItemTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get("http://localhost:9999/api/item_types/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItemTypes(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch item types");
        }
    };

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get("http://localhost:9999/api/items/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(data.data || []);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch items");
            setLoading(false);
        }
    };

    const handlePhoneModelSelect = (model) => {
        setSelectedPhoneModel(model);
        setSelectedItems({});
    };

    const getComponentCategories = useMemo(() => {
        const categories = [
            { code: 'LCD', name: 'Màn hình (LCD)', required: true },
            { code: 'BAT', name: 'Pin (Battery)', required: true },
            { code: 'MAIN', name: 'Mainboard', required: true },
            { code: 'CAM', name: 'Camera', required: true },
            { code: 'SPK', name: 'Loa (Speaker)', required: false },
            { code: 'MIC', name: 'Microphone', required: false },
            { code: 'VIB', name: 'Rung (Vibrator)', required: false },
            { code: 'FLE', name: 'Cáp Flex (Flex Cable)', required: false },
            { code: 'BUT', name: 'Nút bấm (Buttons)', required: false },
            { code: 'CAS', name: 'Vỏ máy (Case)', required: false },
            { code: 'GLA', name: 'Kính (Glass)', required: false },
            { code: 'ANT', name: 'Antenna', required: false },
            { code: 'CHG', name: 'Cổng sạc (Charging Port)', required: false },
            { code: 'JAC', name: 'Jack tai nghe (Jack)', required: false },
            { code: 'SEN', name: 'Cảm biến (Sensors)', required: false }
        ];

        return categories.map(category => {
            const categoryItemTypes = itemTypes.filter(itemType => 
                itemType.code && itemType.code.toUpperCase().startsWith(category.code)
            );
            
            const compatibleItemTypes = selectedPhoneModel ? 
                itemTypes.filter(itemType => 
                    selectedPhoneModel.compatibleItemTypes?.some(compatibleId => 
                        compatibleId.toString() === itemType._id.toString()
                    )
                ) : [];

            return {
                ...category,
                itemTypes: categoryItemTypes,
                hasCompatible: categoryItemTypes.some(itemType => 
                    compatibleItemTypes.some(compatible => 
                        compatible._id.toString() === itemType._id.toString()
                    )
                )
            };
        });
    }, [itemTypes, selectedPhoneModel]);

    const getAvailableItems = (itemTypeId) => {
        return items.filter(item => {
            // Check both populated object and direct ID
            const itemTypeIdValue = item.item_type?._id || item.item_type;
            return itemTypeIdValue === itemTypeId && 
                   item.status === 'in_stock';
        });
    };

    const getAvailableItemsForCategory = (category) => {
        // First try to get items from compatible item types
        const compatibleItems = [];
        const allItems = [];
        
        category.itemTypes.forEach(itemType => {
            const availableItems = getAvailableItems(itemType._id);
            const isCompatible = isItemTypeCompatible(itemType._id);
            
            availableItems.forEach(item => {
                const itemData = {
                    ...item,
                    itemTypeName: itemType.name,
                    itemTypeCode: itemType.code,
                    isCompatible: isCompatible
                };
                
                if (isCompatible) {
                    compatibleItems.push(itemData);
                }
                allItems.push(itemData);
            });
        });
        
        // Return compatible items if any, otherwise return all items
        return compatibleItems.length > 0 ? compatibleItems : allItems;
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setShowItemModal(true);
    };

    const handleItemSelect = (item) => {
        // Find the item type ID for this item
        const itemTypeId = item.item_type?._id || item.item_type;
        setSelectedItems(prev => ({
            ...prev,
            [itemTypeId]: item._id
        }));
        setShowItemModal(false);
    };

    const isItemTypeCompatible = (itemTypeId) => {
        if (!selectedPhoneModel) return false;
        return selectedPhoneModel.compatibleItemTypes?.some(compatibleId => 
            compatibleId.toString() === itemTypeId.toString()
        );
    };

    const handleAssemble = async () => {
        if (!selectedPhoneModel) {
            toast.error("Please select a phone model first");
            return;
        }

        const requiredCategories = getComponentCategories.filter(cat => cat.required);
        const selectedRequiredCount = requiredCategories.filter(cat => 
            cat.itemTypes.some(itemType => selectedItems[itemType._id])
        ).length;
        
        if (selectedRequiredCount < requiredCategories.length) {
            toast.error(`Please select components for all ${requiredCategories.length} required categories`);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const phoneData = {
                phone_model: selectedPhoneModel._id,
                items: Object.values(selectedItems),
                status: 'assembled',
                assembled_by: localStorage.getItem('userId'),
                assembled_date: new Date()
            };

            await axios.post("http://localhost:9999/api/phones/assemble", phoneData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Phone assembled successfully!");
            // Reset form
            setSelectedPhoneModel(null);
            setSelectedItems({});
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assemble phone");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3">
                <Smartphone className="text-blue-600" size={28} />
                <h1 className="text-2xl font-bold text-gray-800">Ghép điện thoại</h1>
            </div>

            {/* Phone Model Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Chọn dòng máy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phoneModels.map(model => (
                        <div
                            key={model._id}
                            onClick={() => handlePhoneModelSelect(model)}
                            className={`border rounded-lg p-4 cursor-pointer transition ${
                                selectedPhoneModel?._id === model._id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                {model.image ? (
                                    <img src={model.image} alt={model.name} className="h-12 w-12 object-contain" />
                                ) : (
                                    <Package className="h-12 w-12 text-gray-300" />
                                )}
                                <div>
                                    <div className="font-semibold">{model.name}</div>
                                    <div className="text-sm text-gray-600">{model.brand}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Component Selection */}
            {selectedPhoneModel && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Chọn linh kiện</h2>

                    <div className="text-sm text-gray-600 mb-4">
                        Đã chọn {Object.keys(selectedItems).length} linh kiện
                        {selectedPhoneModel && ` / ${getComponentCategories.filter(cat => cat.required).length} linh kiện bắt buộc`}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <tbody>
                                {getComponentCategories.map((category, index) => (
                                    <tr key={category.code} className="odd:bg-[#f9f9f9] even:bg-white">
                                        <td className="w-1/6 px-2 py-2 sm:px-4">
                                            <span className="text-xs font-bold text-gray-800 sm:text-sm">
                                                {index + 1}. {category.name}
                                                {category.required && <span className="text-red-600"> *</span>}
                                            </span>
                                        </td>
                                        <td className="w-5/6 border-l border-[#e1e1e1] px-2 py-2 pl-[7px] sm:px-4">
                                            {category.itemTypes.length > 0 ? (
                                                <div className="flex items-center space-x-2">
                                                    {(() => {
                                                        const selectedItemId = Object.entries(selectedItems)
                                                            .find(([itemTypeId, itemId]) => 
                                                                category.itemTypes.some(itemType => 
                                                                    itemType._id === itemTypeId && itemId
                                                                )
                                                            )?.[1];
                                                        
                                                        if (selectedItemId) {
                                                            const selectedItem = items.find(item => item._id === selectedItemId);
                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleCategorySelect(category)}
                                                                        className="px-3 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded transition sm:text-sm"
                                                                    >
                                                                        ✓ Đã chọn {category.name}
                                                                    </button>
                                                                    <span className="text-xs text-gray-600">
                                                                        - {selectedItem?.serialCode || selectedItem?.serial_code || 'N/A'}
                                                                    </span>
                                                                </>
                                                            );
                                                        }
                                                        
                                                        const availableItems = getAvailableItemsForCategory(category);
                                                        if (availableItems.length === 0) {
                                                            return (
                                                                <span className="text-xs text-red-600">
                                                                    (Hết hàng)
                                                                </span>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <button
                                                                onClick={() => handleCategorySelect(category)}
                                                                className="px-3 py-1 text-xs text-white bg-[#243a76] hover:bg-blue-800 rounded transition sm:text-sm"
                                                            >
                                                                + Chọn {category.name}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-sm">Không có linh kiện nào</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <button
                            onClick={() => {
                                setSelectedPhoneModel(null);
                                setSelectedItems({});
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAssemble}
                            disabled={Object.keys(selectedItems).length < getComponentCategories.filter(cat => cat.required).length}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Ghép điện thoại
                        </button>
                    </div>
                </div>
            )}

            {/* Item Selection Modal */}
            {showItemModal && selectedCategory && (
                <>
                    <div className="backdrop-opacity-disabled fixed inset-0 w-screen h-screen bg-black/50 z-[100000]" 
                         style={{ opacity: 1 }} 
                         aria-hidden="true"
                         onClick={() => setShowItemModal(false)}>
                    </div>
                    <div className="fixed inset-0 flex items-center justify-center z-[100001] p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">
                                        Chọn linh kiện - {selectedCategory.name}
                                    </h3>
                                    <button
                                        onClick={() => setShowItemModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="space-y-4">
                                    {getAvailableItemsForCategory(selectedCategory).map(item => (
                                        <div
                                            key={item._id}
                                            onClick={() => handleItemSelect(item)}
                                            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <div className="font-medium">
                                                            {item.itemTypeName}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Mã serial: {item.serialCode || item.serial_code || 'N/A'}
                                                        </div>
                                                        {item.notes && (
                                                            <div className="text-sm text-gray-500">
                                                                Ghi chú: {item.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {!item.isCompatible && (
                                                        <span className="text-xs text-yellow-600 font-medium">
                                                            Không tương thích
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-green-600 font-medium">
                                                        Có sẵn
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {getAvailableItemsForCategory(selectedCategory).length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            Không có linh kiện nào có sẵn cho loại này
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
