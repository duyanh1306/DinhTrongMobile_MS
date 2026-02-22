const User = require("../models/User");
const bcrypt = require("bcrypt");

// Lấy danh sách tất cả user (Có populate để lấy thông tin Role)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("roleId", "id name") // Lấy field 'id' và 'name' của bảng Role
      .sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy thông tin 1 user theo ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("roleId", "id name");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo user mới (Thường dùng để tạo Staff)
const createUser = async (req, res) => {
  try {
    const { fullName, userName, password, email, number, birthday, roleId, status, address } = req.body;

    // Kiểm tra xem username hoặc email đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already exists" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      userName,
      password: hashedPassword,
      email,
      number,
      birthday,
      roleId,
      status: status || "active",
      address,
      authType: "local"
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật thông tin user
const updateUser = async (req, res) => {
  try {
    const { fullName, email, number, birthday, roleId, status, address } = req.body;
    
    // Không cho phép cập nhật username và password ở API này
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, number, birthday, roleId, status, address },
      { new: true, runValidators: true }
    ).populate("roleId", "id name");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa user
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset mật khẩu (Dành cho Admin reset pass của Staff)
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
};