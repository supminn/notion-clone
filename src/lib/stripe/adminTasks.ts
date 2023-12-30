import Stripe from "stripe";
import { Price, Product, Subscription } from "../supabase/supabase.types";
import {
  customers,
  prices,
  products,
  subscriptions,
  users,
} from "../../../migrations/schema";
import db from "../supabase/db";
import { stripe } from "./index";
import { eq } from "drizzle-orm";
import { toDateTime } from "../utils";

// tasks that our admin would create
export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? "",
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };
  try {
    await db.insert(products).values(productData).onConflictDoUpdate({
      target: products.id,
      set: productData,
    });
  } catch (error) {
    throw new Error(`Could not insert/update the product: ${error}`);
  }
  console.log("Product inserted/updated: ", product.id);
};

export const upsertPriceRecord = async (price: Stripe.Price) => {
  // this function would be invoked using the webhook
  const priceData: Price = {
    id: price.id,
    productId: typeof price.product === "string" ? price.product : null,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unitAmount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? null,
    trialPeriodDays: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };
  try {
    await db
      .insert(prices)
      .values(priceData)
      .onConflictDoUpdate({ target: prices.id, set: priceData });
  } catch (error) {
    throw new Error(`Could not insert/update the price: ${error}`);
  }
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetriveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  try {
    const response = await db.query.customers.findFirst({
      where: (customer, { eq }) => eq(customer.id, uuid),
    });
    if (!response) throw new Error();
    return response.stripeCustomerId;
  } catch (error) {
    const customerData: { metadata: { supabaseUUID: string }; email?: string } =
      {
        metadata: {
          supabaseUUID: uuid,
        },
      };
    if (email) customerData.email = email;
    try {
      const customer = await stripe.customers.create(customerData);
      await db
        .insert(customers)
        .values({ id: uuid, stripeCustomerId: customer.id });
      console.log(`New customer created and inserted for ${uuid}`);
      return customer.id;
    } catch (stripeError) {
      throw new Error(
        `Could not create customer or find the custmomer: ${stripeError}`
      );
    }
  }
};

export const copyBillingDetailsToCustomer = async (
  uuid: string,
  paymentMethod: Stripe.PaymentMethod
) => {
  const customer = paymentMethod.customer as string;
  const { name, phone, address } = paymentMethod.billing_details;
  if (!name || !phone || !address) return;
  // @ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  try {
    await db
      .update(users)
      .set({
        billingAddress: { ...address },
        paymentMethod: { ...paymentMethod[paymentMethod.type] },
      })
      .where(eq(users.id, uuid));
  } catch (error) {
    throw new Error(`Could not copy customer billing details: ${error}`);
  }
};

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  try {
    const customerData = await db.query.customers.findFirst({
      where: (customer, { eq }) => eq(customer.id, customerId),
    });
    if (!customerData) throw new Error("Cannot find customer");
    const { id: uuid } = customerData;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"],
    });
    const subscriptionData: Subscription = {
      id: subscription.id,
      userId: uuid,
      metadata: subscription.metadata,
      //@ts-ignore
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      //@ts-ignore
      quantity: subscription.quantity,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at
        ? toDateTime(subscription.cancel_at).toISOString()
        : null,
      canceledAt: subscription.canceled_at
        ? toDateTime(subscription.canceled_at).toISOString()
        : null,
      currentPeriodStart: toDateTime(
        subscription.current_period_start
      ).toISOString(),
      currentPeriodEnd: toDateTime(
        subscription.current_period_end
      ).toISOString(),
      endedAt: subscription.ended_at
        ? toDateTime(subscription.ended_at).toISOString()
        : null,
      trialStart: subscription.trial_start
        ? toDateTime(subscription.trial_start).toISOString()
        : null,
      trialEnd: subscription.trial_end
        ? toDateTime(subscription.trial_end).toISOString()
        : null,
    };
    await db
      .insert(subscriptions)
      .values(subscriptionData)
      .onConflictDoUpdate({ target: subscriptions.id, set: subscriptionData });
    console.log(
      `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`
    );
    if (createAction && subscription.default_payment_method && uuid) {
      await copyBillingDetailsToCustomer(
        uuid,
        subscription.default_payment_method as Stripe.PaymentMethod
      );
    }
  } catch (error) {
    console.log(` ${error}`);
  }
};
