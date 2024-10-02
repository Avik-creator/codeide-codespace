import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
});

export async function POST(request: NextRequest) {
  const { amount, currency, planName, containerLimit, userId } = (await request.json()) as {
    amount: string;
    currency: string;
    planName: string;
    containerLimit: number;
    userId: string;
  };

  const options = {
    amount: amount,
    currency: currency,
    receipt: "rcp1",
    notes: {
      planName: planName,
      containerLimit: containerLimit,
      userId: userId,
    },
  };
  const order = await razorpay.orders.create(options);
  console.log(order);
  return NextResponse.json({ orderId: order.id }, { status: 200 });
}
