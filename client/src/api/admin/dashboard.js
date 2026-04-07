import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchStoresApi = async () => {
  try {
    const { data } = await axiosClient.get("/stores");
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách cửa hàng:", error);
    return [];
  }
};

export const fetchDashboardDataApi = async (storeId = "") => {
  try {
    const url = storeId ? `/dashboard?storeId=${storeId}` : `/dashboard`;
    const res = await axiosClient.get(url);
    return res.data?.data || res.data; 
  } catch (error) {
    toast.error("Lỗi khi tải dữ liệu Dashboard: " + (error.response?.data?.message || error.message));
    return null; 
  }
};