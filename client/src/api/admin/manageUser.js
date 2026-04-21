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

export const fetchStores = async () => {
  try {
    const res = await axiosClient.get("/stores");
    return res.data;
  } catch (error) {
    console.log("Lỗi tải cửa hàng", error);
  }
};
export const updateUserApi = async (id, data) => {
  try {
    const res = await axiosClient.put(`/users/${id}`, data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createUserApi = async (data) => {
  try {
    const res = await axiosClient.post("/users", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const banUserApi = async (id) => {
  try {
    const res = await axiosClient.put(`/users/${id}`, { status: "inactive" });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetPasswordApi = async (id, password) => {
  try {
    const res = await axiosClient.put(`/users/${id}/reset-password`, { password });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};