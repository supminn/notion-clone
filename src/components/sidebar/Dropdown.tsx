"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { AccordionItem, AccordionTrigger } from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/EmojiPicker";
import { updateFile, updateFolder } from "@/lib/supabase/queries";
import { useToast } from "../ui/use-toast";
import TooltipWrapper from "../global/TooltipWrapper";
import { PlusIcon, Trash } from "lucide-react";

interface DropdownProps {
  title: string;
  id: string;
  listType: "folder" | "file";
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  title,
  id,
  listType,
  iconId,
  children,
  disabled,
}) => {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
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
      const fileAndFolderId = id.split("folder");
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileAndFolderId[0])
        ?.files.find((file) => file.id === fileAndFolderId[1])?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, workspaceId, id, title]);
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
  // Edit the folder using double click
  const handleDoubleClick = () => {
    setIsEditting(true);
  };
  // Blur the dropdown when the user clicks outside. This would also save the changes
  const handleBlur = async () => {
    setIsEditting(false);
    const fileAndFolderId = id.split("folder");
    if (fileAndFolderId?.length === 1) {
      if (!folderTitle) return;
      await updateFolder({ title }, fileAndFolderId[0]);
    }
    if (fileAndFolderId?.length === 2 && fileAndFolderId[1]) {
      if (!fileTitle) return;
      await updateFile({ title }, fileAndFolderId[1]);
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
  };
  const folderTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    const fileAndFolderId = id.split("folder");
    if (fileAndFolderId.length === 1) {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: fileAndFolderId[0],
          folder: { title: e.target.value },
        },
      });
    }
  };

  const fileTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    const fileAndFolderId = id.split("folder");
    if (fileAndFolderId.length === 2 && fileAndFolderId[1]) {
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          workspaceId,
          folderId: fileAndFolderId[0],
          fileId: fileAndFolderId[1],
          file: { title: e.target.value },
        },
      });
    }
  };
  // move to trash when the user deletes the folder

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
          <div
            className="h-full
              hidden
              group-hover/file:block
              rounded-sm
              absolute
              right-0
              items-center
              gap-2
              justify-center"
          >
            <TooltipWrapper message="Delete Folder">
              <Trash
                // onClick={moveToTrash}
                size={15}
                className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
              />
            </TooltipWrapper>
            {listType === "folder" && !isEditting && (
              <TooltipWrapper message="Add a File">
                <PlusIcon
                  // onClick={addNewFile}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipWrapper>
            )}
          </div>
        </div>
      </AccordionTrigger>
    </AccordionItem>
  );
};

export default Dropdown;
