const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
const Role = require("../models/Role");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Kiểm tra xem user có tồn tại bằng googleId chưa
        let user = await User.findOne({ googleId: profile.id }).populate("roleId");

        if (user) {
          return done(null, user);
        }

        // 2. Nếu chưa có googleId, kiểm tra xem email đã có trong hệ thống chưa
        // (Trường hợp user đã đăng ký bằng email này trước đó rồi)
        const email = profile.emails[0].value;
        user = await User.findOne({ email }).populate("roleId");

        if (user) {
          // Cập nhật thêm googleId vào tài khoản cũ
          user.googleId = profile.id;
          user.authType = "google";
          user.image = profile.photos[0].value;
          await user.save();
          return done(null, user);
        }

        // 3. Nếu chưa tồn tại -> Tạo User mới
        const customerRole = await Role.findOne({ id: "CUSTOMER" });
        
        // Tạo username ngẫu nhiên từ tên + số đuôi để tránh trùng
        const newUserName = profile.displayName.split(" ").join("").toLowerCase() + Math.floor(Math.random() * 1000);

        const newUser = new User({
          fullName: profile.displayName,
          userName: newUserName,
          email: email,
          googleId: profile.id,
          authType: "google",
          roleId: customerRole._id,
          status: "active", // Login Google thì auto active vì email đã verify
          image: profile.photos[0].value,
          password: "", // Không có pass
          number: "", // Google không trả về sđt mặc định
          address: "Update later", 
          birthday: new Date("2000-01-01"), // Giá trị mặc định
        });

        await newUser.save();
        // Cần populate lại để lấy thông tin role cho JWT
        const savedUser = await User.findById(newUser._id).populate("roleId");
        return done(null, savedUser);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;