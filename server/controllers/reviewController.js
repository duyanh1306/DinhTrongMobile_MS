const Review = require("../models/Review");

// Lấy danh sách đánh giá của 1 dòng máy
const getPhoneReviews = async (req, res) => {
    try {
        const { phoneModelId } = req.params;
        const { rating, hasPurchased } = req.query;

        let query = { phoneModel: phoneModelId };
        
        if (rating && rating !== 'all') query.rating = parseInt(rating);
        if (hasPurchased === 'true') query.hasPurchased = true;

        const reviews = await Review.find(query)
            .populate('user', 'fullName image') 
            .sort({ createdAt: -1 });

        const allReviews = await Review.find({ phoneModel: phoneModelId });
        const totalReviews = allReviews.length;
        
        let avgRating = 0;
        let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let criteriaAvg = { performance: 0, battery: 0, camera: 0 };

        if (totalReviews > 0) {
            allReviews.forEach(r => {
                avgRating += r.rating;
                ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
                criteriaAvg.performance += r.criteria.performance;
                criteriaAvg.battery += r.criteria.battery;
                criteriaAvg.camera += r.criteria.camera;
            });
            avgRating = (avgRating / totalReviews).toFixed(1);
            criteriaAvg.performance = (criteriaAvg.performance / totalReviews).toFixed(1);
            criteriaAvg.battery = (criteriaAvg.battery / totalReviews).toFixed(1);
            criteriaAvg.camera = (criteriaAvg.camera / totalReviews).toFixed(1);
        }

        res.status(200).json({
            success: true,
            data: {
                reviews,
                stats: { total: totalReviews, avgRating, ratingCounts, criteriaAvg }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đăng hoặc Sửa đánh giá
const createOrUpdateReview = async (req, res) => {
    try {
        const { phoneModelId, rating, comment, performance, battery, camera } = req.body;
     
        const userId = req.user.id || req.user._id; 
        const existingReview = await Review.findOne({ user: userId, phoneModel: phoneModelId });

        if (existingReview) {
            existingReview.rating = rating;
            existingReview.comment = comment;
            existingReview.criteria = { performance, battery, camera };
            await existingReview.save();
            
            return res.status(200).json({ success: true, message: "Đã cập nhật lại đánh giá của bạn!" });
        } else {
            const newReview = new Review({
                user: userId,
                phoneModel: phoneModelId,
                rating,
                comment,
                criteria: { performance, battery, camera },
                hasPurchased: false 
            });

            await newReview.save();
            return res.status(201).json({ success: true, message: "Cảm ơn bạn đã gửi đánh giá!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getPhoneReviews, createReview: createOrUpdateReview };