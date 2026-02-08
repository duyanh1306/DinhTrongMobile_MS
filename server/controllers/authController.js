const User = require("../models/User"); // Đảm bảo đúng đường dẫn
const Role = require("../models/Role");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// --- 1. ĐĂNG KÝ (Gửi OTP) ---
exports.register = async (req, res) => {
  try {
    const { fullName, userName, password, email, number, address, birthday } = req.body;

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email hoặc Username đã tồn tại" });
    }

    // Mặc định user đăng ký mới sẽ là 'CUSTOMER'
    // Cần tìm _id của Role CUSTOMER trong DB
    const customerRole = await Role.findOne({ id: "CUSTOMER" });
    if (!customerRole) {
      return res.status(500).json({ message: "Lỗi hệ thống: Không tìm thấy Role Customer" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo User mới với status là 'pending'
    const newUser = new User({
      fullName,
      userName,
      password: hashedPassword,
      email,
      number,
      address,
      birthday,
      roleId: customerRole._id, // Gán ID của role Customer
      status: "pending", // Chưa kích hoạt
    });

    await newUser.save();

    // Tạo mã OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào DB
    await new Otp({ email, otp: otpCode }).save();

    // Gửi Email
    await sendEmail(email, "Xác thực tài khoản - DinhTrongMobile", `Mã OTP của bạn là: ${otpCode}. Mã hết hạn sau 5 phút.`);

    res.status(201).json({ message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy OTP." });

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
      return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn" });
    }

    // Kích hoạt User
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    user.status = "active";
    await user.save();

    // Xóa OTP sau khi dùng xong
    await Otp.deleteMany({ email });

    res.status(200).json({ message: "Xác thực thành công! Bạn có thể đăng nhập ngay." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. ĐĂNG NHẬP ---
exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Tìm user và populate role để lấy thông tin role
    const user = await User.findOne({ userName }).populate("roleId"); // populate cần setup ref chuẩn trong User model
    if (!user) {
      return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    // Kiểm tra trạng thái
    if (user.status !== "active") {
      return res.status(403).json({ message: "Tài khoản chưa được kích hoạt hoặc bị khóa" });
    }

    // Tạo Token (Payload chứa thông tin cần thiết)
    const token = jwt.sign(
      { 
        id: user._id, 
        roleId: user.roleId._id, // ID của Role object
        roleName: user.roleId.id // Tên định danh Role (VD: ADMIN, CUSTOMER) để frontend dễ check
      },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );

    // Trả về info (bỏ password)
    const { password: _, ...userInfo } = user._doc;

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: userInfo,
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
      return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Xóa OTP cũ nếu có
    await Otp.deleteMany({ email });
    await new Otp({ email, otp: otpCode }).save();

    await sendEmail(email, "Đặt lại mật khẩu - DinhTrongMobile", `Mã OTP đặt lại mật khẩu của bạn là: ${otpCode}`);

    res.status(200).json({ message: "Đã gửi mã OTP đến email của bạn." });

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
      return res.status(400).json({ message: "OTP không đúng hoặc hết hạn" });
    }

    const user = await User.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Xóa OTP
    await Otp.deleteMany({ email });

    res.status(200).json({ message: "Đổi mật khẩu thành công! Hãy đăng nhập lại." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// --- 6. XỬ LÝ CALLBACK SAU KHI LOGIN GOOGLE THÀNH CÔNG ---
exports.googleAuthCallback = (req, res) => {
    try {
      // Lúc này Passport đã xử lý xong và gắn user vào req.user
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ message: "Xác thực Google thất bại" });
      }
  
      // Tạo Token JWT
      const token = jwt.sign(
        {
          id: user._id,
          roleId: user.roleId._id, // Lấy ID của object Role
          roleName: user.roleId.id, // Lấy tên Role (CUSTOMER, ADMIN...)
        },
        process.env.JWT_KEY,
        { expiresIn: "1d" }
      );
  
      // Ẩn mật khẩu trước khi trả về (dù user google ko có pass, nhưng cứ làm cho chuẩn)
      const { password: _, ...userInfo } = user._doc ? user._doc : user;
  
      res.status(200).json({
        message: "Login Google thành công",
        token,
        user: userInfo,
      });
      
      // Lưu ý: Nếu làm với React Frontend thật, đoạn này thường sẽ redirect
      // res.redirect(`http://localhost:3000/login-success?token=${token}`);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };