"use server";

import db from "./db";
import { Subscription } from "./supabase.types";

export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (subscription, { eq }) => eq(subscription.userId, userId),
    });
    if (data) {
      return { data: data as Subscription, error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    console.log("Error in getUserSubscriptionStatus", error);
    return { data: null, error: null };
  }
};
