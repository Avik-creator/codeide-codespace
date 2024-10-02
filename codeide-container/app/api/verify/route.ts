import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const bodyreq = await req.json();

  console.log("Webhook body:", bodyreq);

  // Correctly accessing the fields from the body
  const orderCreationId = bodyreq?.orderCreationId;
  const razorpay_order_id = bodyreq?.razorpayOrderId; // Corrected
  const razorpay_payment_id = bodyreq?.razorpayPaymentId; // Corrected
  const razorpay_signature = bodyreq?.razorpaySignature; // Corrected

  // Check for missing required fields
  if (!orderCreationId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ isOk: false, message: "Missing required fields" }, { status: 400 });
  }

  const secret = process.env.NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ isOk: false, message: "Internal Server Error" }, { status: 500 });
  }

  try {
    // Create the expected signature using the correct order ID and payment ID
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    // Verify the received signature against the expected signature
    if (expectedSignature === razorpay_signature) {
      console.log("Payment verified");
      return NextResponse.json({ isOk: true, message: "Payment verified" }, { status: 200 });
    } else {
      return NextResponse.json({ isOk: false, message: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying RazorPay payment:", error);
    return NextResponse.json({ isOk: false, message: "Internal Server Error" }, { status: 500 });
  }
}
