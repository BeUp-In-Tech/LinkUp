/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import User from '../modules/users/user.model';
import bcrypt from 'bcrypt';
import env from './env';
import { Role } from '../modules/users/user.interface';

// CREDENTIALS LOGIN LOCAL STRATEGY
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email: string, password: string, done: any) => {
      try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
          return done(null, false, { message: 'User does not exist!' });
        }

        // Check Google User
        const isGoogleUser = user.auths?.some(
          (provider) => provider.provider === 'google'
        );

        if (isGoogleUser) {
          return done(null, false, {
            message: 'Please Login with Google!',
          });
        }

        // Matching Password
        const isMatchPassowrd = await bcrypt.compare(
          password,
          user.password as string
        );

        if (!isMatchPassowrd) {
          return done(null, false, { message: 'Incorrect password!' });
        }

        return done(null, user);
      } catch (error) {
        console.log('Passport Local login error: ', error);
        done(error);
      }
    }
  )
);

// GOOGLE REGISTRATION
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_OAUTH_ID,
      clientSecret: env.GOOGLE_OAUTH_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async function (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      cb: VerifyCallback
    ) {
      const email = profile.emails?.[0].value;
      if (!email) {
        return cb(null, false, { message: 'No email found' });
      }

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          fullName: profile.displayName,
          email,
          avatar: profile.photos?.[0].value,
          role: Role.USER,
          isVerified: false,
          auths: [
            {
              provider: 'google',
              providerId: profile.id,
            },
          ],
        });
      }

      return cb(null, user);
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error);
  }
});
