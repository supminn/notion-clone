import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { appWorkspacesType } from "./providers/state-provider";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    selectedDir = state.workspaces
      .find((workspace) => workspace.id === workspaceId)
      ?.folders.find((folder) => folder.id === folderId)
      ?.files.find((file) => file.id === fileId);
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
