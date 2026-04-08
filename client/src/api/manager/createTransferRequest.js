import axiosClient from "../axiosClient";
import { toast } from "react-toastify";


export const fetchStoresApi = async () => {
    try {
        const response = await axiosClient.get(`/stores`);
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error) {
        console.error('Failed to fetch stores', error);
        toast.error('Failed to fetch stores');
        return [];
    }
};


export const fetchItemTypesApi = async () => {
    try {
        const response = await axiosClient.get(`/item_types?limit=100`);
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error) {
        console.error('Failed to fetch item types', error);
        toast.error('Failed to fetch item types');
        return [];
    }
};


export const fetchUserStoreApi = async (userId) => {
    try {
        const response = await axiosClient.get(`/stores`);
        const storesData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        const userStore = storesData.find((store) =>
            store.staff && store.staff.includes(userId)
        );

        if (!userStore) {
            toast.error('You are not assigned to any store');
            return null;
        }
        return userStore;
    } catch (error) {
        console.error('Failed to fetch user store information', error);
        toast.error('Failed to fetch user store information');
        return null;
    }
};


export const createTransferRequestApi = async (transferRequestData) => {
    try {
        await axiosClient.post(`/transfer-requests`, transferRequestData);
        toast.success('Transfer request created successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        return true;
    } catch (error) {
        console.error('Failed to create transfer request', error);
        toast.error(error.response?.data?.message || 'Failed to create transfer request');
        return false;
    }
};