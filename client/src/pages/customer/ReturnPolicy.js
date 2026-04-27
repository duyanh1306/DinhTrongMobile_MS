import React from "react";
import { RefreshCcw, ThumbsUp, AlertCircle, Box } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout"; 

export default function ReturnPolicy() {
    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 my-8">
                <div className="text-center mb-10">
                    <RefreshCcw size={56} className="text-[#007bff] mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Chính Sách Đổi Trả</h1>
                    <p className="text-gray-500 mt-2">Bao test 1 đổi 1 - An tâm mua sắm tại DinhTrongMobile</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
                        <ThumbsUp size={32} className="text-blue-500 mb-3"/>
                        <h3 className="font-bold text-lg text-blue-900 mb-2">30 Ngày Đầu Tiên</h3>
                        <p className="text-sm text-gray-600">Áp dụng <strong>1 ĐỔI 1 MIỄN PHÍ</strong> cho các sản phẩm phát sinh lỗi phần cứng từ nhà sản xuất (như lỗi main, nguồn, màn hình không do va đập).</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <Box size={32} className="text-gray-500 mb-3"/>
                        <h3 className="font-bold text-lg text-gray-800 mb-2">Sau 30 Ngày</h3>
                        <p className="text-sm text-gray-600">Chuyển sang hình thức <strong>BẢO HÀNH SỬA CHỮA</strong>. DinhTrongMobile sẽ tiếp nhận và khắc phục lỗi miễn phí theo thời hạn bảo hành của sản phẩm.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-[#007bff] mb-4 border-b pb-2">Điều Kiện Để Được Đổi Trả (1 Đổi 1)</h2>
                        <div className="bg-white p-5 rounded-xl border border-gray-200">
                            <ul className="space-y-3 text-gray-700 list-disc marker:text-blue-500 pl-4">
                                <li>Máy phải giữ nguyên tình trạng ngoại quan như lúc mới mua (không trầy xước, cấn móp, nứt vỡ).</li>
                                <li>Phải giữ đầy đủ hộp máy (đối với hàng mới), các phụ kiện đi kèm (sạc, cáp, tai nghe...) và quà tặng khuyến mãi (nếu có).</li>
                                <li>Máy đã được đăng xuất toàn bộ tài khoản cá nhân (iCloud, Google Account, Mi Account...).</li>
                                <li>Sản phẩm đã được kỹ thuật viên DinhTrongMobile kiểm tra và xác nhận là lỗi do phần cứng từ nhà sản xuất.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2 mb-4 border-b pb-2">
                            <AlertCircle size={24} /> Chính sách thu mua lại (Trade-in / Bán lại)
                        </h2>
                        <p className="text-gray-700 mb-3">Trong trường hợp sản phẩm không có lỗi nhưng khách hàng muốn trả máy hoặc đổi sang dòng máy khác:</p>
                        <ul className="space-y-3 text-gray-700 list-disc pl-5">
                            <li><strong>Trong 30 ngày đầu:</strong> Cửa hàng thu lại máy với mức giá bằng <strong>80% - 85%</strong> giá trị hóa đơn mua hàng (tùy tình trạng ngoại quan hiện tại).</li>
                            <li><strong>Sau 30 ngày:</strong> Cửa hàng thu mua lại theo giá thỏa thuận dựa trên giá thị trường tại thời điểm bán lại.</li>
                            <li><em>Lưu ý: Không áp dụng thu lại đối với các sản phẩm phụ kiện rời (ốp lưng, cường lực, cáp sạc...).</em></li>
                        </ul>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
}