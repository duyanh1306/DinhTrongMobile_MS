import React from "react";
import { ShieldCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout"; 

export default function WarrantyPolicy() {
    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 my-8">
                <div className="text-center mb-10">
                    <ShieldCheck size={56} className="text-[#007bff] mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Chính Sách Bảo Hành</h1>
                    <p className="text-gray-500 mt-2">Áp dụng cho tất cả khách hàng mua sắm tại hệ thống DinhTrongMobile</p>
                </div>

                <div className="space-y-8">
                   
                    <section>
                        <h2 className="text-xl font-bold text-[#007bff] flex items-center gap-2 mb-4 border-b pb-2">
                            <Clock size={24} /> 1. Thời gian bảo hành
                        </h2>
                        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0"/> <strong>Máy mới 100% (Nguyên seal):</strong> Bảo hành 12 tháng chính hãng hoặc tại cửa hàng.</li>
                                <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0"/> <strong>Máy cũ (Like New 99%, 98%):</strong> Bảo hành phần cứng 6 tháng.</li>
                                <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0"/> <strong>Phụ kiện (Sạc, cáp, tai nghe):</strong> Bảo hành 3 tháng lỗi 1 đổi 1.</li>
                                <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0"/> <strong>Máy tự ráp (Build Phone):</strong> Bảo hành riêng theo từng linh kiện được chọn (Từ 3 - 12 tháng).</li>
                            </ul>
                        </div>
                    </section>

                
                    <section>
                        <h2 className="text-xl font-bold text-[#007bff] flex items-center gap-2 mb-4 border-b pb-2">
                            <ShieldCheck size={24} /> 2. Điều kiện tiếp nhận bảo hành
                        </h2>
                        <ul className="space-y-3 text-gray-700 pl-4 list-disc marker:text-blue-500">
                            <li>Máy còn trong thời hạn bảo hành tính từ ngày mua hàng.</li>
                            <li>Sản phẩm phải còn nguyên tem bảo hành của DinhTrongMobile hoặc tem của nhà phân phối.</li>
                            <li>Sản phẩm không có dấu hiệu bị can thiệp phần cứng, tự ý tháo mở.</li>
                            <li>Số IMEI/Serial trên máy phải trùng khớp với thông tin trên hệ thống quản lý hoặc phiếu bảo hành.</li>
                        </ul>
                    </section>

                 
                    <section>
                        <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4 border-b pb-2">
                            <AlertTriangle size={24} /> 3. Các trường hợp TỪ CHỐI bảo hành
                        </h2>
                        <div className="bg-red-50 p-5 rounded-xl border border-red-100 text-red-800">
                            <ul className="space-y-3 list-decimal pl-5">
                                <li>Sản phẩm bị mất tem, rách tem, hoặc tem có dấu hiệu cạo sửa.</li>
                                <li>Máy bị rơi vỡ, cấn móp, biến dạng ngoại quan do tác động vật lý.</li>
                                <li>Sản phẩm bị vào nước, hóa chất, cháy nổ hoặc bảo quản trong môi trường ẩm ướt vượt mức cho phép.</li>
                                <li>Lỗi hư hỏng do người dùng tự ý can thiệp phần mềm (Jailbreak, Root, Up ROM sai cách).</li>
                                <li>Màn hình bị sọc, chảy mực, đốm đen do tì đè (chỉ bảo hành lỗi cảm ứng do nhà sản xuất).</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
}