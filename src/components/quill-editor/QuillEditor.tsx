"use client";
import { TOOLBAR_OPTIONS } from "@/lib/contants";
import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React, { FC, useCallback, useMemo, useState } from "react";
import "quill/dist/quill.snow.css";
import { getSelectedDirectory } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  deleteWorkspace,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { toast } from "../ui/use-toast";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  dirDetails: File | Folder | Workspace;
  fileId: string;
}

const QuillEditor: FC<QuillEditorProps> = ({ dirDetails, dirType, fileId }) => {
  // render the quill editor and use socket.io to show real time data updates
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const [quill, setQuill] = useState<any>(null);
  const details = useMemo(() => {
    const selectedDir = getSelectedDirectory({
      type: dirType,
      state,
      workspaceId,
      folderId,
      fileId,
    });
    if (selectedDir) return selectedDir;
    return {
      ...dirDetails,
    } as File | Folder | Workspace;
  }, [state, workspaceId, folderId, fileId, dirType, dirDetails]);

  const wrapperRef = useCallback(async (wrapper: any) => {
    if (typeof window !== "undefined") {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      const Quill = (await import("quill")).default;
      // WIP cursors
      const q = new Quill(editor, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          // WIP cursors
        },
      });
      setQuill(q);
    }
  }, []);

  const restoreFromTrash = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { workspaceId, folderId, file: { inTrash: "" }, fileId },
      });
      const { error } = await updateFile({ inTrash: "" }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not restore file",
        });
      } else {
        toast({
          title: "Success",
          description: "Restored file successfully",
        });
      }
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: { workspaceId, folder: { inTrash: "" }, folderId: fileId },
      });
      const { error } = await updateFolder({ inTrash: "" }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not restore folder",
        });
      } else {
        toast({
          title: "Success",
          description: "Restored folder successfully",
        });
      }
    }
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspaceId: fileId, workspace: { inTrash: "" } },
      });
      const { error } = await updateWorkspace({ inTrash: "" }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not restore workspace",
        });
      } else {
        toast({
          title: "Success",
          description: "Restored workspace successfully",
        });
      }
    }
  };

  const deleteForever = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({
        type: "DELETE_FILE",
        payload: { workspaceId, folderId, fileId },
      });
      const { error } = await deleteFile(fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not delete file",
        });
      } else {
        toast({
          title: "Success",
          description: "Deleted file successfully",
        });
      }
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "DELETE_FOLDER",
        payload: { workspaceId, folderId: fileId },
      });
      const { error } = await deleteFolder(fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not delete folder",
        });
      } else {
        toast({
          title: "Success",
          description: "Deleted folder successfully",
        });
      }
    }
    if (dirType === "workspace") {
      dispatch({
        type: "DELETE_WORKSPACE",
        payload: { workspaceId: fileId },
      });
      const { error } = await deleteWorkspace(fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not delete workspace",
        });
      } else {
        toast({
          title: "Success",
          description: "Deleted workspace successfully",
        });
      }
    }
  };

  return (
    <>
      <div className="relative">
        {details.inTrash && (
          <article
            className="py-2
            z-40
            bg-[#EB5757]
            flex
            md:flex-row
            flex-col
            justify-center
            items-center
            gap-4
            flex-wrap"
          >
            <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
              <span className="text-white">This {dirType} is in the trash</span>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparant
                border
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]"
                onClick={restoreFromTrash}
              >
                Restore
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparant
                border
                border-white
                text-white
                hover:bg-white
                hover:text-[#EB5757]"
                onClick={deleteForever}
              >
                Delete
              </Button>
            </div>
          </article>
        )}
      </div>
      <div className="flex justify-center items-center flex-col mt-2 relative">
        <div id="container" ref={wrapperRef} className="max-w-[800]"></div>
      </div>
    </>
  );
};

export default QuillEditor;
