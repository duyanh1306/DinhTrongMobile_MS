import axiosClient from '../axiosClient';

export const fetchPhoneModels = async () => {
    try {
        const { data } = await axiosClient.get('/phone_models/all');
        return data.data || [];
    } catch (error) {
        throw new Error('Failed to fetch phone models');
    }
};

export const fetchItemTypes = async () => {
    try {
        const { data } = await axiosClient.get('/item_types/all');
        return data.data || [];
    } catch (error) {
        throw new Error('Failed to fetch item types');
    }
};

export const fetchItems = async () => {
    try {
        const { data } = await axiosClient.get('/items/all');
        return data.data || [];
    } catch (error) {
        throw new Error('Failed to fetch items');
    }
};

export const assemblePhone = async (phoneData) => {
    try {
        const { data } = await axiosClient.post('/phones/assemble', phoneData);
        return data;
    } catch (error) {
        throw error;
    }
};
