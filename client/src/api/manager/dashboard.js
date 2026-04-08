import axiosClient from "../axiosClient";

export const fetchManagerUsersApi = async () => {
  try {
    const res = await axiosClient.get("/users");
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const fetchManagerSalesApi = async () => {
  try {
    const res = await axiosClient.get("/purchase-orders?orderType=SALE");
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const fetchManagerRepairsApi = async () => {
  try {
    const res = await axiosClient.get("/repair-orders");
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  } catch (error) {
    return [];
  }
};