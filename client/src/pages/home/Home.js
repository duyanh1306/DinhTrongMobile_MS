import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div>
      {/* Navbar đơn giản */}
      <nav className="bg-primary p-4 text-white flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">DinhTrongMobile</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block">Xin chào, {user.fullName}</span>
              <img src={user.image || "https://via.placeholder.com/40"} className="w-8 h-8 rounded-full border bg-white" alt="Avatar"/>
              <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="bg-white text-primary px-4 py-1 rounded font-bold hover:bg-gray-100">Đăng Nhập</Link>
          )}
        </div>
      </nav>

      {/* Banner */}
      <div className="bg-gray-800 text-white py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">iPhone 15 Pro Max - Sẵn Hàng</h2>
        <p className="mb-6">Giá tốt nhất thị trường - Bảo hành 12 tháng</p>
        <button className="bg-secondary px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition">Mua Ngay</button>
      </div>

      {/* Product Grid Mockup */}
      <div className="container mx-auto p-6">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Sản phẩm nổi bật</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
                <div key={item} className="border rounded-lg p-4 hover:shadow-xl transition bg-white">
                    <img src="https://via.placeholder.com/200" alt="Phone" className="w-full h-40 object-cover mb-4 rounded"/>
                    <h4 className="font-bold text-lg">iPhone 14 Plus</h4>
                    <p className="text-red-600 font-bold">18.000.000đ</p>
                    <button className="mt-3 w-full border border-primary text-primary py-1 rounded hover:bg-primary hover:text-white transition">Chi tiết</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
