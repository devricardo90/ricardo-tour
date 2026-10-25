

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.BETTER_AUTH_URL;

// The official domains are listed explicitly: browser requests carry cookies, so better-auth checks their Origin, and
// with only BETTER_AUTH_URL trusted, sign-up and sign-in from www.ricardotour.com were refused with "Invalid origin".
export const OFFICIAL_ORIGINS = ["https://www.ricardotour.com", "https://ricardotour.com"] as const;

const trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
  ...OFFICIAL_ORIGINS,
  ...(appUrl ? [appUrl] : []),
];

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins,
  // Same origin check in tests as in production (better-auth skips it by default when NODE_ENV is "test").
  advanced: { disableOriginCheck: false },

  emailAndPassword: { enabled: true },

  user: {
    modelName: "User",
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        // Security (RT-129): better-auth accepts additional fields as client input by default. The role is never
        // client input; ADMIN is granted only directly in the database.
        input: false,
      },
    },
  },

  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 24, // 1 dia
    updateAge: 60 * 30,     // renova a cada 30 min se ativo
  },

  account: { modelName: "Account" },
  verification: { modelName: "Verification" },

  plugins: [nextCookies()],
});

