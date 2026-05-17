import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/client.js";
import { logger } from "../utils/logger.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/api/v1/auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || "Google User";
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("Google account email not found"), undefined);
        }

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId },
              { email }
            ]
          }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email,
              username: email.split("@")[0],
              phone: "N/A",
              password: "GOOGLE_OAUTH_USER",
              role: Role.GUEST,
              googleId,
              avatar
            }
          });

          logger.info("Google OAuth user created", {
            userId: user.id,
            email: user.email
          });
        } else if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              avatar: user.avatar || avatar
            }
          });

          logger.info("Google OAuth linked to existing user", {
            userId: user.id,
            email: user.email
          });
        }

        return done(null, {
            userId: user.id,
            role: user.role,
            email: user.email
        });
        
      } catch (error) {
        logger.error("Google OAuth failed", { error });
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;