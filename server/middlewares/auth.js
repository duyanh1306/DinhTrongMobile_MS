const jwt = require("jsonwebtoken");
const Role = require("../models/Role"); 

/**
 * Hàm tạo Middleware kiểm tra quyền hạn động
 * @param {Array} allowedRoleIds 
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

      const decoded = jwt.verify(token, process.env.JWT_KEY);
      req.user = decoded;
      const role = await Role.findById(decoded.roleId);

      if (!role) {
        return res.status(403).json({ message: "Forbidden: Role not found in system" });
      }
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
  authAdmin: checkRole(["ADMIN"]),
  
  authManager: checkRole(["MANAGER"]),
  authSaleStaff: checkRole(["SALE_STAFF"]),

  authTechnician: checkRole(["TECHNICIAN"]),

  authCustomer: checkRole(["CUSTOMER"]),
  
  authManagement: checkRole(["ADMIN", "MANAGER", "SALE_STAFF"]),
 
  authInternal: checkRole(["ADMIN", "MANAGER", "SALE_STAFF", "TECHNICIAN"]),
  checkRole 
};