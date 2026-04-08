const User = require("../models/User");
const Store = require("../models/Store");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs"); 


const getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "roleObj"
        }
      },
      { $unwind: { path: "$roleObj", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stores", 
          localField: "_id", 
          foreignField: "staff", 
          as: "storeObj"
        }
      },
      { $unwind: { path: "$storeObj", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    ]);

   
    const formattedUsers = users.map(u => ({
      ...u,
      roleId: u.roleObj,
      storeId: u.storeObj ? u.storeObj._id : null, 
      storeName: u.storeObj ? u.storeObj.name : null
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy thông tin 1 user theo ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("roleId", "id name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const store = await Store.findOne({ staff: user._id });
    
    const userResponse = {
        ...user._doc,
        storeId: store ? store._id : null,
        storeName: store ? store.name : null
    };

    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo user mới (Thường dùng để tạo Staff)
const createUser = async (req, res) => {
  try {
   
    const { fullName, userName, password, email, number, birthday, roleId, status, address, storeId } = req.body;

    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName, userName, password: hashedPassword, email, number, birthday, roleId, status: status || "active", address, authType: "local"
    });

    const savedUser = await newUser.save();

  
    if (storeId) {
        await Store.findByIdAndUpdate(storeId, { $push: { staff: savedUser._id } });
    }

    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật thông tin user
const updateUser = async (req, res) => {
  try {
    const { fullName, email, number, birthday, roleId, status, address, storeId } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, number, birthday, roleId, status, address },
      { new: true, runValidators: true }
    ).populate("roleId", "id name");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });


    if (storeId !== undefined) {
    
        await Store.updateMany(
            { staff: req.params.id },
            { $pull: { staff: req.params.id } }
        );
      
        if (storeId) {
            await Store.findByIdAndUpdate(storeId, { $push: { staff: req.params.id } });
        }
    }

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

 
    await Store.updateMany(
        { staff: req.params.id },
        { $pull: { staff: req.params.id } }
    );

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset mật khẩu (Dành cho Admin reset pass của Staff)
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "New password is required" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, { password: hashedPassword }, { new: true }
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