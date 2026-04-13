 import axiosClient from "../axiosClient";

export const createRepairOrderApi = async (payload) => {
  try {
    const res = await axiosClient.post("/repair-orders", payload);
    return { success: true, data: res.data };
  } catch (error) {
    return { 
        success: false, 
        message: error.response?.data?.message || "Tạo đơn sửa chữa thất bại" 
    };
  }
};