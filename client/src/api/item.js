import axiosClient from "./axiosClient";

export const getAllItems = async () => {
  try {
    const response = await axiosClient.get("/items/all");
    return response.data;
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
};