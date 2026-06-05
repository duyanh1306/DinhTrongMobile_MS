import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout';
import axiosClient from '../../api/axiosClient';

export default function PayosReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const code = searchParams.get('code');
        const cancel = searchParams.get('cancel');
        const statusParam = searchParams.get('status');

        if (cancel === 'true' || statusParam === 'CANCELLED' || code !== '00') {
            setStatus('failed');
            return; 
        }

        if (code === '00' || statusParam === 'PAID') {
            setStatus('success');
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                axiosClient.delete(`/cart/clear/${user._id || user.id}`)
                    .then(() => { window.dispatchEvent(new Event('cartUpdated')); })
                    .catch(err => console.log(err));
            }
        }
    }, [searchParams]);

    return (
        <CustomerLayout>
            <div className="min-h-[75vh] flex items-center justify-center bg-gray-50 py-10 px-4">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
                    
                    {status === 'processing' && (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
                            <h2 className="text-xl font-bold text-gray-800">Đang xử lý giao dịch...</h2>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <CheckCircle size={56} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Thanh toán thành công!</h2>
                            <p className="text-gray-500 mb-6 text-sm">Giao dịch qua PayOS đã hoàn tất. Cảm ơn bạn đã mua sắm tại cửa hàng.</p>
                            
                            <div className="bg-gray-50 w-full p-5 rounded-2xl mb-8 border border-gray-100 text-left">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Mã đơn hàng:</span> 
                                    <strong className="text-gray-800 font-mono">{searchParams.get('orderCode')}</strong>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <Link to="/order-history" className="flex-1 py-3.5 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2">
                                    <ShoppingBag size={18}/> Xem đơn hàng
                                </Link>
                                <Link to="/home" className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2">
                                    Tiếp tục mua sắm <ArrowRight size={18}/>
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <XCircle size={56} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Thanh toán thất bại!</h2>
                            <p className="text-gray-500 mb-8 text-sm">Giao dịch đã bị hủy. Đơn hàng của bạn chưa được lưu, vui lòng đặt hàng lại.</p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button onClick={() => navigate('/cart')} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md shadow-red-500/20 transition">
                                    Quay lại giỏ hàng
                                </button>
                                <Link to="/home" className="flex-1 py-3.5 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}