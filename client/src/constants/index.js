import { useState, useEffect } from "react";
import { LayoutDashboard, Cpu, Wrench, Smartphone, List, Shield } from "lucide-react";
import { fetchAssembleDataApi } from "../api/technician/assemble"; 

export const useTechSidebarItems = () => {
    const [buildableCount, setBuildableCount] = useState(0);

    useEffect(() => {
        const getBuildableCount = async () => {
            const user = JSON.parse(localStorage.getItem('user')) || {};
            const techStoreId = user?.storeId?._id || user?.storeId || "";
            if (!techStoreId) return;

            const data = await fetchAssembleDataApi();
            if (data) {
                const availableItems = data.items.filter(i => {
                    const iStoreId = i.storeId?._id || i.storeId;
                    return i.status === 'in_stock' && String(iStoreId) === String(techStoreId);
                });

                let count = 0;
                data.recipes.forEach(recipe => {
                    if (!recipe.requiredParts || recipe.requiredParts.length === 0) return;
                    let minNewNeeded = 0;
                    let canFulfillAll = true;

                    for (let part of recipe.requiredParts) {
                        const acceptedIds = part.acceptedItemTypes.map(t => String(t._id || t));
                        const availableForSlot = availableItems.filter(i => acceptedIds.includes(String(i.item_type?._id || i.item_type)));
                        
                        if (availableForSlot.length === 0) {
                            canFulfillAll = false; break;
                        }
                        const hasUsedPart = availableForSlot.some(i => i.origin === 'disassembled');
                        if (!hasUsedPart) minNewNeeded++;
                    }
                    if (canFulfillAll && minNewNeeded <= 2) count++;
                });
                setBuildableCount(count);
            }
        };
        
        getBuildableCount();
        
        window.addEventListener('storageChanged', getBuildableCount);
        return () => window.removeEventListener('storageChanged', getBuildableCount);
    }, []);

    return [
        { text: "Dashboard", link: "/tech/dashboard", icon: <LayoutDashboard size={20} /> },
        { text: "Kho", link: "/tech/storage", icon: <Wrench size={20} /> },
        { text: "Hàng chờ", link: "/tech/repair-orders", icon: <List size={20} /> },
        { text: "Bảo hành", link: "/tech/warranty", icon: <Shield size={20} /> },
        { 
            text: "Ghép điện thoại", 
            link: "/tech/assemble", 
            icon: <Smartphone size={20}/>,
            badge: buildableCount > 0 ? buildableCount : null 
        },
    ];
};

export const initialChecklist = {
    screen: { name: "Màn hình", status: "OK", detail: "95%" },
    battery: { name: "Pin", status: "OK", detail: "95%" },
    frontCamera: { name: "Camera trước", status: "OK", detail: "95%" },
    backCamera: { name: "Camera sau", status: "OK", detail: "95%" },
    mainboard: { name: "Mainboard", status: "OK", detail: "95%" },
    casing: { name: "Vỏ máy", status: "OK", detail: "95%" },
  };