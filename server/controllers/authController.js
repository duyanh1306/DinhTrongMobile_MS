const User = require("../models/User"); 
const Role = require("../models/Role");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Store = require("../models/Store");
const { sendEmail } = require("../utils/sendEmail");


const isValidPassword = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return regex.test(password);
};

// --- 1. ĐĂNG KÝ (Gửi OTP) ---
exports.register = async (req, res) => {
  try {
    const { fullName, userName, password, email, number, address, birthday } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { userName }, { number }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email này đã được sử dụng." });
      }
      if (existingUser.userName === userName) {
        return res.status(400).json({ message: "Tên đăng nhập này đã tồn tại." });
      }
      if (existingUser.number === number) {
        return res.status(400).json({ message: "Số điện thoại này đã được đăng ký cho một tài khoản khác." });
      }
    }

    const customerRole = await Role.findOne({ id: "CUSTOMER" });
    if (!customerRole) {
      return res.status(500).json({ message: "Lỗi hệ thống: Không tìm thấy phân quyền Khách hàng." });
    }
    
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Mật khẩu phải tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const newUser = new User({
      fullName,
      userName,
      password: hashedPassword,
      email,
      number,
      address,
      birthday,
      roleId: customerRole._id, 
      status: "pending", 
    });

    await newUser.save();

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await new Otp({ email, otp: otpCode }).save();

    await sendEmail(email, "Xác thực tài khoản - DinhTrongMobile", `Mã OTP của bạn là: ${otpCode}. Mã sẽ hết hạn sau 5 phút.`);

    res.status(201).json({ message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực OTP." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. XÁC THỰC OTP (Kích hoạt tài khoản) ---
exports.verifyOtpRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tìm thấy thông tin người dùng." });

    user.status = "active";
    await user.save();
    await Otp.deleteMany({ email });

    res.status(200).json({ message: "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. ĐĂNG NHẬP ---
exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName }).populate("roleId"); 
    if (!user) {
      return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Tài khoản của bạn chưa được kích hoạt hoặc đang bị khóa." });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        roleId: user.roleId._id, 
        roleName: user.roleId.id 
      },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );

    const { password: _, ...userInfo } = user._doc;
    let userStoreId = null;
    let userStoreName = null;
    
    if (user.roleId.id !== "CUSTOMER") {
        const userStore = await Store.findOne({ staff: user._id });
        if (userStore) {
            userStoreId = userStore._id;
            userStoreName = userStore.name;
        }
    }

    const finalUserInfo = {
        ...userInfo,
        storeId: userStoreId,
        storeName: userStoreName
    };

    res.status(200).json({
      message: "Đăng nhập thành công!",
      token,
      user: finalUserInfo,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 4. QUÊN MẬT KHẨU (Gửi OTP) ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email này chưa được đăng ký trong hệ thống." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await Otp.deleteMany({ email });
    await new Otp({ email, otp: otpCode }).save();

    await sendEmail(email, "Yêu cầu khôi phục mật khẩu - DinhTrongMobile", `Mã OTP để đặt lại mật khẩu của bạn là: ${otpCode}`);

    res.status(200).json({ message: "Đã gửi mã xác thực OTP đến email của bạn." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// --- 4.5. KIỂM TRA OTP HỢP LỆ (Bước trung gian cho Quên mật khẩu) ---
exports.verifyOtpReset = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const validOtp = await Otp.findOne({ email, otp });
    
    if (!validOtp) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn." });
    }
    
    res.status(200).json({ message: "Xác thực OTP thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 5. ĐẶT LẠI MẬT KHẨU MỚI ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn." });
    }

    const user = await User.findOne({ email });
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu mới phải tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt." });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await Otp.deleteMany({ email });

    res.status(200).json({ message: "Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 6. XỬ LÝ CALLBACK SAU KHI LOGIN GOOGLE THÀNH CÔNG ---
exports.googleAuthCallback = (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Xác thực tài khoản Google thất bại." });

    const token = jwt.sign(
      { id: user._id, roleId: user.roleId._id, roleName: user.roleId.id },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );

    const { password: _, ...userInfo } = user._doc ? user._doc : user;

    const userString = encodeURIComponent(JSON.stringify(userInfo));
    
    const ipAddr = process.env.IP_ADDRESS || "http://localhost:3000";
    
    res.redirect(`${ipAddr}/login-success?token=${token}&user=${userString}`);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 7. CẬP NHẬT PROFILE & AVATAR ---
exports.updateProfile = async (req, res) => {
  try {
    const { userId, fullName, number, address, birthday } = req.body;
    const updateData = { fullName, number, address, birthday };

    if (req.file) {
      updateData.image = `/uploads/avatar/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).populate("roleId");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const { password: _, ...userInfo } = updatedUser._doc;
    res.status(200).json({ message: "Cập nhật hồ sơ cá nhân thành công!", user: userInfo });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 8. ĐỔI MẬT KHẨU (Cho người đã đăng nhập) ---
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy thông tin người dùng." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác." });

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu mới phải tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ viết hoa và 1 ký tự đặc biệt." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};