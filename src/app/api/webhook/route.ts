import { stripe } from "@/lib/stripe";
import {
  manageSubscriptionStatusChange,
  upsertPriceRecord,
  upsertProductRecord,
} from "@/lib/stripe/adminTasks";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const relevantEvents = new Set([
  "product.created",
  "product.updated",
  "price.created",
  "price.updated",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("Stripe-Signature");

  // In production, we need to change this to endpoint url. This will work only for local enviroment.
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (!signature || !webhookSecret) return;
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.log("Error in webhook POST", error);
    return new NextResponse(`Webhook Error`, { status: 400 });
  }
  if (relevantEvents.has(event.type)) {
    // which event was fired and invoke the corresponding admin functions that we created
    try {
      switch (event.type) {
        case "product.created":
        case "price.updated":
          await upsertProductRecord(event.data.object as Stripe.Product);
          break;
        case "price.created":
        case "price.updated":
          await upsertPriceRecord(event.data.object as Stripe.Price);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            event.type === "customer.subscription.created"
          );
          break;
        }
        case "checkout.session.completed": {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.mode === "subscription") {
            const subscriptionId = checkoutSession.subscription;
            await manageSubscriptionStatusChange(
              subscriptionId as string,
              checkoutSession.customer as string,
              true
            );
          }
          break;
        }
        default:
          throw new Error("Unhandled relavant event");
      }
    } catch (error) {
      console.log("Error in relaventEvents", error);
      return new NextResponse(
        "Webhook error: Webhook handler failed. View logs.",
        { status: 400 }
      );
    }
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
