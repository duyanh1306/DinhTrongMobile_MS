import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Cpu, HardDrive, MapPin, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import CustomerLayout from "../../layouts/CustomerLayout";

import { fetchHomeDataApi } from "../../api/customer/home";


const BANNER_IMAGES = [
    "https://res.cloudinary.com/dtjfxho13/image/upload/v1/Frame21472288341_dht1ib",
    "https://res.cloudinary.com/dtjfxho13/image/upload/v1/REDMI-NOTE-15-HOME-0225_ta5u4v",
    "https://res.cloudinary.com/dtjfxho13/image/upload/v1/690x300_open_iPhone_17e_g9sgh9"
];

export default function Home() {
  const [newPhones, setNewPhones] = useState([]);
  const [usedPhones, setUsedPhones] = useState([]);
  const [assembledPhones, setAssembledPhones] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(localStorage.getItem('selectedStoreId') || "");

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % BANNER_IMAGES.length);
      }, 5000);
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchHomeDataApi(selectedStore);
      
      if (data) {
          setStores(data.stores);
          if (data.activeStore !== selectedStore) {
              setSelectedStore(data.activeStore);
              localStorage.setItem('selectedStoreId', data.activeStore);
          }
          setNewPhones(data.newPhones);
          setUsedPhones(data.usedPhones);
          setAssembledPhones(data.assembledPhones || []); 
      }
      setLoading(false);
    };

    loadData();
  }, [selectedStore]);

  const handleStoreChange = (e) => {
      const storeId = e.target.value;
      setSelectedStore(storeId);
      localStorage.setItem('selectedStoreId', storeId);
      window.dispatchEvent(new Event('storeChanged'));
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % BANNER_IMAGES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + BANNER_IMAGES.length) % BANNER_IMAGES.length);

  const ProductCard = ({ product, isUsed, isAssembled }) => {
    const defaultImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";
    const displayPrice = product.price > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : "Đang cập nhật";
    const specs = product.specifications || {};

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
        {isUsed && <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Máy Cũ</span>}
        {isAssembled && <span className="absolute top-3 left-3 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Máy Dựng</span>}
        {product.stockCount === 0 && <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>}
        
        <Link to={`/product/${product._id}`} state={{ defaultIsUsed: isUsed, defaultPrice: product.price, isAssembled: isAssembled }} className="overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2">
          <img src={product.image || defaultImage} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
        </Link>
        <div className="flex-1 flex flex-col">
          <Link to={`/product/${product._id}`} state={{ defaultIsUsed: isUsed, defaultPrice: product.price, isAssembled: isAssembled }}><h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h4></Link>
          <p className="text-red-600 font-bold text-lg mb-3">{displayPrice}</p>
          <div className="flex flex-wrap gap-2 mt-auto mb-4">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><Smartphone size={12} className="text-gray-400" /> {specs.screenSize || "N/A"}</div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md"><HardDrive size={12} className="text-gray-400" /> {specs.internalStorage || "N/A"}</div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-1 rounded-md w-full truncate"><Cpu size={12} className="text-gray-400" /> <span className="truncate">{specs.chipset || "N/A"}</span></div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <CustomerLayout><div className="min-h-[60vh] flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div></div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div className="w-full pb-10">
        <div className="flex justify-end mb-4 mt-2 pr-4 lg:pr-0">
            <div className="relative inline-block z-20">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white" size={18} />
                <select value={selectedStore} onChange={handleStoreChange} className="appearance-none bg-[#e01a22] text-white text-sm font-bold py-2 pl-9 pr-8 rounded-lg outline-none cursor-pointer hover:bg-red-700 transition shadow-md">
                    {stores.map(s => <option key={s._id} value={s._id} className="bg-white text-gray-800">{s.name} - {s.location || s.address}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
            </div>
        </div>

      
        <div className="relative w-full rounded-2xl mb-12 group bg-white overflow-hidden h-[180px] sm:h-[250px] md:h-[350px] lg:h-[400px] shadow-md border border-gray-100">
            {BANNER_IMAGES.map((img, idx) => (
                <div 
                    key={idx} 
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                   <img src={img} alt={`Banner ${idx + 1}`} className="w-full h-full object-contain object-center bg-gray-50" />
                </div>
            ))}
            
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-white/90 text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md">
                <ChevronLeft size={24} />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-white/90 text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md">
                <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {BANNER_IMAGES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentSlide ? 'bg-blue-600 w-8' : 'bg-white/60 hover:bg-white w-2.5'}`}
                    />
                ))}
            </div>
        </div>

        {newPhones.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-gray-800 uppercase flex items-center gap-2"><span className="w-1.5 h-7 bg-blue-600 rounded-full inline-block"></span>Điện Thoại Mới Chính Hãng</h3><Link to="/category/new" className="text-blue-600 font-medium hover:underline text-sm md:text-base transition">Xem tất cả &rarr;</Link></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{newPhones.map(product => (<ProductCard key={product._id} product={product} isUsed={false} isAssembled={false} />))}</div>
          </div>
        )}

        {usedPhones.length > 0 && (
          <div className="mb-14 p-6 bg-red-50/50 rounded-2xl border border-red-100">
            <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-red-600 uppercase flex items-center gap-2"><span className="w-1.5 h-7 bg-red-600 rounded-full inline-block"></span>Máy Cũ Giá Rẻ - Trợ Giá Thu Cũ</h3><Link to="/category/used" className="text-red-600 font-medium hover:underline text-sm md:text-base transition">Xem tất cả &rarr;</Link></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{usedPhones.map(product => (<ProductCard key={product._id} product={product} isUsed={true} isAssembled={false} />))}</div>
          </div>
        )}

        {assembledPhones.length > 0 && (
          <div className="mb-10 p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-purple-700 uppercase flex items-center gap-2"><span className="w-1.5 h-7 bg-purple-600 rounded-full inline-block"></span>Máy Dựng (Tân Trang) Chuyên Nghiệp</h3><Link to="/category/assembled" className="text-purple-600 font-medium hover:underline text-sm md:text-base transition">Xem tất cả &rarr;</Link></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{assembledPhones.map(product => (<ProductCard key={product._id} product={product} isUsed={false} isAssembled={true} />))}</div>
          </div>
        )}

        {newPhones.length === 0 && usedPhones.length === 0 && assembledPhones.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                <Smartphone className="mx-auto h-16 w-16 text-gray-300 mb-4"/>
                <h3 className="text-lg font-bold text-gray-700">Cửa hàng này hiện chưa có sản phẩm nào!</h3>
                <p className="text-gray-500">Vui lòng chọn cửa hàng khác ở trên góc phải.</p>
            </div>
        )}
      </div>
    </CustomerLayout>
  );
}