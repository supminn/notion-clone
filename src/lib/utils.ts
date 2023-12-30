import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { appWorkspacesType } from "./providers/state-provider";
import { Price } from "./supabase/supabase.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: Price) => {
  const priceString = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency || undefined,
    minimumFractionDigits: 0,
  }).format((price.unitAmount || 0) / 100);
  return priceString;
};

type dataWithCreatedAtType = {
  createdAt: string;
};
export function sortByCreatedAt(
  a: dataWithCreatedAtType,
  b: dataWithCreatedAtType
) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

type getSelectedDirectoryType = {
  type: "workspace" | "folder" | "file";
  state: {
    workspaces: appWorkspacesType[] | [];
  };
  workspaceId: string | undefined;
  folderId: string | undefined;
  fileId: string | undefined;
};
export const getSelectedDirectory = ({
  type,
  state,
  workspaceId,
  folderId,
  fileId,
}: getSelectedDirectoryType) => {
  let selectedDir;
  if (type === "file") {
    if (!workspaceId || !folderId || !fileId) return;
    selectedDir = findMatchingFile(
      state.workspaces,
      workspaceId,
      folderId,
      fileId
    );
  }
  if (type === "folder") {
    selectedDir = state.workspaces
      .find((workspace) => workspace.id === workspaceId)
      ?.folders.find((folder) => folder.id === fileId);
  }
  if (type === "workspace") {
    selectedDir = state.workspaces.find((workspace) => workspace.id === fileId);
  }
  return selectedDir;
};

export const findMatchingFile = (
  workspaces: appWorkspacesType[],
  workspaceId: string,
  folderId: string,
  fileId: string
) =>
  workspaces
    .find((workspace) => workspace.id === workspaceId)
    ?.folders.find((folder) => folder.id === folderId)
    ?.files.find((file) => file.id === fileId);

// TODO: need to create for folders and workspaces
