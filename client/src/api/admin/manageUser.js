import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

export const fetchUsers = async () => {
  try {
    const res = await axiosClient.get("/users");
    return res.data;
  } catch (error) {
    toast.error("Lỗi khi tải danh sách người dùng: " + error.message);
  }
};

export const fetchRoles = async () => {
  try {
    const res = await axiosClient.get("/roles");
    return res.data;
  } catch (error) {
    toast.error("Lỗi khi tải danh sách vai trò: " + error.message);
  }
};

// Hàm lấy danh sách cửa hàng
export const fetchStores = async () => {
  try {
    const res = await axiosClient.get("/stores");
    return res.data;
  } catch (error) {
    console.log("Lỗi tải cửa hàng", error);
  }
};
