import { object, string } from "zod";

export const signInSchema = object({
  email: string({ required_error: "Email is required" }).min(1, "Email is required").email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(2, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const signUpSchema = object({
  firstName: string({ required_error: "First Name is Required" }).min(1, "First Name is Required"),
  lastName: string({ required_error: "Last Name is Required" }).min(1, "Last Name is Required"),
  email: string({ required_error: "Email is required" }).min(1, "Email is required").email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(2, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});
