import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Cpu, HardDrive } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import CustomerLayout from "../../layouts/CustomerLayout";
export default function Home() {
  const [newPhones, setNewPhones] = useState([]);
  const [usedPhones, setUsedPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu và GỘP 2 bảng (Phone Models + Item Types)
  useEffect(() => {
    const fetchAndCombineData = async () => {
      try {
        // Gọi song song 2 API cùng lúc để tiết kiệm thời gian
        const [modelsRes, itemTypesRes] = await Promise.all([
          axiosClient.get('/phone_models/all'),
          axiosClient.get('/item_types/all')
        ]);

        const phoneModels = modelsRes.data.data || [];
        const itemTypes = itemTypesRes.data.data || [];

        // Ghép đôi: Tìm giá tiền trong bảng item_types có tên khớp với phone_models
        const combinedData = phoneModels.map(phone => {
          const matchedItemType = itemTypes.find(item => item.name === phone.name);
          return {
            ...phone,
            // Nếu tìm thấy mã giá, lấy price của nó. Nếu không, để giá = 0
            price: matchedItemType ? matchedItemType.price : 0,
            itemTypeId: matchedItemType ? matchedItemType._id : null
          };
        });

        // Phân loại Máy MỚI (condition = 1) và CŨ (condition < 1)
        const newList = combinedData.filter(p => p.condition === 1 || p.condition === undefined);
        const usedList = combinedData.filter(p => p.condition < 1);

        setNewPhones(newList);
        setUsedPhones(usedList);
      } catch (error) {
        console.error("Lỗi lấy danh sách sản phẩm:", error);
        toast.error("Không thể tải danh sách sản phẩm từ máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineData();
  }, []);

  // Component Thẻ Sản Phẩm (Product Card)
  const ProductCard = ({ product, isUsed }) => {
    // Tự động set ảnh đại diện theo hãng
    let displayImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";
    if (product.brand === "Samsung") displayImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/s/ss-s24-ultra-xam-222.png";
    if (product.brand === "Xiaomi") displayImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-14_1.png";
    if (product.brand === "OPPO") displayImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/o/p/oppo-find-n3-gold-1.png";

    // Format Giá tiền Việt Nam (VD: 24.590.000₫)
    const displayPrice = product.price > 0 
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) 
        : "Giá: Đang cập nhật";
    
    // Rút gọn thông số kỹ thuật
    const specs = product.specifications || {};

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
        
        {/* Nhãn máy cũ */}
        {isUsed && product.condition && (
          <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">
            Cũ {Math.round(product.condition * 100)}%
          </span>
        )}

        {/* Khu vực Ảnh sản phẩm */}
        <div className="overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2">
          <img 
            src={product.image || displayImage} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" 
          />
        </div>

        {/* Thông tin Chi tiết */}
        <div className="flex-1 flex flex-col">
          <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-[#007bff] transition-colors">
            {product.name}
          </h4>
          
          <p className="text-red-600 font-bold text-lg mb-3">{displayPrice}</p>

          {/* Các ô thông số kỹ thuật (Mini Specs) */}
          <div className="flex flex-wrap gap-2 mt-auto mb-4">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md">
              <Smartphone size={12} className="text-gray-400" /> {specs.screenSize || "N/A"}
            </div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md">
              <HardDrive size={12} className="text-gray-400" /> {specs.internalStorage || "N/A"}
            </div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md w-full truncate">
              <Cpu size={12} className="text-gray-400" /> <span className="truncate">{specs.chipset || "N/A"}</span>
            </div>
          </div>

          {/* Nút Xem chi tiết */}
          <Link 
            to={`/product/${product._id}`} 
            className="mt-auto w-full text-center bg-[#f0f7ff] text-[#007bff] border border-[#cce5ff] py-2.5 rounded-lg font-semibold hover:bg-[#007bff] hover:text-white transition-colors"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#007bff]"></div>
        <p className="text-gray-500 font-medium mt-4">Đang tải dữ liệu sản phẩm...</p>
      </div>
    );
  }

  return (
    <CustomerLayout>
      <div className="w-full pb-10">
        
        {/* BANNER */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-500 text-white rounded-2xl overflow-hidden mb-12 shadow-lg relative">
          <div className="py-12 px-8 flex flex-col md:flex-row items-center z-10 relative">
              <div className="md:w-3/5 space-y-4">
                  <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Khuyến mãi HOT
                  </span>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-md">
                    Sắm Điện Thoại Sang <br/> Rinh Ngàn Ưu Đãi
                  </h2>
                  <p className="text-blue-100 text-lg max-w-md drop-shadow-sm">
                    Hỗ trợ thu cũ đổi mới trợ giá lên đến 2 triệu đồng. Trả góp 0% lãi suất.
                  </p>
              </div>
              <div className="md:w-2/5 mt-8 md:mt-0 flex justify-center">
                  <img src="https://shopdunk.com/images/uploaded/banner/banner%202024/thang%203/ip15%20prm%20pc.png" alt="Banner" className="max-w-full h-auto drop-shadow-2xl scale-110" />
              </div>
          </div>
        </div>

        {/* ĐIỆN THOẠI MỚI */}
        {newPhones.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 uppercase flex items-center gap-2">
                <span className="w-1.5 h-7 bg-[#007bff] rounded-full inline-block"></span>
                Điện Thoại Mới Chính Hãng
              </h3>
              <Link to="/category/new" className="text-[#007bff] font-medium hover:underline text-sm md:text-base transition">
                Xem tất cả &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {newPhones.map(product => (
                    <ProductCard key={product._id} product={product} isUsed={false} />
                ))}
            </div>
          </div>
        )}

        {/* ĐIỆN THOẠI CŨ */}
        {usedPhones.length > 0 && (
          <div className="mb-10 p-6 bg-red-50/50 rounded-2xl border border-red-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-red-600 uppercase flex items-center gap-2">
                <span className="w-1.5 h-7 bg-red-600 rounded-full inline-block"></span>
                Máy Cũ Giá Rẻ - Trợ Giá Thu Cũ
              </h3>
              <Link to="/category/used" className="text-red-600 font-medium hover:underline text-sm md:text-base transition">
                Xem tất cả &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {usedPhones.map(product => (
                    <ProductCard key={product._id} product={product} isUsed={true} />
                ))}
            </div>
          </div>
        )}

        {newPhones.length === 0 && usedPhones.length === 0 && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300">
            Chưa có sản phẩm nào trong hệ thống.
          </div>
        )}

      </div>
    </CustomerLayout>
  );
}