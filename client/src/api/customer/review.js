import axiosClient from "../axiosClient";
import { toast } from "react-toastify";

// Lấy danh sách đánh giá theo ID điện thoại và bộ lọc
export const fetchReviewsApi = async (phoneModelId, filter, currentUserId) => {
    try {
        let query = `?`;
        if (['1', '2', '3', '4', '5'].includes(filter)) query += `rating=${filter}`;
        if (filter === 'purchased') query += `hasPurchased=true`;

        const { data } = await axiosClient.get(`/reviews/phone/${phoneModelId}${query}`);
        const fetchedReviews = data.data.reviews || [];
        const stats = data.data.stats || {};

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

// Gửi đánh giá mới hoặc cập nhật
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