// server/src/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export const configurePassport = () => {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email  = profile.emails[0].value;
      const avatar = profile.photos[0]?.value;

      let user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        user.avatar   = avatar;
        await user.save();
      } else {
        user = await User.create({
          name:     profile.displayName,
          email,
          googleId: profile.id,
          avatar,
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
};

export default passport;