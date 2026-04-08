const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
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
        
        let user = await User.findOne({ googleId: profile.id }).populate("roleId");

        if (user) {
          return done(null, user);
        }
        const email = profile.emails[0].value;
        user = await User.findOne({ email }).populate("roleId");

        if (user) {
          user.googleId = profile.id;
          user.authType = "google";
          user.image = profile.photos[0].value;
          await user.save();
          return done(null, user);
        }
        const customerRole = await Role.findOne({ id: "CUSTOMER" });
        
        const newUserName = profile.displayName.split(" ").join("").toLowerCase() + Math.floor(Math.random() * 1000);

        const newUser = new User({
          fullName: profile.displayName,
          userName: newUserName,
          email: email,
          googleId: profile.id,
          authType: "google",
          roleId: customerRole._id,
          status: "active", 
          image: profile.photos[0].value,
          password: "", 
          number: "", 
          address: "Update later", 
          birthday: new Date("2000-01-01"), 
        });

        await newUser.save();
        const savedUser = await User.findById(newUser._id).populate("roleId");
        return done(null, savedUser);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;