"use client";

import {
  Dispatch,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { File, Folder, Workspace } from "../supabase/supabase.types";
import { sortByCreatedAt } from "../utils";
import { usePathname } from "next/navigation";
import { getFiles } from "../supabase/queries";

export type appFoldersType = Folder & { files: File[] | [] };
export type appWorkspacesType = Workspace & { folders: appFoldersType[] | [] };

interface AppState {
  workspaces: appWorkspacesType[] | [];
}

type Action =
  | { type: "ADD_WORKSPACE"; payload: appWorkspacesType }
  | { type: "DELETE_WORKSPACE"; payload: { workspaceId: string } }
  | {
      type: "UPDATE_WORKSPACE";
      payload: { workspace: Partial<appWorkspacesType>; workspaceId: string };
    }
  | {
      type: "SET_WORKSPACES";
      payload: { workspaces: appWorkspacesType[] | [] };
    }
  | {
      type: "SET_FOLDERS";
      payload: { workspaceId: string; folders: appFoldersType[] | [] };
    }
  | {
      type: "ADD_FOLDER";
      payload: { workspaceId: string; folder: appFoldersType };
    }
  | {
      type: "ADD_FILE";
      payload: { workspaceId: string; folderId: string; file: File };
    }
  | {
      type: "DELETE_FILE";
      payload: { workspaceId: string; folderId: string; fileId: string };
    }
  | {
      type: "DELETE_FOLDER";
      payload: { workspaceId: string; folderId: string };
    }
  | {
      type: "SET_FILES";
      payload: { workspaceId: string; files: File[]; folderId: string };
    }
  | {
      type: "UPDATE_FOLDER";
      payload: {
        workspaceId: string;
        folderId: string;
        folder: Partial<appFoldersType>;
      };
    }
  | {
      type: "UPDATE_FILE";
      payload: {
        fileId: string;
        workspaceId: string;
        folderId: string;
        file: Partial<File>;
      };
    };

const initalState: AppState = { workspaces: [] };

const appReducer = (
  state: AppState = initalState,
  { type, payload }: Action
) => {
  switch (type) {
    case "ADD_WORKSPACE": {
      return { ...state, workspaces: [...state.workspaces, payload] };
    }
    case "DELETE_WORKSPACE": {
      return {
        ...state,
        workspaces: state.workspaces.filter(
          (workspace) => workspace.id !== payload.workspaceId
        ),
      };
    }
    case "UPDATE_WORKSPACE": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? { ...workspace, ...payload.workspace }
            : workspace
        ),
      };
    }
    case "SET_WORKSPACES": {
      return {
        ...state,
        workspaces: payload.workspaces,
      };
    }
    case "SET_FOLDERS": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: payload.folders.sort(sortByCreatedAt),
              }
            : workspace
        ),
      };
    }
    case "ADD_FOLDER": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: [...workspace.folders, payload.folder].sort(
                  sortByCreatedAt
                ),
              }
            : workspace
        ),
      };
    }
    case "ADD_FILE": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: workspace.folders.map((folder) =>
                  folder.id === payload.folderId
                    ? {
                        ...folder,
                        files: [...folder.files, payload.file].sort(
                          sortByCreatedAt
                        ),
                      }
                    : folder
                ),
              }
            : workspace
        ),
      };
    }
    case "DELETE_FILE": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: workspace.folders.map((folder) =>
                  folder.id === payload.folderId
                    ? {
                        ...folder,
                        files: folder.files.filter(
                          (file) => file.id !== payload.fileId
                        ),
                      }
                    : folder
                ),
              }
            : workspace
        ),
      };
    }
    case "DELETE_FOLDER": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: workspace.folders.filter(
                  (folder) => folder.id !== payload.folderId
                ),
              }
            : workspace
        ),
      };
    }
    case "SET_FILES": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: workspace.folders.map((folder) =>
                  folder.id === payload.folderId
                    ? {
                        ...folder,
                        files: payload.files,
                      }
                    : folder
                ),
              }
            : workspace
        ),
      };
    }
    case "UPDATE_FOLDER": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: workspace.folders.map((folder) =>
                  folder.id === payload.folderId
                    ? {
                        ...folder,
                        ...payload.folder,
                      }
                    : folder
                ),
              }
            : workspace
        ),
      };
    }
    case "UPDATE_FILE": {
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === payload.workspaceId
            ? {
                ...workspace,
                folders: workspace.folders.map((folder) =>
                  folder.id === payload.folderId
                    ? {
                        ...folder,
                        files: folder.files.map((file) =>
                          file.id === payload.fileId
                            ? {
                                ...file,
                                ...payload.file,
                              }
                            : file
                        ),
                      }
                    : folder
                ),
              }
            : workspace
        ),
      };
    }
    default: {
      return initalState;
    }
  }
};

type AppStateContextType =
  | {
      state: AppState;
      dispatch: Dispatch<Action>;
      workspaceId: string | undefined;
      folderId: string | undefined;
      fileId: string | undefined;
    }
  | undefined;

const AppStateContext = createContext<AppStateContextType>(undefined);

interface AppStateProviderProps {
  children: React.ReactNode;
}

const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initalState);
  const pathName = usePathname();

  const workspaceId = useMemo(() => {
    const urlSegments = pathName?.split("/").filter(Boolean);
    if (urlSegments) {
      if (urlSegments.length > 1) {
        return urlSegments[1];
      }
    }
  }, [pathName]);

  const folderId = useMemo(() => {
    const urlSegments = pathName?.split("/").filter(Boolean);
    if (urlSegments) {
      if (urlSegments.length > 2) {
        return urlSegments[2];
      }
    }
  }, [pathName]);

  const fileId = useMemo(() => {
    const urlSegments = pathName?.split("/").filter(Boolean);
    if (urlSegments) {
      if (urlSegments.length > 3) {
        return urlSegments[3];
      }
    }
  }, [pathName]);

  useEffect(() => {
    if (!folderId || !workspaceId) return;
    const fetchFiles = async () => {
      const { error: filesError, data } = await getFiles(folderId);
      if (filesError) {
        console.log("Error in getting Files", filesError);
      }
      if (!data) return;
      dispatch({
        type: "SET_FILES",
        payload: { workspaceId, files: data, folderId },
      });
    };
    fetchFiles();
  }, [folderId, workspaceId]);

  return (
    <AppStateContext.Provider
      value={{ state, dispatch, workspaceId, folderId, fileId }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export default AppStateProvider;

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context)
    throw new Error("useAppState must be used within an AppStateProvider");
  return context;
};
