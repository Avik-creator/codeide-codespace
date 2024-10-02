"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function Pricing() {
  const [loading, setLoading] = useState(false);

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
      priceId: "price_1Q5T7nSICliFlITHXWx728tM", // Replace with actual Stripe Price ID
    },
    {
      name: "Premium",
      price: 599,
      containers: 15,
      description: "For growing businesses",
      disabled: false,
      purchaseButton: "Purchase",
      priceId: "price_1Q5T82SICliFlITHNAbqb6st", // Replace with actual Stripe Price ID
    },
  ];

  const handlePurchase = async (priceId: string, price: number) => {
    setLoading(true);
    try {
      console.log(priceId, price);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
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
                  onClick={() => plan.priceId && handlePurchase(plan.priceId!, plan.price)}
                >
                  {loading ? "Loading..." : plan.purchaseButton}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
