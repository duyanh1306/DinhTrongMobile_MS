import axiosClient from "../axiosClient";

export const fetchWarrantiesApi = async () => {
  try {
    const response = await axiosClient.get("/warranty");
    return response.data;
  } catch (error) {
    console.error("Error fetching warranties:", error);
    throw error;
  }
};

export const fetchStoresApi = async () => {
  try {
    const response = await axiosClient.get("/stores");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
};

export const fetchPhonesApi = async () => {
  try {
    const response = await axiosClient.get("/phones?status=in_stock");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching phones:", error);
    return [];
  }
};

export const createWarrantyApi = async (warrantyData) => {
  try {
    const response = await axiosClient.post("/warranty/create", warrantyData);
    return response.data;
  } catch (error) {
    console.error("Error creating warranty:", error);
    throw error;
  }
};

export const processWarrantyApi = async (id, processData) => {
  try {
    const response = await axiosClient.put(`/warranty/${id}/process`, processData);
    return response.data;
  } catch (error) {
    console.error("Error processing warranty:", error);
    throw error;
  }
};

// Complete warranty request
export const completeWarrantyApi = async (id) => {
  try {
    const response = await axiosClient.put(`/warranty/${id}/complete`);
    return response.data;
  } catch (error) {
    console.error("Error completing warranty:", error);
    throw error;
  }
};

// Delete warranty request
export const deleteWarrantyApi = async (id) => {
  try {
    const response = await axiosClient.delete(`/warranty/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting warranty:", error);
    throw error;
  }
};
