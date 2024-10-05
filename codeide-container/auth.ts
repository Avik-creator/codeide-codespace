import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

import { signInSchema } from "./lib/zod";
import { ZodError } from "zod";
import connectDB from "./lib/db";
import { User } from "./models/user";

export const config = {
  unstable_allowDynamic: ["mongoose/dist/browser.umd.js"],
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET as string,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async credentials => {
        try {
          const { email, password } = signInSchema.parse(credentials);

          await connectDB();

          const user = await User.findOne({ email }).select("+password");

          if (!user) {
            return { message: "User not found" };
          }

          const isMatched = await compare(password, user.password);

          if (!isMatched) {
            return { message: "Password is incorrect" };
          }

          return {
            id: user._id,
            name: user.firstName + " " + user.lastName,
            email: user.email,
          };
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        name: token.name,
        email: token.email as string,
        emailVerified: null,
      };
      return session;
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
  },
} as NextAuthConfig);
