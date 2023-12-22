"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Folder } from "@/lib/supabase/supabase.types";
import React, { FC, useEffect, useState } from "react";
import TooltipWrapper from "../global/TooltipWrapper";
import { PlusIcon } from "lucide-react";

interface FoldersDropDownListProps {
  workspaceFolders: Folder[];
  workspaceId: string;
}
const FoldersDropDownList: FC<FoldersDropDownListProps> = ({
  workspaceFolders,
  workspaceId,
}) => {
  //TODO: setup real time updates
  const { state, dispatch } = useAppState();
  const [folders, setFolders] = useState(workspaceFolders);

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
            size={16}
            className="group-hover/title:inline-block hidden cursor-pointer hover:dark:text-white"
          />
        </TooltipWrapper>
      </div>
    </>
  );
};

export default FoldersDropDownList;
