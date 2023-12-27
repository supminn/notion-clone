import { toast } from "@/components/ui/use-toast";
import { updateFile, updateFolder, updateWorkspace } from "../supabase/queries";
import { Action } from "../providers/state-provider";
import { Workspace } from "../supabase/supabase.types";

type WorkspaceUpdateTypes = {
  data: Partial<Workspace>;
  workspaceId: string;
  dispatch: (actions: Action) => void;
  error: string;
  success: string;
};
export const updateWorkspaceStateAndDb = async ({
  dispatch,
  data,
  workspaceId,
  error,
  success,
}: WorkspaceUpdateTypes) => {
  dispatch({
    type: "UPDATE_WORKSPACE",
    payload: { workspace: data, workspaceId },
  });
  const { error: err } = await updateWorkspace(data, workspaceId);
  if (err) {
    toast({
      title: "Error",
      variant: "destructive",
      description: error,
    });
  } else {
    toast({
      title: "Success",
      description: success,
    });
  }
};

type FolderUpdateTypes = {
  data: Partial<Workspace>;
  workspaceId: string;
  folderId: string;
  dispatch: (actions: Action) => void;
  error: string;
  success: string;
};
export const updateFolderStateAndDb = async ({
  dispatch,
  data,
  workspaceId,
  folderId,
  error,
  success,
}: FolderUpdateTypes) => {
  dispatch({
    type: "UPDATE_FOLDER",
    payload: { folder: data, workspaceId, folderId },
  });
  const { error: err } = await updateFolder(data, folderId);
  if (err) {
    toast({
      title: "Error",
      variant: "destructive",
      description: error,
    });
  } else {
    toast({
      title: "Success",
      description: success,
    });
  }
};

type FileUpdateTypes = {
  data: Partial<Workspace>;
  workspaceId: string;
  folderId: string;
  fileId: string;
  dispatch: (actions: Action) => void;
  error: string;
  success: string;
};
export const updateFileStateAndDb = async ({
  dispatch,
  data,
  workspaceId,
  folderId,
  fileId,
  error,
  success,
}: FileUpdateTypes) => {
  dispatch({
    type: "UPDATE_FILE",
    payload: { file: data, workspaceId, folderId, fileId },
  });
  const { error: err } = await updateFile(data, fileId);
  if (err) {
    toast({
      title: "Error",
      variant: "destructive",
      description: error,
    });
  } else {
    toast({
      title: "Success",
      description: success,
    });
  }
};
