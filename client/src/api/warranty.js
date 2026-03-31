import axiosClient from './axiosClient';

// Get all warranty requests
export const getAllWarrantyRequests = async (params = {}) => {
  try {
    const response = await axiosClient.get('/warranty', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching warranty requests:', error);
    throw error;
  }
};

// Get warranty request by ID
export const getWarrantyRequestById = async (id) => {
  try {
    const response = await axiosClient.get(`/warranty/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching warranty request:', error);
    throw error;
  }
};

// Create new warranty request
export const createWarrantyRequest = async (warrantyData) => {
  try {
    const response = await axiosClient.post('/warranty/create', warrantyData);
    return response.data;
  } catch (error) {
    console.error('Error creating warranty request:', error);
    throw error;
  }
};

// Update warranty request
export const updateWarrantyRequest = async (id, warrantyData) => {
  try {
    const response = await axiosClient.put(`/warranty/${id}`, warrantyData);
    return response.data;
  } catch (error) {
    console.error('Error updating warranty request:', error);
    throw error;
  }
};

// Process warranty request (approve replacement or repair)
export const processWarrantyRequest = async (id, processData) => {
  try {
    const response = await axiosClient.put(`/warranty/${id}/process`, processData);
    return response.data;
  } catch (error) {
    console.error('Error processing warranty request:', error);
    throw error;
  }
};

// Complete warranty request
export const completeWarrantyRequest = async (id) => {
  try {
    const response = await axiosClient.put(`/warranty/${id}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing warranty request:', error);
    throw error;
  }
};

// Delete warranty request
export const deleteWarrantyRequest = async (id) => {
  try {
    const response = await axiosClient.delete(`/warranty/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting warranty request:', error);
    throw error;
  }
};
