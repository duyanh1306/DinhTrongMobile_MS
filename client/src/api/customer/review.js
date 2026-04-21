import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http')) return imagePath;
    const currentBaseUrl = axiosClient.defaults.baseURL || 'http://localhost:9999/api';
    const serverUrl = currentBaseUrl.replace(/\/api\/?$/, '');

    return `${serverUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

export const fetchReviewsApi = async (phoneModelId, filter, currentUserId) => {
    try {
        let query = `?`;
        if (['1', '2', '3', '4', '5'].includes(filter)) query += `rating=${filter}`;
        if (filter === 'purchased') query += `hasPurchased=true`;

        const { data } = await axiosClient.get(`/reviews/phone/${phoneModelId}${query}`);
        
        let fetchedReviews = data.data.reviews || [];
        const stats = data.data.stats || {};

        fetchedReviews = fetchedReviews.map(review => {
            if (review.user && review.user.image) {
                review.user.image = formatImageUrl(review.user.image);
            }
            return review;
        });

        let myReview = null;
        if (currentUserId && filter === 'all') {
            myReview = fetchedReviews.find(r => r.user?._id === currentUserId) || null;
        }

        return { fetchedReviews, stats, myReview };
    } catch (error) {
        console.error("Lỗi tải đánh giá", error);
        return null;
    }
};


export const submitReviewApi = async (phoneModelId, formData) => {
    try {
        const res = await axiosClient.post(`/reviews/create`, {
            phoneModelId, 
            ...formData
        });
        toast.success(res.data.message || "Đánh giá thành công!");
        return true;
    } catch (error) {
        console.error("Lỗi gửi đánh giá", error);
        toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá");
        return false;
    }
};