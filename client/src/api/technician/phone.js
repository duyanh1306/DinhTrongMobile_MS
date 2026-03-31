import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchTechPhonesApi = async (storeId) => {
    if (!storeId) return [];
    try {
        const { data } = await axiosClient.get(`/phones?storeId=${storeId}`);
        return data.data || [];
    } catch (error) {
        toast.error("Lỗi tải danh sách điện thoại");
        return [];
    }
};

export const fetchTechPhoneQrCodeApi = async (phoneId) => {
    try {
        const response = await axiosClient.get(`/phones/qrcode/${phoneId}`, {
            responseType: "blob"
        });
        return response.data;
    } catch (error) {
        toast.error("Lỗi tải mã QR điện thoại");
        return null;
    }
};