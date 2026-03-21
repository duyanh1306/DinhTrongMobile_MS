import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Cpu, HardDrive, MapPin, ChevronDown } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import CustomerLayout from "../../layouts/CustomerLayout";

export default function Home() {
  const [newPhones, setNewPhones] = useState([]);
  const [usedPhones, setUsedPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(localStorage.getItem('selectedStoreId') || "");

  useEffect(() => {
    const fetchAndCombineData = async () => {
      try {
        setLoading(true);
        const [modelsRes, phonesRes, storesRes] = await Promise.all([
          axiosClient.get('/phone_models/all'),
          axiosClient.get('/phones/all'),
          axiosClient.get('/stores/all')
        ]);

        const storeData = storesRes.data.data || storesRes.data || [];
        setStores(storeData);

        let activeStore = selectedStore;
        if (!activeStore && storeData.length > 0) {
            activeStore = storeData[0]._id;
            setSelectedStore(activeStore);
            localStorage.setItem('selectedStoreId', activeStore);
        }

        const phoneModels = modelsRes.data.data || [];
        const phones = phonesRes.data.data || [];

        const combinedData = phoneModels.map(model => {
          const allModelPhones = phones.filter(p => {
              const pStoreId = p.storeId?._id || p.storeId;
              const pModelId = p.phoneModelId?._id || p.phoneModelId;
              return (String(pModelId) === String(model._id)) && (String(pStoreId) === String(activeStore));
          });
          
          const availablePhones = allModelPhones.filter(p => p.status === 'in_stock');

          let startingPrice = Number(model.price) || 0;
          
          if (allModelPhones.length > 0) {
            const validPrices = allModelPhones
              .map(p => {
                const sp = Number(p.sellingPrice);
                if (sp > 0) return sp;
                const ip = Number(p.importPrice);
                if (ip > 0) return ip * 1.15;
                return 0;
              }).filter(price => !isNaN(price) && price > 0);
              
            if (validPrices.length > 0) startingPrice = Math.min(...validPrices);
          }

          let displayImage = model.image;
          const phoneWithImage = allModelPhones.find(p => p.specificImages && p.specificImages.length > 0);
          if (phoneWithImage) displayImage = phoneWithImage.specificImages[0];

          return { 
              ...model, 
              image: displayImage, 
              price: startingPrice, 
              stockCount: availablePhones.length,
              totalRecords: allModelPhones.length 
          };
        }).filter(model => model.totalRecords > 0); // 🌟 CHỈ HIỆN KHI CỬA HÀNG ĐÃ TỪNG NHẬP MÁY NÀY

        const newList = combinedData.filter(p => p.condition === 1 || p.condition === undefined);
        const usedList = combinedData.filter(p => p.condition < 1);

        setNewPhones(newList);
        setUsedPhones(usedList);
      } catch (error) {
        toast.error("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineData();
  }, [selectedStore]);

  const handleStoreChange = (e) => {
      const storeId = e.target.value;
      setSelectedStore(storeId);
      localStorage.setItem('selectedStoreId', storeId);
      window.dispatchEvent(new Event('storeChanged'));
  };

  const ProductCard = ({ product, isUsed }) => {
    const defaultImage = "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png";
    const displayPrice = product.price > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price) : "Đang cập nhật";
    const specs = product.specifications || {};

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 group border border-gray-100 relative flex flex-col h-full">
        {isUsed && product.condition && <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md z-10">Cũ {Math.round(product.condition * 100)}%</span>}
        {product.stockCount === 0 && <span className="absolute top-3 right-3 bg-gray-500/90 text-white text-[11px] font-bold px-2 py-1 rounded-md z-10">Tạm hết hàng</span>}
        
        <Link to={`/product/${product._id}`} className="overflow-hidden rounded-lg mb-4 flex justify-center items-center h-48 p-2">
          <img src={product.image || defaultImage} alt={product.name} className="max-h-full max-w-full object-contain group-hover:-translate-y-2 transition-transform duration-300" />
        </Link>
        <div className="flex-1 flex flex-col">
          <Link to={`/product/${product._id}`}><h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-[#007bff] transition-colors">{product.name}</h4></Link>
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

  if (loading) return <CustomerLayout><div className="min-h-[60vh] flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#007bff]"></div></div></CustomerLayout>;

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

        {newPhones.length === 0 && usedPhones.length === 0 && !loading && (
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