"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Script from "next/script";
import { getSession } from "@/lib/getSession";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const plans = [
    {
      name: "Free",
      price: "Free",
      containers: 5,
      description: "For hobby projects",
      disabled: true,
      purchaseButton: "You are already in Free",
      priceId: null,
    },
    {
      name: "Standard",
      price: 499,
      containers: 10,
      description: "For small businesses",
      disabled: false,
      purchaseButton: "Purchase",
      priceId: "price_1Q5T7nSICliFlITHXWx728tM",
    },
    {
      name: "Premium",
      price: 599,
      containers: 15,
      description: "For growing businesses",
      disabled: false,
      purchaseButton: "Purchase",
      priceId: "price_1Q5T82SICliFlITHNAbqb6st",
    },
  ];

  const createOrderId = async (amount: number, planName: string, containerLimit: number) => {
    try {
      const session = await getSession();

      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency: "INR",
          planName: planName,
          containerLimit: containerLimit,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      return data.orderId;
    } catch (error) {
      console.error("There was a problem with your fetch operation:", error);
    }
  };

  const processPayment = async (plan: any) => {
    const session = await getSession();
    setLoading(true);
    try {
      const orderId = await createOrderId(plan.price, plan.name, plan.containers);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: plan.price * 100,
        currency: "INR",
        name: "CodeIDE",
        description: `${plan.name} Plan Purchase`,
        order_id: orderId,
        handler: async function (response: any) {
          const data = {
            orderCreationId: orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          };

          const result = await fetch("/api/verify", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
          });
          const res = await result.json();
          if (res.isOk) {
            alert("Payment successful!");
            router.push("/dashboard");
          } else {
            alert(res.message);
          }
        },
        prefill: {
          name: session?.user?.name,
          email: session?.user?.email,
        },
        theme: {
          color: "#3399cc",
        },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response: any) {
        alert(response.error.description);
      });
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <section className="w-full py-12">
        <div className="container px-4 md:px-6">
          <div className="mb-8 space-y-4 text-center">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">Pricing Plans</h1>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choose the plan that best fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-3xl font-bold">₹{plan.price}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      <span>Upto {plan.containers} containers</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      24/7 support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    disabled={plan.disabled || loading}
                    className="w-full"
                    onClick={() => !plan.disabled && processPayment(plan)}
                  >
                    {loading ? "Processing..." : plan.purchaseButton}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
