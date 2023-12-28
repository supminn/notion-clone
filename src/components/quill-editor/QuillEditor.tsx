"use client";
import {
  DUMMY_USER_DATA,
  TOOLBAR_OPTIONS,
  UPDATE_USER_CHANGES_TIMER_VALUE,
} from "@/lib/contants";
import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, User, Workspace } from "@/lib/supabase/supabase.types";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "quill/dist/quill.snow.css";
import { getSelectedDirectory } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  deleteWorkspace,
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
} from "@/lib/supabase/queries";
import { toast } from "../ui/use-toast";
import { usePathname, useRouter } from "next/navigation";
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
import {
  updateFileStateAndDb,
  updateFolderStateAndDb,
  updateWorkspaceStateAndDb,
} from "@/lib/server-actions/db-actions";
import { XCircle } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  dirDetails: File | Folder | Workspace;
  fileId: string;
}

const QuillEditor: FC<QuillEditorProps> = ({ dirDetails, dirType, fileId }) => {
  // render the quill editor and use socket.io to show real time data updates
  const supabase = createClientComponentClient();
  const pathName = usePathname();
  const router = useRouter();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const { user } = useSupabaseUser();
  const { socket } = useSocket();
  const [quill, setQuill] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<User[]>(DUMMY_USER_DATA); // FIXME: remove this data
  const [saving, setSaving] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string>();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

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

  useEffect(() => {
    if (details.bannerUrl) {
      const imageUrl = supabase.storage
        .from("file-banner")
        .getPublicUrl(details.bannerUrl).data.publicUrl;
      if (imageUrl) {
        setBannerUrl(imageUrl);
      }
    }
  }, [details, supabase.storage]);

  useEffect(() => {
    if (!fileId) return;
    const fetchInformation = async () => {
      if (dirType === "file") {
        const { data, error } = await getFileDetails(fileId);
        if (error || !data) return router.replace("/dashboard");
        if (!data[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || quill === null) return;
        if (!data[0].data) return;
        quill.setContents(JSON.parse(data[0].data || ""));
        await updateFileStateAndDb({
          dispatch,
          workspaceId,
          folderId: data[0].folderId,
          fileId,
          data: { data: data[0].data },
        });
      }
      if (dirType === "folder") {
        const { data, error } = await getFolderDetails(fileId);
        if (error || !data) return router.replace("/dashboard");
        if (!data[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || quill === null) return;
        if (!data[0].data) return;
        quill.setContents(JSON.parse(data[0].data || ""));
        await updateFolderStateAndDb({
          dispatch,
          workspaceId,
          folderId: fileId,
          data: { data: data[0].data },
        });
      }
      if (dirType === "workspace") {
        const { data, error } = await getWorkspaceDetails(fileId);
        if (error || !data) return router.replace("/dashboard");
        if (!workspaceId || quill === null) return;
        if (!data[0].data) return;
        quill.setContents(JSON.parse(data[0].data || ""));
        await updateWorkspaceStateAndDb({
          dispatch,
          workspaceId: fileId,
          data: { data: data[0].data },
        });
      }
    };

    fetchInformation();
  }, [fileId, workspaceId, dirType, quill, dispatch, router]);

  // rooms for our application
  useEffect(() => {
    if (socket === null || quill === null || !fileId) return;
    socket.emit("create-room", fileId);
  }, [socket, quill, fileId]);

  // send quill changes to all the clients
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !user) return;
    // WIP cursors update
    const selectionChangeHandler = () => {};
    const quillHandler = (delta: any, oldDelta: any, source: any) => {
      if (source !== "user") return; // if the user did not create this change, we don't want to make any changes
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaving(true);
      const contents = quill.getContents();
      const quillLength = quill.getLength();
      saveTimerRef.current = setTimeout(async () => {
        if (contents && quillLength !== 1 && fileId) {
          if (dirType === "workspace") {
            await updateWorkspaceStateAndDb({
              dispatch,
              workspaceId: fileId,
              data: { data: JSON.stringify(contents) },
            });
          }
          if (dirType === "folder") {
            if (!workspaceId) return;
            await updateFolderStateAndDb({
              dispatch,
              workspaceId,
              folderId: fileId,
              data: { data: JSON.stringify(contents) },
            });
          }
          if (dirType === "file") {
            if (!workspaceId || !folderId) return;
            await updateFileStateAndDb({
              dispatch,
              workspaceId,
              folderId,
              fileId,
              data: { data: JSON.stringify(contents) },
            });
          }
        }
        setSaving(false);
      }, UPDATE_USER_CHANGES_TIMER_VALUE);
      socket.emit("send-changes", delta, fileId);
    };
    quill.on("text-change", quillHandler);
    // WIP cursors selection handler

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      quill.off("text-change", quillHandler);
      // remove selection handler
    };
  }, [quill, socket, fileId, user, workspaceId, folderId, dirType, dispatch]);

  // recieve the socket changes for other users
  useEffect(() => {
    if (quill === null || socket === null) return;
    const socketHandler = (deltas: any, id: string) => {
      if (id === fileId) {
        quill.updateContents(deltas);
      }
    };
    socket.on("receive-changes", socketHandler);

    return () => {
      socket.off("receive-changes", socketHandler);
    };
  }, [quill, socket, fileId]);

  const restoreFromTrash = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      await updateFileStateAndDb({
        dispatch,
        workspaceId,
        folderId,
        fileId,
        data: { inTrash: "" },
        error: "Could not restore file",
        success: "Restored file successfully",
      });
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      await updateFolderStateAndDb({
        dispatch,
        workspaceId,
        folderId: fileId,
        data: { inTrash: "" },
        error: "Could not restore folder",
        success: "Restored folder successfully",
      });
    }
    if (dirType === "workspace") {
      await updateWorkspaceStateAndDb({
        dispatch,
        workspaceId: fileId,
        data: { inTrash: "" },
        error: "Could not restore workspace",
        success: "Restored workspace successfully",
      });
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
      await updateWorkspaceStateAndDb({
        dispatch,
        workspaceId: fileId,
        data: { iconId: icon },
        error: "Could not update emoji",
        success: "Emoji updated successfully",
      });
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      await updateFolderStateAndDb({
        dispatch,
        workspaceId,
        folderId: fileId,
        data: { iconId: icon },
        error: "Could not update emoji",
        success: "Emoji updated successfully",
      });
    }
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      await updateFileStateAndDb({
        dispatch,
        workspaceId,
        folderId,
        fileId,
        data: { iconId: icon },
        error: "Could not update emoji",
        success: "Emoji updated successfully",
      });
    }
  };

  const deleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    if (details.bannerUrl) {
      await supabase.storage.from("file-banner").remove([details.bannerUrl]);
    }
    if (dirType === "workspace") {
      await updateWorkspaceStateAndDb({
        dispatch,
        workspaceId: fileId,
        data: { bannerUrl: "" },
        error: "Could not delete banner",
        success: "Banner deleted successfully",
      });
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      await updateFolderStateAndDb({
        dispatch,
        workspaceId,
        folderId: fileId,
        data: { bannerUrl: "" },
        error: "Could not delete banner",
        success: "Banner deleted successfully",
      });
    }
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      await updateFileStateAndDb({
        dispatch,
        workspaceId,
        folderId,
        fileId,
        data: { bannerUrl: "" },
        error: "Could not delete banner",
        success: "Banner deleted successfully",
      });
    }
    setDeletingBanner(false);
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
            src={bannerUrl ?? BannerImage}
            className="w-full md:h-48 h-20 object-cover"
            alt="Banner Image"
            width={200}
            height={50}
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
            {details.bannerUrl && (
              <Button
                disabled={deletingBanner}
                onClick={deleteBanner}
                variant="ghost"
                className="gap-2
                hover:bg-background
                flex
                items-center
                justify-center
                mt-2
                text-sm
                text-muted-foreground
                w-36
                p-2
                rounded-md"
              >
                <XCircle size={16} />
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
            )}
          </div>
          <span className="text-muted-foreground text-3xl font-bold h-9">
            {details.title}
          </span>
          <span className="text-muted-foreground text-sm ml-1">
            {dirType.toUpperCase()}
          </span>
        </div>
        <div id="container" ref={wrapperRef} className="max-w-[800]"></div>
      </div>
    </>
  );
};

export default QuillEditor;
