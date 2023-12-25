"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/EmojiPicker";
import { createFile, updateFile, updateFolder } from "@/lib/supabase/queries";
import { useToast } from "../ui/use-toast";
import TooltipWrapper from "../global/TooltipWrapper";
import { PlusIcon, Trash } from "lucide-react";
import { File } from "@/lib/supabase/supabase.types";
import { v4 } from "uuid";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface DropdownProps {
  title: string;
  id: string;
  listType: "folder" | "file";
  iconId: string;
}

const Dropdown: React.FC<DropdownProps> = ({ title, id, listType, iconId }) => {
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [isEditting, setIsEditting] = useState(false);
  const router = useRouter();

  const isFolder = listType === "folder";
  const listStyles = useMemo(
    () =>
      clsx("relative", {
        "border-none text-md": isFolder,
        "border-none ml-6 text-[16px] py-1": !isFolder,
      }),
    [isFolder]
  );
  const groupIdentifies = useMemo(
    () =>
      clsx(
        "dark:text-white whitespace-nowrap flex justify-between items-center w-full relative",
        {
          "group/folder": isFolder,
          "group/file": !isFolder,
        }
      ),
    [isFolder]
  );
  const hoverStyles = useMemo(
    () =>
      clsx(
        "h-full hidden rounded-sm absolute right-0 items-center gap-2 justify-center",
        {
          "group-hover/file:block": !isFolder,
          "group-hover/folder:block": isFolder,
        }
      ),
    [isFolder]
  );

  // Folder title synced with server and local data
  const folderTitle: string | undefined = useMemo(() => {
    if (listType === "folder") {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === id)?.title;
      if (title === stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, workspaceId, id, title]);

  // File title synced with server and local data
  const fileTitle: string | undefined = useMemo(() => {
    if (listType === "file") {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === folderId)
        ?.files.find((file) => file.id === id)?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, workspaceId, folderId, id, title]);

  // Function to navigate the user to a different page
  const navigatePage = (accordianId: string, type: string) => {
    if (type === "folder") {
      router.push(`/dashboard/${workspaceId}/${accordianId}`);
    }
    if (type === "file") {
      router.push(`/dashboard/${workspaceId}/${folderId}/${accordianId}`);
    }
  };

  // Add a new file into this folder
  const addNewFile = async () => {
    if (!workspaceId) return;
    const newFile: File = {
      folderId: id,
      data: null,
      createdAt: new Date().toISOString(),
      inTrash: null,
      title: "Untitled",
      iconId: "📄",
      id: v4(),
      workspaceId,
      bannerUrl: "",
    };
    dispatch({
      type: "ADD_FILE",
      payload: { workspaceId, folderId: id, file: newFile },
    });
    const { error } = await createFile(newFile);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Could not create a file",
      });
    } else {
      toast({ title: "Success", description: "File created" });
    }
  };

  // Edit the folder using double click
  const handleDoubleClick = () => {
    setIsEditting(true);
  };

  // Blur the dropdown when the user clicks outside. This would also save the changes
  const handleBlur = async () => {
    // TODO: handle not to change the title if empty string is passed
    if (!isEditting) return;
    setIsEditting(false);
    if (listType === "folder") {
      if (!folderTitle) return;
      const { error } = await updateFolder({ title }, id);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update title for this folder",
        });
      } else {
        toast({ title: "Success", description: "Folder title updated" });
      }
    }
    if (listType === "file") {
      if (!fileTitle) return;
      const { error } = await updateFile({ title }, id);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update title for this file",
        });
      } else {
        toast({ title: "Success", description: "File title updated" });
      }
    }
  };

  // onChanges
  const onChangeEmojiHandler = async (selectedEmoji: string) => {
    if (!workspaceId) return;
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: id,
          folder: { iconId: selectedEmoji },
        },
      });
      const { error } = await updateFolder({ iconId: selectedEmoji }, id);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update the emoji for this folder",
        });
      } else {
        toast({
          title: "Success",
          description: "Updated the emoji for this folder",
        });
      }
    }
    if (listType === "file") {
      if (!folderId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          folderId,
          fileId: id,
          file: { iconId: selectedEmoji },
        },
      });
      const { error } = await updateFile({ iconId: selectedEmoji }, id);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update the emoji for this file",
        });
      } else {
        toast({
          title: "Success",
          description: "Updated the emoji for this file",
        });
      }
    }
  };

  const folderTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: id,
          folder: { title: e.target.value },
        },
      });
    }
  };

  const fileTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || !folderId) return;
    if (listType === "file") {
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          folderId,
          fileId: id,
          file: { title: e.target.value },
        },
      });
    }
  };

  // move to trash when the user deletes the folder
  const moveToTrash = async () => {
    if (!workspaceId || !user?.email) return;
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { inTrash: `Deleted by ${user?.email}` },
          folderId: id,
          workspaceId,
        },
      });
      const { error } = await updateFolder(
        { inTrash: `Deleted by ${user?.email}` },
        id
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not move this folder to trash",
        });
      } else {
        toast({ title: "Success", description: "Folder moved to trash" });
      }
    } else if (listType === "file") {
      if (!folderId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { inTrash: `Deleted by ${user?.email}` },
          folderId,
          fileId: id,
          workspaceId,
        },
      });
      const { error } = await updateFile(
        { inTrash: `Deleted by ${user?.email}` },
        id
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not move this file to trash",
        });
      } else {
        toast({ title: "Success", description: "File moved to trash" });
      }
    }
  };

  return (
    <AccordionItem
      value={id}
      className={listStyles}
      onClick={(e) => {
        // e.preventDefault();
        e.stopPropagation();
        navigatePage(id, listType);
      }}
    >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline
        p-2
        dark:text-muted-foreground
        text-sm"
        disabled={listType === "file"}
      >
        <div className={groupIdentifies}>
          <div className="flex gap-4 items-center justify-center overflow-hidden">
            <div className="relative">
              <EmojiPicker getValue={onChangeEmojiHandler}>
                {iconId}
              </EmojiPicker>
            </div>
            <input
              type="text"
              value={listType === "folder" ? folderTitle : fileTitle}
              className={clsx(
                "outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7",
                {
                  "bg-muted cursor-text": isEditting,
                  "bg-transparent cursor-pointer": !isEditting,
                }
              )}
              readOnly={!isEditting}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onChange={
                listType === "folder" ? folderTitleChange : fileTitleChange
              }
            />
          </div>
          <div className={hoverStyles}>
            <TooltipWrapper message="Delete Folder">
              <Trash
                onClick={moveToTrash}
                size={15}
                className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
              />
            </TooltipWrapper>
            {listType === "folder" && !isEditting && (
              <TooltipWrapper message="Add File">
                <PlusIcon
                  onClick={addNewFile}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipWrapper>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !file.inTrash)
          .map((file) => {
            return (
              <Dropdown
                key={file.id}
                title={file.title}
                listType="file"
                id={file.id}
                iconId={file.iconId}
              />
            );
          })}
      </AccordionContent>
    </AccordionItem>
  );
};

export default Dropdown;
