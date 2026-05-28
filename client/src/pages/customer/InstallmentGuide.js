import React from "react";
import { Landmark, CreditCard, FileText, CheckSquare } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function InstallmentGuide() {
    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 my-8">
                <div className="text-center mb-10">
                    <Landmark size={56} className="text-[#007bff] mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Hướng Dẫn Mua Trả Góp</h1>
                    <p className="text-gray-500 mt-2">Thủ tục đơn giản, Xét duyệt nhanh chóng, Rinh ngay máy xịn</p>
                </div>

                <div className="space-y-8">
               
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-center gap-3">
                            <FileText size={28} className="text-blue-600" />
                            <h2 className="text-xl font-bold text-blue-900">1. Trả góp qua Công ty Tài chính</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">Hình thức phù hợp cho khách hàng chưa có thẻ tín dụng. Áp dụng thông qua các đối tác tài chính uy tín như Home Credit, HD Saison, Mcredit.</p>
                            
                            <h4 className="font-bold text-gray-800 mt-4">Điều kiện & Giấy tờ cần thiết:</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                                <li>Độ tuổi: Từ 20 - 60 tuổi.</li>
                                <li>Chỉ cần <strong>Căn cước công dân (CCCD) gắn chip</strong> bản gốc (công ty tài chính đối chiếu xong sẽ trả lại).</li>
                                <li>Không có nợ xấu tại hệ thống Trung tâm Thông tin Tín dụng (CIC).</li>
                            </ul>

                            <h4 className="font-bold text-gray-800 mt-4">Quy trình thực hiện:</h4>
                            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                                <li>Đến trực tiếp cửa hàng DinhTrongMobile để xem và chọn máy.</li>
                                <li>Nhân viên tài chính sẽ hỗ trợ tạo hồ sơ online, tư vấn các gói lãi suất (thường trả trước 30% - 50%).</li>
                                <li>Đợi hệ thống xét duyệt (khoảng 15 - 30 phút).</li>
                                <li>Ký hợp đồng, thanh toán tiền trả trước và nhận máy ngay lập tức.</li>
                            </ol>
                        </div>
                    </section>

                  
                    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-emerald-50 border-b border-emerald-100 p-5 flex items-center gap-3">
                            <CreditCard size={28} className="text-emerald-600" />
                            <h2 className="text-xl font-bold text-emerald-900">2. Trả góp qua Thẻ Tín Dụng (Visa/Mastercard/JCB)</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">Hình thức mua sắm hiện đại, <strong>lãi suất 0%</strong> (chỉ mất phí chuyển đổi trả góp nhỏ theo từng ngân hàng), thủ tục online hoàn toàn.</p>
                            
                            <h4 className="font-bold text-gray-800 mt-4">Điều kiện áp dụng:</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                                <li>Khách hàng sở hữu thẻ tín dụng (Credit Card) của các ngân hàng nội địa hoặc quốc tế.</li>
                                <li>Hạn mức còn lại trong thẻ tín dụng phải lớn hơn hoặc bằng giá trị sản phẩm (hoặc số tiền muốn trả góp).</li>
                                <li>Thẻ đang ở trạng thái hoạt động bình thường, không chậm thanh toán.</li>
                            </ul>

                            <h4 className="font-bold text-gray-800 mt-4">Ưu điểm:</h4>
                            <ul className="text-sm text-gray-700 space-y-2">
                                <li className="flex items-start gap-2"><CheckSquare size={18} className="text-green-500 flex-shrink-0"/> Không cần chứng minh thu nhập, không cần CCCD.</li>
                                <li className="flex items-start gap-2"><CheckSquare size={18} className="text-green-500 flex-shrink-0"/> Không gọi điện thẩm định người thân.</li>
                                <li className="flex items-start gap-2"><CheckSquare size={18} className="text-green-500 flex-shrink-0"/> Có thể thanh toán online tại nhà thông qua cổng MPOS/Alepay hoặc quét thẻ trực tiếp tại cửa hàng.</li>
                                <li className="flex items-start gap-2"><CheckSquare size={18} className="text-green-500 flex-shrink-0"/> Kỳ hạn linh hoạt: 3, 6, 9, 12 tháng.</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
}