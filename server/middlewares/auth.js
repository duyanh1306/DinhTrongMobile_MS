const jwt = require("jsonwebtoken");
const Role = require("../models/Role"); 

/**
 * Hàm tạo Middleware kiểm tra quyền hạn động
 * @param {Array} allowedRoleIds - Danh sách các mã role được phép (VD: ['ADMIN', 'SALE_STAFF'])
 */
const checkRole = (allowedRoleIds) => {
  return async (req, res, next) => {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      // 2. Giải mã Token
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      req.user = decoded;

      // 3. Kiểm tra Role từ Database
      // Token chứa roleId (là ObjectId), ta cần tìm Role đó trong DB để lấy trường 'id' (ADMIN,...)
      const role = await Role.findById(decoded.roleId);

      if (!role) {
        return res.status(403).json({ message: "Forbidden: Role not found in system" });
      }

      // 4. So sánh quyền
      // role.id chính là các chuỗi: "ADMIN", "SALE_STAFF", "TECHNICIAN", "CUSTOMER"
      if (!allowedRoleIds.includes(role.id)) {
        return res.status(403).json({ 
          message: `Forbidden: Requires one of roles [${allowedRoleIds.join(", ")}]` 
        });
      }

      next();
    } catch (err) {
      console.error("Auth Error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

// Xuất ra các hàm middleware cụ thể để dễ dùng
module.exports = {
  // Chỉ Admin
  authAdmin: checkRole(["ADMIN"]),
  
  // Chỉ Sale Staff
  authSaleStaff: checkRole(["SALE_STAFF"]),
  
  // Chỉ Technician
  authTechnician: checkRole(["TECHNICIAN"]),
  
  // Chỉ Customer
  authCustomer: checkRole(["CUSTOMER"]),
  
  // Ví dụ: Cho phép cả Admin và Sale Staff (dùng cho các chức năng quản lý đơn hàng)
  authManagement: checkRole(["ADMIN", "SALE_STAFF"]),
  
  // Ví dụ: Cho phép tất cả nhân viên nội bộ (trừ khách hàng)
  authInternal: checkRole(["ADMIN", "SALE_STAFF", "TECHNICIAN"]),

  // Hàm gốc nếu muốn tự custom ở route
  checkRole 
};