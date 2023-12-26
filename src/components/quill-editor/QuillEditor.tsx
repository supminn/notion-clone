"use client";
import { DUMMY_USER_DATA, TOOLBAR_OPTIONS } from "@/lib/contants";
import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, User, Workspace } from "@/lib/supabase/supabase.types";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
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
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import Image from "next/image";
import BannerImage from "../../../public/BannerImage.png";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import EmojiPicker from "../global/EmojiPicker";
import BannerUpload from "../banner-upload/BannerUpload";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  dirDetails: File | Folder | Workspace;
  fileId: string;
}

const QuillEditor: FC<QuillEditorProps> = ({ dirDetails, dirType, fileId }) => {
  // render the quill editor and use socket.io to show real time data updates
  const supabase = createClientComponentClient();
  const pathName = usePathname();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const [quill, setQuill] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<User[]>(DUMMY_USER_DATA); // FIXME: remove this data
  const [saving, setSaving] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(BannerImage);

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

  const breadCrumbs = useMemo(() => {
    if (!pathName || !state.workspaces) return;
    const segments = pathName
      .split("/")
      .filter((val) => val !== "dashboard" && val);
    const workspaceDetails = state.workspaces.find(
      (workspace) => workspace.id === segments[0]
    );
    const workspaceBreadCrumb = workspaceDetails
      ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
      : "";
    if (segments.length === 1) {
      return workspaceBreadCrumb;
    }
    const folderDetails = workspaceDetails?.folders.find(
      (folder) => folder.id === segments[1]
    );
    const folderBreadCrumb = folderDetails
      ? `${folderDetails.iconId} ${folderDetails.title}`
      : "";
    if (segments.length === 2) {
      return `${workspaceBreadCrumb} / ${folderBreadCrumb}`;
    }
    const fileDetails = folderDetails?.files.find(
      (file) => file.id === segments[2]
    );
    const fileBreadCrumb = fileDetails
      ? `${fileDetails.iconId} ${fileDetails.title}`
      : "";
    if (segments.length === 3) {
      return `${workspaceBreadCrumb} / ${folderBreadCrumb} / ${fileBreadCrumb}`;
    }
  }, [state, pathName]);

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

  // TODO: Create this storage bucket
  // useEffect(() => {
  //   if (details.bannerUrl) {
  //     const imageUrl = supabase.storage
  //       .from("file-banners")
  //       .getPublicUrl(details.bannerUrl).data.publicUrl;
  //   }
  // }, [details, supabase.storage]);

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

  const onEmojiChange = async (icon: string) => {
    if (!fileId) return;
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { iconId: icon }, workspaceId: fileId },
      });
      const { error } = await updateWorkspace({ iconId: icon }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update emoji",
        });
      } else {
        toast({
          title: "Success",
          description: "Emoji updated successfully",
        });
      }
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({
        type: "UPDATE_FOLDER",
        payload: { folder: { iconId: icon }, workspaceId, folderId: fileId },
      });
      const { error } = await updateFolder({ iconId: icon }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update emoji",
        });
      } else {
        toast({
          title: "Success",
          description: "Emoji updated successfully",
        });
      }
    }
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { iconId: icon }, workspaceId, folderId, fileId },
      });
      const { error } = await updateFile({ iconId: icon }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update emoji",
        });
      } else {
        toast({
          title: "Success",
          description: "Emoji updated successfully",
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
            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
        <div
          className="flex
          flex-col-reverse
          sm:flex-row
          sm:justify-between
          justify-center
          sm:items-center
          sm:p-2
          p-8"
        >
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10">
              {collaborators?.map((collaborator) => (
                <TooltipProvider key={collaborator.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="-ml-3
                      bg-background
                      border-2
                      flex
                      items-center
                      justify-center
                      border-white
                      h-8
                      w-8
                      rounded-full"
                      >
                        <AvatarImage
                          className="rounded-full"
                          src={collaborator.avatarUrl || ""}
                        />
                        <AvatarFallback>
                          {collaborator?.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{collaborator?.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant="secondary"
                className="bg-orange-600 top-4 text-white right-4 z-50"
              >
                Saving...
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-600 top-4 text-white right-4 z-50"
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
      {details.bannerUrl && (
        <div className="relative w-full h-[200px]">
          <Image
            src={bannerUrl}
            className="w-full md:h-48 h-20 object-cover"
            alt="Banner Image"
          />
        </div>
      )}
      <div className="flex justify-center items-center flex-col mt-2 relative">
        <div className="w-full self-center max-w-[800px] flex flex-col px-7 lg:my-8">
          <div className="text-[80px]">
            <EmojiPicker getValue={onEmojiChange}>
              <div
                className="w-[100px]
                cursor-pointer
                transition-colors
                h-[100px]
                flex
                items-center
                justify-center
                hover:bg-muted
                rounded-xl"
              >
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
          <div className="flex">
            <BannerUpload
              details={details}
              id={fileId}
              type={dirType}
              className="mt-2
              text-sm
              text-muted-foreground
              p-2
              hover:text-card-foreground
              transition-all
              rounded-md"
            >
              {details.bannerUrl ? "Update Banner" : "Add Banner"}
            </BannerUpload>
          </div>
        </div>
        <div id="container" ref={wrapperRef} className="max-w-[800]"></div>
      </div>
    </>
  );
};

export default QuillEditor;
