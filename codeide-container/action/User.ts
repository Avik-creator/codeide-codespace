import connectDB from "@/lib/db";
import { User } from "@/models/user";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { signInSchema, signUpSchema } from "@/lib/zod";

import { signIn } from "@/auth";

export async function login(formData: FormData): Promise<void> {
  const { email, password } = signInSchema.parse({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  await signIn("credentials", {
    redirect: false,
    callbackUrl: "/signin",
    email,
    password,
  });

  // Successful login
  redirect("/dashboard");
}

export const register = async (formData: FormData) => {
  const { email, password, firstName, lastName } = signUpSchema.parse({
    firstname: formData.get("firstname"),
    lastname: formData.get("lastname"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  await connectDB();

  // existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await hash(password, 12);

  await User.create({ firstName, lastName, email, password: hashedPassword });
  console.log(`User created successfully 🥂`);
  redirect("/");
};
