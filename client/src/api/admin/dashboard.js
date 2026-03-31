import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchDashboardDataApi = async () => {
  try {
    const res = await axiosClient.get("/dashboard");
    return res.data; 
  } catch (error) {
    toast.error("Lỗi khi tải dữ liệu Dashboard: " + (error.response?.data?.message || error.message));
    return null; 
  }
};