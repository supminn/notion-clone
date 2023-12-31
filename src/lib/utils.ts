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

export const toDateTime = (secs: number) => {
  const t = new Date("1970-01-01T00:30:00Z");
  t.setSeconds(secs);
  return t;
};

export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_RAILWAY_URL ??
    "http://localhost:3000/";
  url = url.includes("http") ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export const postData = async ({
  url,
  data,
}: {
  url: string;
  data?: { price: Price };
}) => {
  console.log("Posting", url, data);
  const res: Response = await fetch(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    credentials: "same-origin",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorMessage = await res.text();
    console.log("Error in postData", { url, data, res, errorMessage });
    throw Error(res.statusText);
  }
  return res.json();
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
