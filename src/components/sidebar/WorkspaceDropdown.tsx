"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Workspace } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import SelectedWorkspace from "./SelectedWorkspace";
import CustomDialogTrigger from "../global/CustomDialogTrigger";
import WorkspaceCreator from "../global/WorkspaceCreator";

interface WorkspaceDropdownProps {
  privateWorkspaces: Workspace[] | [];
  sharedWorkspaces: Workspace[] | [];
  collaboratingWorkspaces: Workspace[] | [];
  defaultValue: Workspace | undefined;
}
const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  privateWorkspaces,
  sharedWorkspaces,
  collaboratingWorkspaces,
  defaultValue,
}) => {
  const [selectedOption, setSelectedOption] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const { state, dispatch } = useAppState();

  useEffect(() => {
    if (state.workspaces.length) {
      dispatch({
        type: "SET_WORKSPACES",
        payload: {
          workspaces: [
            ...privateWorkspaces,
            ...sharedWorkspaces,
            ...collaboratingWorkspaces,
          ].map((workspace) => ({ ...workspace, folders: [] })),
        },
      });
    }
  }, [privateWorkspaces, sharedWorkspaces, collaboratingWorkspaces]);

  const handleSelect = (option: Workspace) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <span onClick={() => setIsOpen((isOpen) => !isOpen)} />
        {selectedOption ? (
          <SelectedWorkspace workspace={selectedOption} />
        ) : (
          "Select a Workspace"
        )}
      </div>
      {isOpen && (
        <div
          className="origin-top-right
        absolute
        w-full
        rounded-md
        shadow-md
        z-50
        h-[190px]
        bg-black/10
        backdrop-blur-lg
        group
        overflow-scroll
        border-[1px]
        border-muted"
        >
          <div className="rounded-md flex flex-col">
            <div className="!p-2">
              {!!privateWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Private</p>
                  <hr />
                  {privateWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </>
              )}
              {!!sharedWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Shared</p>
                  <hr />
                  {sharedWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </>
              )}
              {!!collaboratingWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Shared</p>
                  <hr />
                  {collaboratingWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </>
              )}
            </div>
            <CustomDialogTrigger
              header="Create A Workspace"
              content={<WorkspaceCreator />}
              description="Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too."
            >
              <div
                className="flex
                transition-all
                hover:bg-muted
                justify-center
                items-center
                gap-2
                p-2
                w-full"
              >
                <article className="text-slate-500 rounded-full bg-slate-800 flex justify-center items-center">
                  +
                </article>
                Create Workspace
              </div>
            </CustomDialogTrigger>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
