import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "wod-tracker-blond.vercel.app",
      "wod-tracker-*-cj-e2ac.vercel.app",
    ],
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()], // keep last
});
