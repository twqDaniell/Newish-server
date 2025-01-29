import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/users_model";

const isProduction = process.env.NODE_ENV === "production";
const callbackURL = isProduction ? `https://${process.env.DOMAIN}:${process.env.PORT}/auth/google/callback` : `http://${process.env.DOMAIN}:${process.env.PORT}/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile:", profile);

      try {
        const existingUser = await userModel.findOne({ googleId: profile.id });
        if (existingUser) {
          console.log("User already exists:", existingUser);
          return done(null, existingUser);
        }

        const newUser = await userModel.create({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails?.[0]?.value || "",
          profilePicture: profile.photos?.[0]?.value || "",
          soldItems: 0,
          
        });

        console.log("New user created:", newUser);
        return done(null, newUser);
      } catch (error) {
        console.error("Error during user creation:", error);
        return done(error, null);
      }
    }
  )
);


passport.serializeUser((user: any, done) => {
  done(null, user._id); // Save user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id); // Retrieve user from database
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
