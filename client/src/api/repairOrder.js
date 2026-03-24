import axiosClient from './axiosClient';

// Get all repair services
export const getAllRepairServices = async () => {
  try {
    const response = await axiosClient.get('/repair_services/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching repair services:', error);
    throw error;
  }
};

export const getRepairServices = async (params = {}) => {
  try {
    const response = await axiosClient.get('/repair_services', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching repair services:', error);
    throw error;
  }
};

// Create a new repair service
export const createRepairService = async (serviceData) => {
  try {
    const response = await axiosClient.post('/repair_services/create', serviceData);
    return response.data;
  } catch (error) {
    console.error('Error creating repair service:', error);
    throw error;
  }
};

// Get repair order details by order ID
export const getRepairOrderDetails = async (orderId) => {
  try {
    const response = await axiosClient.get(`/repair_orders/${orderId}/details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching repair order details:', error);
    throw error;
  }
};

// Update repair order detail with service change
export const updateRepairOrderDetail = async (orderId, detailData) => {
  try {
     const response = await axiosClient.put(`/repair-orders/${orderId}/details-with-transfer`, detailData);
    return response.data;
  } catch (error) {
    console.error('Error updating repair order detail:', error);
    throw error;
  }
};
