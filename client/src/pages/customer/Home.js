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

  useEffect(() => {
    const fetchAndCombineData = async () => {
      try {
        const [modelsRes, phonesRes] = await Promise.all([
          axiosClient.get('/phone_models/all'),
          axiosClient.get('/phones/all')
        ]);

        const phoneModels = modelsRes.data.data || [];
        const phones = phonesRes.data.data || [];

        const combinedData = phoneModels.map(model => {
          // Lọc ra các máy vật lý (phones) có sẵn trong kho thuộc dòng model này
          const availablePhones = phones.filter(p => 
            (p.phoneModelId?._id === model._id || p.phoneModelId === model._id) && 
            p.status === 'in_stock'
          );

          // Tính giá rẻ nhất
          let startingPrice = 0;
          if (availablePhones.length > 0) {
            const prices = availablePhones.map(p => 
              p.sellingPrice ? p.sellingPrice : (p.importPrice * 1.15)
            );
            startingPrice = Math.min(...prices);
          }

          return {
            ...model, // Gộp cả model.image vào đây
            price: startingPrice,
            stockCount: availablePhones.length
          };
        });

        const newList = combinedData.filter(p => p.condition === 1 || p.condition === undefined);
        const usedList = combinedData.filter(p => p.condition < 1);

        setNewPhones(newList);
        setUsedPhones(usedList);
      } catch (error) {
        console.error("Lỗi lấy danh sách sản phẩm:", error);
        toast.error("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineData();
  }, []);

  const ProductCard = ({ product, isUsed }) => {
    // Nếu sản phẩm ko có ảnh trong DB thì mới dùng ảnh mặc định
    const defaultImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";

    const displayPrice = product.price > 0 
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) 
        : "Liên hệ";
    
    const specs = product.specifications || {};

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
        {isUsed && product.condition && (
          <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Cũ {Math.round(product.condition * 100)}%</span>
        )}

        {product.stockCount === 0 && (
          <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>
        )}

        {/* ẢNH LẤY TỪ DB MODEL */}
        <div className={`overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2 ${product.stockCount === 0 ? 'opacity-50 grayscale-[50%]' : ''}`}>
          <img 
            src={product.image || defaultImage} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" 
          />
        </div>

        <div className="flex-1 flex flex-col">
          <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-[#007bff] transition-colors">{product.name}</h4>
          <p className="text-red-600 font-bold text-lg mb-3">{displayPrice}</p>

          <div className="flex flex-wrap gap-2 mt-auto mb-4">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><Smartphone size={12} className="text-gray-400" /> {specs.screenSize || "N/A"}</div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><HardDrive size={12} className="text-gray-400" /> {specs.internalStorage || "N/A"}</div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md w-full truncate"><Cpu size={12} className="text-gray-400" /> <span className="truncate">{specs.chipset || "N/A"}</span></div>
          </div>

          <Link 
            to={`/product/${product._id}`} 
            className={`mt-auto w-full text-center py-2.5 rounded-lg font-semibold transition-colors ${
              product.stockCount > 0 
                ? "bg-[#f0f7ff] text-[#007bff] border border-[#cce5ff] hover:bg-[#007bff] hover:text-white" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            {product.stockCount > 0 ? "Xem chi tiết" : "Hết hàng"}
          </Link>
        </div>
      </div>
    );
  };

  if (loading) return <CustomerLayout><div className="min-h-[60vh] flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#007bff]"></div><p className="text-gray-500 font-medium mt-4">Đang tải dữ liệu sản phẩm...</p></div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div className="w-full pb-10">
        <div className="bg-gradient-to-r from-blue-800 to-blue-500 text-white rounded-2xl overflow-hidden mb-12 shadow-lg relative">
          <div className="py-12 px-8 flex flex-col md:flex-row items-center z-10 relative">
              <div className="md:w-3/5 space-y-4">
                  <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Khuyến mãi HOT</span>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-md">Sắm Điện Thoại Sang <br/> Rinh Ngàn Ưu Đãi</h2>
                  <p className="text-blue-100 text-lg max-w-md drop-shadow-sm">Hỗ trợ thu cũ đổi mới trợ giá lên đến 2 triệu đồng. Trả góp 0% lãi suất.</p>
              </div>
              <div className="md:w-2/5 mt-8 md:mt-0 flex justify-center">
                  <img src="https://shopdunk.com/images/uploaded/banner/banner%202024/thang%203/ip15%20prm%20pc.png" alt="Banner" className="max-w-full h-auto drop-shadow-2xl scale-110" />
              </div>
          </div>
        </div>

        {newPhones.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-gray-800 uppercase flex items-center gap-2"><span className="w-1.5 h-7 bg-[#007bff] rounded-full inline-block"></span>Điện Thoại Mới Chính Hãng</h3><Link to="/category/new" className="text-[#007bff] font-medium hover:underline text-sm md:text-base transition">Xem tất cả &rarr;</Link></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{newPhones.map(product => (<ProductCard key={product._id} product={product} isUsed={false} />))}</div>
          </div>
        )}

        {usedPhones.length > 0 && (
          <div className="mb-10 p-6 bg-red-50/50 rounded-2xl border border-red-100">
            <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-red-600 uppercase flex items-center gap-2"><span className="w-1.5 h-7 bg-red-600 rounded-full inline-block"></span>Máy Cũ Giá Rẻ - Trợ Giá Thu Cũ</h3><Link to="/category/used" className="text-red-600 font-medium hover:underline text-sm md:text-base transition">Xem tất cả &rarr;</Link></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{usedPhones.map(product => (<ProductCard key={product._id} product={product} isUsed={true} />))}</div>
          </div>
        )}

        {newPhones.length === 0 && usedPhones.length === 0 && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300">Chưa có sản phẩm nào trong hệ thống.</div>
        )}
      </div>
    </CustomerLayout>
  );
}