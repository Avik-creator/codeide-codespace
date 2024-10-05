"use server";

import connectDB from "@/lib/db";
import { User } from "@/models/user";
import { hash } from "bcryptjs";
import { signInSchema, signUpSchema } from "@/lib/zod";
import { signIn } from "@/auth";

export async function login(formData: FormData) {
  try {
    const { email, password } = signInSchema.parse({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    const response = await signIn("credentials", {
      redirect: false,
      callbackUrl: "/",
      email,
      password,
    });

    if (response?.error) {
      return { error: response.error };
    }

    return {
      success: true,
      message: "Logged in successfully",
    };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function register(formData: FormData) {
  try {
    await connectDB();

    const { firstName, lastName, email, password } = signUpSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const existingUser = await User.findOne({ email });
    if (existingUser) return { error: "User already exists" };

    const hashedPassword = await hash(password, 12);
    await User.create({ firstName, lastName, email, password: hashedPassword });

    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred during registration" };
  }
}
