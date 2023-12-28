"use server";

import { validate } from "uuid";
import {
  files,
  folders,
  users,
  workspaces,
  collaborators,
} from "../../../migrations/schema";
import db from "./db";
import { File, Folder, Subscription, User, Workspace } from "./supabase.types";
import { and, eq, ilike, notExists } from "drizzle-orm";

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
    return { data: response, error: null }; // we need not return anything in data
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

export const getFolders = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid) return { data: null, error: "Error in validate" };
  try {
    const results: Folder[] | [] = await db
      .select()
      .from(folders)
      .orderBy(folders.createdAt)
      .where(eq(folders.workspaceId, workspaceId));
    return { data: results, error: null };
  } catch (error) {
    console.log("Error in getFolders", error);
    return { data: null, error: "Error in getFolders" };
  }
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid) return { data: [], error: "Error in validate" };
  try {
    // db.query.tablename.findone --> this can also be done
    const workspaceData = (await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)) as Workspace[];
    return { data: workspaceData, error: null };
  } catch (error) {
    console.log("Error in getWorkspaceDetails", error);
    return { data: null, error: "Error in getWorkspaceDetails" };
  }
};

export const getFolderDetails = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: [], error: "Error in validate" };
  try {
    const folderData = (await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1)) as Folder[];
    return { data: folderData, error: null };
  } catch (error) {
    console.log("Error in getFolderDetails", error);
    return { data: null, error: "Error in getFolderDetails" };
  }
};

export const getFileDetails = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid) return { data: [], error: "Error in validate" };
  try {
    const fileData = (await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)) as File[];
    return { data: fileData, error: null };
  } catch (error) {
    console.log("Error in getFileDetails", error);
    return { data: null, error: "Error in getFileDetails" };
  }
};

export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const privateWorkspaces = (await db
    .select()
    .from(workspaces)
    .where(
      and(
        notExists(
          db
            .select()
            .from(collaborators)
            .where(eq(collaborators.workspaceId, workspaces.id))
        ),
        eq(workspaces.workspaceOwner, userId)
      )
    )) as Workspace[];
  return privateWorkspaces;
};

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const collaboratedWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(users)
    .innerJoin(collaborators, eq(users.id, collaborators.userId))
    .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
    .where(eq(users.id, userId))) as Workspace[];
  return collaboratedWorkspaces;
};

export const getSharedWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const sharedWorkspaces = (await db
    .selectDistinct({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
    })
    .from(workspaces)
    .orderBy(workspaces.createdAt)
    .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
    .where(eq(workspaces.workspaceOwner, userId))) as Workspace[];
  return sharedWorkspaces;
};

export const getCollaborators = async (workspaceId: string) => {
  const response = await db
    .select()
    .from(collaborators)
    .where(eq(collaborators.workspaceId, workspaceId));
  if (!response.length) return;
  // check if all the users in the collaborator list exists.
  const userInformation: Promise<User | undefined>[] = response.map(
    async (collaborator) => {
      const exists = await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, collaborator.userId),
      });
      return exists;
    }
  );
  const resolvedUsers = await Promise.all(userInformation);
  // filter only the existing users as collaborators
  return resolvedUsers.filter(Boolean) as User[];
};

export const addCollaborators = async (users: User[], workspaceId: string) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (dbUser, { eq }) =>
        and(eq(dbUser.userId, user.id), eq(dbUser.workspaceId, workspaceId)),
    });
    if (!userExists)
      await db.insert(collaborators).values({ workspaceId, userId: user.id });
  });
};

export const removeCollaborators = async (
  users: User[],
  workspaceId: string
) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (dbUser, { eq }) =>
        and(eq(dbUser.userId, user.id), eq(dbUser.workspaceId, workspaceId)),
    });
    if (userExists)
      await db
        .delete(collaborators)
        .where(
          and(
            eq(collaborators.workspaceId, workspaceId),
            eq(collaborators.userId, user.id)
          )
        );
  });
};

export const deleteWorkspace = async (workspaceId: string) => {
  if (!workspaceId) return { data: null, error: "No workspaceId" };
  try {
    const response = db
      .delete(workspaces)
      .where(eq(workspaces.id, workspaceId));
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in deleteWorkspace", error);
    return { data: null, error: "Error in deleteWorkspace" };
  }
};

export const deleteFolder = async (folderId: string) => {
  if (!folderId) return { data: null, error: "No folderId" };
  try {
    const response = db.delete(folders).where(eq(folders.id, folderId));
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in deleteFolder", error);
    return { data: null, error: "Error in deleteFolder" };
  }
};

export const deleteFile = async (fileId: string) => {
  if (!fileId) return { data: null, error: "No fileId" };
  try {
    const response = db.delete(files).where(eq(files.id, fileId));
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in deleteFile", error);
    return { data: null, error: "Error in deleteFile" };
  }
};

export const getUsersFromSearch = async (email: string) => {
  if (!email) return [];
  const accounts = db
    .select()
    .from(users)
    .where(ilike(users.email, `${email}%`));
  return accounts;
};

export const createFolder = async (folder: Folder) => {
  try {
    const response = await db.insert(folders).values(folder);
    return { data: response, error: null }; // we need not return anything in data
  } catch (error) {
    console.log("Error in createFolder", error);
    return { data: null, error: "Error in createFolder" };
  }
};

export const updateFolder = async (
  folder: Partial<Folder>,
  folderId: string
) => {
  try {
    const response = await db
      .update(folders)
      .set(folder)
      .where(eq(folders.id, folderId));
    return { data: response, error: null }; // we need not return anything in data
  } catch (error) {
    console.log("Error in updateFolder", error);
    return { data: null, error: "Error in updateFolder" };
  }
};

export const updateFile = async (file: Partial<File>, fileId: string) => {
  try {
    const response = await db
      .update(files)
      .set(file)
      .where(eq(files.id, fileId));
    return { data: response, error: null }; // we need not return anything in data
  } catch (error) {
    console.log("Error in updateFile", error);
    return { data: null, error: "Error in updateFile" };
  }
};

export const createFile = async (file: File) => {
  try {
    const response = await db.insert(files).values(file);
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in createFile", error);
    return { data: null, error: "Error in createFile" };
  }
};

export const updateWorkspace = async (
  workspace: Partial<Workspace>,
  workspaceId: string
) => {
  if (!workspaceId) return { data: null, error: "WorkspaceId required" };
  try {
    const response = await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, workspaceId));
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in updateWorkspace", error);
    return { data: null, error: "Error in updateWorkspace" };
  }
};

export const findUser = async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });
  return user;

  /*
  let avatarPath;
  if(response.avatarPath){
    avatarPath = supabase.storage.from('avatars').getPublicUrl(response.avatarUrl)?.data.publicUrl
  }
  */
};

export const getUserDetails = async (userId: string) => {
  const isValid = validate(userId);
  if (!isValid) return { data: [], error: "Error in validate" };
  try {
    const userData = (await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as User[];
    return { data: userData, error: null };
  } catch (error) {
    console.log("Error in getFolderDetails", error);
    return { data: null, error: "Error in getFolderDetails" };
  }
};
export const updateUser = async (user: Partial<User>, userId: string) => {
  try {
    const response = await db
      .update(users)
      .set(user)
      .where(eq(users.id, userId));
    return { data: response, error: null };
  } catch (error) {
    console.log("Error in updateFolder", error);
    return { data: null, error: "Error in updateFolder" };
  }
};
