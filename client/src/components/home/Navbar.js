import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const pageTitles = {
  "/": "Home",
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // Kiểm tra đăng nhập

  // Lấy tiêu đề trang động
  let pageTitle = pageTitles[location.pathname] || "ESA";
  if (location.pathname.startsWith('/course/')) {
    pageTitle = "Course Details";
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center relative">
      {/* Page title */}
      <div className="text-gray-600 text-base font-semibold">{pageTitle}</div>

      {/* Dựa vào token để hiển thị nút phù hợp */}
      {token ? (
        // Khi chưa đăng nhập
        <div className="flex items-center gap-4">
          <Link to="/login" className="font-medium text-gray-600 hover:text-indigo-600">
            Login
          </Link>
        </div>
      ) : (
        // Khi chưa đăng nhập
        <div className="flex items-center gap-4">
          <Link to="/login" className="font-medium text-gray-600 hover:text-indigo-600">
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
