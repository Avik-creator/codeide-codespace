import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Razorpay from "razorpay";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
});

async function fetchPaymentDetailsFromRazorpay(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);

    // Extract the custom fields from the payment notes
    const notes = payment.notes || {};
    const userId = notes.userId;
    const planName = notes.planName;
    const containerLimit = parseInt(notes.containerLimit, 10);

    // Ensure all required fields are present
    if (!userId || !planName || isNaN(containerLimit)) {
      throw new Error("Missing required fields in payment notes");
    }

    return {
      userId,
      amount: Number(payment.amount) / 100, // Razorpay amount is in paise, convert to rupees
      currency: payment.currency,
      planName,
      containerLimit,
      email: payment.email,
      contact: payment.contact,
    };
  } catch (error) {
    console.error("Error fetching payment details from Razorpay:", error);
    throw error;
  }
}

export default fetchPaymentDetailsFromRazorpay;
