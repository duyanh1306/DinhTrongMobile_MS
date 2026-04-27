import React from "react";
import { Truck, CreditCard, Store, QrCode, ShieldCheck } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function ShippingPayment() {
    return (
        <CustomerLayout>
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 my-8">
                <div className="text-center mb-10">
                    <Truck size={56} className="text-[#007bff] mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Giao Hàng & Thanh Toán</h1>
                    <p className="text-gray-500 mt-2">Nhanh chóng, An toàn và Tiện lợi tại DinhTrongMobile</p>
                </div>

                <div className="space-y-10">
                   
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Phương Thức Thanh Toán</h2>
                        <p className="text-gray-600 mb-6">Để mang lại sự tiện lợi tối đa, chúng tôi hỗ trợ 3 hình thức thanh toán chính sau đây:</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition">
                                <Store size={36} className="text-blue-600 mb-4" />
                                <h3 className="font-bold text-lg text-gray-800 mb-2">1. Mua tại cửa hàng</h3>
                                <p className="text-sm text-gray-600">Thanh toán trực tiếp bằng <strong>Tiền mặt</strong> hoặc <strong>Quẹt thẻ (Visa/Mastercard/ATM)</strong> tại quầy thu ngân của DinhTrongMobile sau khi kiểm tra máy ưng ý.</p>
                            </div>

                          
                            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 hover:shadow-md transition">
                                <ShieldCheck size={36} className="text-[#007bff] mb-4" />
                                <h3 className="font-bold text-lg text-blue-900 mb-2">2. Thanh toán PayOS</h3>
                                <p className="text-sm text-gray-600">Hình thức chuyển khoản ngân hàng tự động siêu tốc qua hệ thống <strong>PayOS</strong>. Đơn hàng sẽ được tự động xác nhận ngay khi bạn quét mã VietQR chuyển khoản thành công.</p>
                            </div>

                   
                            <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 hover:shadow-md transition">
                                <QrCode size={36} className="text-red-500 mb-4" />
                                <h3 className="font-bold text-lg text-red-900 mb-2">3. Cổng VNPay</h3>
                                <p className="text-sm text-gray-600">Thanh toán an toàn qua cổng <strong>VNPay</strong>. Hỗ trợ quét mã QR qua ứng dụng ngân hàng (Mobile Banking) hoặc nhập thông tin thẻ ATM nội địa/Thẻ quốc tế.</p>
                            </div>
                        </div>
                    </section>

            
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
                            <Truck size={28} className="text-[#007bff]"/> Chính Sách Giao Hàng
                        </h2>
                        <div className="space-y-4 text-gray-700">
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2 text-lg">Giao Hàng Siêu Tốc (Nội Thành Hà Nội)</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li>Thời gian giao hàng: Nhận hàng ngay trong vòng <strong>1 - 2 giờ</strong> kể từ lúc đặt hàng thành công.</li>
                                    <li>Miễn phí giao hàng cho các đơn hàng có bán kính dưới 5km.</li>
                                    <li>Khách hàng được quyền đồng kiểm (kiểm tra hình thức máy) trước khi nhận hàng.</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2 text-lg">Giao Hàng Chuyển Phát (Tỉnh Thành Khác)</h3>
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li>Thời gian giao hàng: Từ <strong>2 - 4 ngày làm việc</strong> tùy thuộc vào khu vực.</li>
                                    <li>Đơn hàng sẽ được vận chuyển qua các đối tác uy tín như Viettel Post, Giao Hàng Tiết Kiệm,... có mã vận đơn để theo dõi hành trình.</li>
                                    <li>Sản phẩm được đóng gói chống sốc an toàn, có niêm phong bảo mật của DinhTrongMobile.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </CustomerLayout>
    );
}