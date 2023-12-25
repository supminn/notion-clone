"use client";
import { useAppState } from "@/lib/providers/state-provider";
import React, { FC, useEffect, useState } from "react";
import TooltipWrapper from "../global/TooltipWrapper";
import { PlusIcon } from "lucide-react";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { v4 } from "uuid";
import { Folder } from "@/lib/supabase/supabase.types";
import { createFolder } from "@/lib/supabase/queries";
import { toast } from "../ui/use-toast";
import { Accordion } from "../ui/accordion";
import Dropdown from "./Dropdown";

interface FoldersDropDownListProps {
  workspaceFolders: Folder[];
  workspaceId: string;
}
const FoldersDropDownList: FC<FoldersDropDownListProps> = ({
  workspaceFolders,
  workspaceId,
}) => {
  //TODO: setup real time updates
  const { state, dispatch, folderId } = useAppState();
  const [folders, setFolders] = useState(workspaceFolders);
  const { subscription } = useSupabaseUser();

  // set initial state for folders
  useEffect(() => {
    if (workspaceFolders.length > 0) {
      dispatch({
        type: "SET_FOLDERS",
        payload: {
          workspaceId,
          folders: workspaceFolders.map((folder) => ({
            ...folder,
            files:
              state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((sFolder) => sFolder.id === folder.id)?.files ||
              [],
          })),
        },
      });
    }
  }, [workspaceFolders, workspaceId]);

  // update folders from global state
  useEffect(() => {
    setFolders(
      state.workspaces.find((workspace) => workspace.id === workspaceId)
        ?.folders || []
    );
  }, [state.workspaces, workspaceId]);

  const addFolderHandler = async () => {
    if (folders.length >= 3 && !subscription) {
      // show a modal to upgrade to Pro
    }
    const newFolder: Folder = {
      data: null,
      id: v4(),
      createdAt: new Date().toISOString(),
      title: "Untitled",
      iconId: "📄",
      inTrash: null,
      workspaceId,
      bannerUrl: "",
    };
    dispatch({
      type: "ADD_FOLDER",
      payload: { workspaceId, folder: { ...newFolder, files: [] } },
    });
    const { error } = await createFolder(newFolder);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Could not create the folder",
      });
    } else {
      toast({
        title: "Success",
        description: "Created the folder",
      });
    }
  };
  return (
    <>
      <div
        className="flex
        sticky
        z-20
        top-0
        bg-background
        w-full
        h-10
        group/title
        justify-between
        items-center
        pr-4
        text-Neutrals/neutrals-8"
      >
        <span className="text-Neutrals/neutrals-8 font-bold text-xs">
          FOLDERS
        </span>
        <TooltipWrapper message="Create Folder">
          <PlusIcon
            onClick={addFolderHandler}
            size={16}
            className="group-hover/title:inline-block hidden cursor-pointer hover:dark:text-white"
          />
        </TooltipWrapper>
      </div>
      <Accordion
        type="multiple"
        defaultValue={[folderId || ""]}
        className="pb-20"
      >
        {folders
          .filter((folder) => !folder.inTrash)
          .map((folder) => (
            <Dropdown
              key={folder.id}
              title={folder.title}
              listType="folder"
              id={folder.id}
              iconId={folder.iconId}
            />
          ))}
      </Accordion>
    </>
  );
};

export default FoldersDropDownList;
