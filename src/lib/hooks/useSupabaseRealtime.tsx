import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect } from "react";
import { useAppState } from "../providers/state-provider";
import { useRouter } from "next/navigation";
import { findMatchingFile } from "../utils";
import { File } from "../supabase/supabase.types";

const useSupabaseRealtime = () => {
  const supabase = createClientComponentClient();
  const { dispatch, state, workspaceId: selectedWorkspaceId } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 Received real time event");
            const {
              folder_id: folderId,
              workspace_id: workspaceId,
              id: fileId,
            } = payload.new;
            if (
              !findMatchingFile(state.workspaces, workspaceId, folderId, fileId)
            ) {
              const newFile: File = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                folderId: payload.new.folder_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FILE",
                payload: { file: newFile, workspaceId, folderId },
              });
            }
          } else if (payload.eventType === "DELETE") {
            let workspaceId = "";
            let folderId = "";
            const fileExists = state.workspaces.some((workspace) =>
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.old.id) {
                    workspaceId = workspace.id;
                    folderId = folder.id;
                    return true;
                  }
                })
              )
            );
            if (fileExists && workspaceId && folderId) {
              router.replace(`/dashboard/${workspaceId}`);
              dispatch({
                type: "DELETE_FILE",
                payload: { workspaceId, folderId, fileId: payload.old.id },
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const {
              folder_id: folderId,
              workspace_id: workspaceId,
              id: fileId,
            } = payload.new;
            state.workspaces.some((workspace) =>
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.new.id) {
                    dispatch({
                      type: "UPDATE_FILE",
                      payload: {
                        workspaceId,
                        folderId,
                        fileId: payload.new.id,
                        file: {
                          title: payload.new.title,
                          iconId: payload.new.icon_id,
                          inTrash: payload.new.in_trash,
                        },
                      },
                    });
                  }
                })
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, state, dispatch, selectedWorkspaceId]);

  return null;
};

export default useSupabaseRealtime;

// TODO: Need to create a similar thing for folder updates
