import { Payment } from "@/models/payment";
import { Container } from "@/models/container";
import { User } from "@/models/user";
import connectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // Parse the incoming JSON payload
    const bodyreq = await req.json();

    // Ensure the webhook contains the expected data
    if (!bodyreq || !bodyreq.payload) {
      return NextResponse.json({ isOk: false, message: "Invalid webhook payload" }, { status: 400 });
    }

    // Check if 'payment' and 'order' entities exist in the payload
    const paymentEntity = bodyreq.payload.payment?.entity;
    const orderEntity = bodyreq.payload.order?.entity;

    if (!paymentEntity || !orderEntity) {
      return NextResponse.json({ isOk: false, message: "Invalid webhook structure" }, { status: 400 });
    }

    // Log the webhook details for debugging
    console.log("Webhook received:", paymentEntity);
    console.log("Event type:", orderEntity);

    const eventType = bodyreq.event;
    if (eventType !== "order.paid") {
      return NextResponse.json({ isOk: false, message: "Invalid event type" }, { status: 400 });
    }

    // Extract payment and order details from the webhook payload
    const userId = orderEntity.notes?.userId;
    const razorpay_order_id = orderEntity.id;
    const razorpay_payment_id = paymentEntity.id;
    const paymentStatus = paymentEntity.status;

    const secret = process.env.NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json({ isOk: false, message: "Internal Server Error" }, { status: 500 });
    }

    // Connect to the database
    await connectDB();

    // Extract the custom fields (planName and containerLimit) from the notes field
    const planName = orderEntity?.notes?.planName;
    const containerLimit = parseInt(orderEntity?.notes?.containerLimit, 10);

    // Validate the extracted data
    if (!planName || isNaN(containerLimit)) {
      return NextResponse.json({ isOk: false, message: "Missing required fields in order notes" }, { status: 400 });
    }

    // Create a new payment record in your database
    const newPayment = new Payment({
      user: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: paymentEntity.amount,
      currency: paymentEntity.currency,
      status: paymentStatus === "captured" ? "completed" : "pending",
      planName: planName,
      containerLimit: containerLimit,
    });

    await newPayment.save();

    // Update user's container limit in the database
    const container = await Container.findOne({ user: newPayment.user });

    if (!container) {
      // If no container document exists, create a new one
      const user = await User.findById(newPayment.user);
      if (!user) {
        return NextResponse.json({ isOk: false, message: "User not found" }, { status: 404 });
      }
      const newContainer = new Container({
        user: user._id,
        maximumContainers: containerLimit, // Initialize with the limit
      });

      console.log("Creating new container document for user:", newContainer);
      await newContainer.save();
    } else {
      // Update the existing container document
      container.maximumContainers += containerLimit;
      console.log("Updating container document for user:", container);
      await container.save();
    }

    // Send success response
    return NextResponse.json({ isOk: true, message: "Payment processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error processing RazorPay webhook:", error);
    return NextResponse.json({ isOk: false, message: "Internal Server Error" }, { status: 500 });
  }
}
