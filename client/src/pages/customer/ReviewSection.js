import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Star, ThumbsUp, X, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORT TỪ FILE API VỪA TẠO
import { fetchReviewsApi, submitReviewApi } from '../../api/customer/review';

export default function ReviewSection({ phoneModelId }) {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ total: 0, avgRating: 0, ratingCounts: {}, criteriaAvg: {} });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); 
    
    // Form States
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ rating: 5, comment: '', performance: 5, battery: 5, camera: 5 });
    
    // User states
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;
    const [myReview, setMyReview] = useState(null);

    // ==============================================================
    // GỌI API KHỞI TẠO DATA
    // ==============================================================
    useEffect(() => {
        if (phoneModelId) {
            loadReviews();
        }
    }, [phoneModelId, filter]);

    const loadReviews = async () => {
        setLoading(true);
        const data = await fetchReviewsApi(phoneModelId, filter, currentUserId);
        if (data) {
            setReviews(data.fetchedReviews);
            setStats(data.stats);
            if (filter === 'all') {
                setMyReview(data.myReview);
            }
        }
        setLoading(false);
    };

    // ==============================================================
    // LOGIC XỬ LÝ NÚT BẤM & FORM
    // ==============================================================
    const handleOpenReviewModal = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.warning("Vui lòng đăng nhập để đánh giá!");
            navigate('/login');
            return;
        }

        if (myReview) {
            setFormData({
                rating: myReview.rating,
                comment: myReview.comment,
                performance: myReview.criteria?.performance || 5,
                battery: myReview.criteria?.battery || 5,
                camera: myReview.criteria?.camera || 5
            });
        } else {
            setFormData({ rating: 5, comment: '', performance: 5, battery: 5, camera: 5 });
        }
        setShowModal(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        const success = await submitReviewApi(phoneModelId, formData);
        
        if (success) {
            setShowModal(false);
            setFilter('all'); 
            loadReviews();
        }
    };

    const renderStars = (rating, size = 16) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={size} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"} />
        ));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Đánh giá điện thoại</h2>
            
            {/* THỐNG KÊ TỔNG QUAN */}
            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b">
                <div className="flex flex-col items-center justify-center min-w-[150px]">
                    <div className="flex items-baseline gap-1 text-red-600">
                        <span className="text-5xl font-bold">{stats.avgRating || '0.0'}</span>
                        <span className="text-xl font-semibold">/5</span>
                    </div>
                    <div className="flex gap-1 my-2">{renderStars(Math.round(stats.avgRating || 0), 20)}</div>
                    <div className="text-sm text-gray-500">{stats.total} lượt đánh giá</div>
                    
                    <button onClick={handleOpenReviewModal} className={`mt-4 px-6 py-2 flex items-center justify-center gap-2 text-white font-semibold rounded-lg transition w-full ${myReview ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {myReview ? <><Edit size={18}/> Sửa đánh giá</> : 'Viết đánh giá'}
                    </button>
                </div>

                {/* Phân bổ sao */}
                <div className="flex-1 space-y-2 border-l pl-8 border-gray-100">
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.ratingCounts?.[star] || 0;
                        const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-3 text-sm">
                                <div className="flex items-center w-8 text-gray-600 font-medium">{star} <Star size={12} className="ml-1 text-yellow-400 fill-yellow-400"/></div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="w-16 text-right text-gray-500 text-xs">{count} đánh giá</div>
                            </div>
                        );
                    })}
                </div>

                {/* Điểm chi tiết */}
                <div className="flex-1 border-l pl-8 border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 text-sm">Đánh giá theo trải nghiệm</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between"><span className="text-gray-600">Hiệu năng</span><div className="flex items-center gap-2"><div className="flex gap-0.5">{renderStars(Math.round(stats.criteriaAvg?.performance || 0), 14)}</div><span className="text-gray-800 font-medium">{stats.criteriaAvg?.performance || '0.0'}/5</span></div></div>
                        <div className="flex items-center justify-between"><span className="text-gray-600">Thời lượng pin</span><div className="flex items-center gap-2"><div className="flex gap-0.5">{renderStars(Math.round(stats.criteriaAvg?.battery || 0), 14)}</div><span className="text-gray-800 font-medium">{stats.criteriaAvg?.battery || '0.0'}/5</span></div></div>
                        <div className="flex items-center justify-between"><span className="text-gray-600">Camera</span><div className="flex items-center gap-2"><div className="flex gap-0.5">{renderStars(Math.round(stats.criteriaAvg?.camera || 0), 14)}</div><span className="text-gray-800 font-medium">{stats.criteriaAvg?.camera || '0.0'}/5</span></div></div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC ĐÁNH GIÁ */}
            <div className="py-6 flex flex-wrap items-center gap-3 border-b">
                <span className="font-semibold text-gray-800 mr-2">Lọc đánh giá theo</span>
                {[
                    { id: 'all', label: 'Tất cả' }, { id: 'purchased', label: 'Đã mua hàng' },
                    { id: '5', label: '5 sao' }, { id: '4', label: '4 sao' }, { id: '3', label: '3 sao' },
                    { id: '2', label: '2 sao' }, { id: '1', label: '1 sao' }
                ].map(f => (
                    <button 
                        key={f.id} onClick={() => setFilter(f.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f.id ? 'border border-blue-500 text-blue-600 bg-blue-50' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* DANH SÁCH */}
            <div className="mt-6 space-y-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Đang tải đánh giá...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Chưa có đánh giá nào phù hợp với bộ lọc.</div>
                ) : (
                    reviews.map(review => (
                        <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0 relative group">
                            {/* Nút sửa nhanh */}
                            {currentUserId === review.user?._id && (
                                <button onClick={handleOpenReviewModal} className="absolute right-0 top-0 text-blue-600 bg-blue-50 px-3 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                                    Chỉnh sửa
                                </button>
                            )}

                            <div className="flex gap-4">
                               {review.user?.image ? (
                                        <img 
                                            src={review.user.image.startsWith('http') 
                                                ? review.user.image 
                                                : `http://localhost:9999${review.user.image.startsWith('/') ? '' : '/'}${review.user.image}`
                                            } 
                                            alt={review.user?.fullName} 
                                            className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200 bg-white"
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.outerHTML = `<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg uppercase shadow-sm">${review.user?.fullName?.charAt(0) || 'U'}</div>`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg uppercase shadow-sm">
                                            {review.user?.fullName?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-gray-800">{review.user?.fullName} {currentUserId === review.user?._id && <span className="text-xs text-gray-400 font-normal">(Bạn)</span>}</h4>
                                        {review.hasPurchased && (
                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                                                <ThumbsUp size={12}/> Đã mua hàng
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex">{renderStars(review.rating, 14)}</div>
                                        {review.rating >= 4 && <span className="text-xs text-red-600 font-medium">Tuyệt vời</span>}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border">Hiệu năng: <strong>{review.criteria?.performance}/5</strong></span>
                                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border">Pin: <strong>{review.criteria?.battery}/5</strong></span>
                                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border">Camera: <strong>{review.criteria?.camera}/5</strong></span>
                                    </div>

                                    <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>
                                    
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        {new Date(review.createdAt).getTime() !== new Date(review.updatedAt).getTime() ? "Đã chỉnh sửa vào " : "Đánh giá vào "} 
                                        {new Date(review.updatedAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h3 className="font-bold text-lg">{myReview ? 'Cập nhật đánh giá' : 'Đánh giá sản phẩm'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
                        </div>
                        <form onSubmit={submitReview} className="p-5 space-y-5">
                            <div className="text-center">
                                <p className="font-semibold text-gray-800 mb-2">Đánh giá chung của bạn</p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <div key={star} onClick={() => setFormData({...formData, rating: star})} className="focus:outline-none">
                                            <Star size={32} className={`transition cursor-pointer ${star <= formData.rating ? 'text-yellow-400 fill-yellow-400 transform scale-110' : 'text-gray-300'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="font-medium text-sm text-gray-700">Đánh giá chi tiết (Chạm để chấm điểm)</p>
                                {[
                                    { key: 'performance', label: 'Hiệu năng máy' },
                                    { key: 'battery', label: 'Thời lượng pin' },
                                    { key: 'camera', label: 'Chất lượng camera' }
                                ].map(crit => (
                                    <div key={crit.key} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">{crit.label}</span>
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(s => (
                                                <Star key={s} size={20} onClick={() => setFormData({...formData, [crit.key]: s})} className={`cursor-pointer ${s <= formData[crit.key] ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}/>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <textarea required value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} placeholder="Xin mời chia sẻ trải nghiệm của bạn về sản phẩm này..." className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-28 resize-none"></textarea>
                            </div>

                            <button type="submit" className={`w-full text-white font-bold py-3 rounded-lg transition shadow-md ${myReview ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {myReview ? 'Lưu Cập Nhật' : 'Gửi Đánh Giá'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}