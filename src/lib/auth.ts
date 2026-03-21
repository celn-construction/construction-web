import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/server/db";
import { sendVerificationOTPEmail } from "@/lib/email";

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.APP_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp, type }) {
        await sendVerificationOTPEmail(email, otp, type);
      },
    }),
  ],
  trustedOrigins: (request: Request) => {
    const origin = request.headers.get("origin") ?? "";
    // In development, trust any localhost port (Conductor uses dynamic ports)
    if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return [origin];
    }
    return [
      process.env.APP_URL ?? "",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
      process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "",
    ].filter(Boolean);
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  pages: {
    signIn: "/sign-in",
    signUp: "/sign-up",
  },
});

export type Session = typeof auth.$Infer.Session;
