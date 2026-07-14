const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const crypto = require("crypto");

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile received:", profile.id);

        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists with this email
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;

          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.isEmailVerified = true;
              user.verificationSteps.email = true;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const avatar =
            profile.photos && profile.photos[0]
              ? profile.photos[0].value
              : null;

          // Generate a random password for Google users
          const randomPassword = crypto.randomBytes(32).toString("hex");

          user = new User({
            firstName: firstName || "Google",
            lastName: lastName || "User",
            email: email || `${profile.id}@google.user`,
            password: randomPassword,
            googleId: profile.id,
            avatar: avatar,
            isEmailVerified: true,
            verificationSteps: {
              email: true,
              phone: false,
              id: false,
            },
            profileCompleted: false,
            phone: "", // Will be filled in profile completion
          });

          await user.save();
          console.log("New Google user created:", user.email);
        }

        return done(null, user);
      } catch (error) {
        console.error("Google auth error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
