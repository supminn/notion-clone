"use server";

import { validate } from "uuid";
import { files, workspaces } from "../../../migrations/schema";
import db from "./db";
import { File, Subscription, Workspace } from "./supabase.types";
import { eq } from "drizzle-orm";

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

export const createWorkspace = async (workspace: Workspace) => {
  try {
    const response = await db.insert(workspaces).values(workspace);
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in createWorkspace", error);
    return { data: null, error: "Error" };
  }
};

export const getFiles = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: "Error in validate" };
  try {
    const results = (await db
      .select()
      .from(files)
      .orderBy(files.createdAt)
      .where(eq(files.folderId, folderId))) as File[] | [];
    return { data: results, error: null };
  } catch (error) {
    console.log("Error in getFiles", error);
    return { data: null, error: "Error in getFiles" };
  }
};
