"use client";
import {
  appFoldersType,
  appWorkspacesType,
  useAppState,
} from "@/lib/providers/state-provider";
import { File } from "@/lib/supabase/supabase.types";
import { AppWindowIcon, FileIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { DialogClose } from "../ui/dialog";

const TrashRestore = () => {
  const { state, dispatch, workspaceId } = useAppState();
  const [workspaces, setWorkspaces] = useState<appWorkspacesType[]>([]);
  const [folders, setFolders] = useState<appFoldersType[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const stateWorkspaces = state.workspaces.filter(
      (workspace) => workspace.inTrash
    );
    setWorkspaces(stateWorkspaces);
    const stateFolders =
      state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.filter((folder) => folder.inTrash) || [];
    setFolders(stateFolders);
    const stateFiles: File[] = [];
    state.workspaces
      .find((workspace) => workspace.id === workspaceId)
      ?.folders.forEach((folder) =>
        folder.files.forEach((file) => {
          if (file.inTrash) {
            stateFiles.push(file);
          }
        })
      );
    setFiles(stateFiles);
  }, [state, workspaceId]);

  return (
    <section>
      {!!workspaces.length && (
        <>
          <h3>Workspaces</h3>
          {workspaces.map((workspace) => (
            <DialogClose asChild key={workspace.id}>
              <Link
                className="hover:bg-muted rounded-md p-2 flex items-center justify-between"
                href={`/dashboard/${workspace.id}`}
              >
                <article>
                  <aside className="flex items-center gap-2">
                    {workspace.iconId ?? <AppWindowIcon />} {workspace.title}
                  </aside>
                </article>
              </Link>
            </DialogClose>
          ))}
        </>
      )}
      {!!folders.length && (
        <>
          <h3>Folders</h3>
          {folders.map((folder) => (
            <DialogClose asChild key={folder.id}>
              <Link
                className="hover:bg-muted rounded-md p-2 flex items-center justify-between"
                href={`/dashboard/${folder.workspaceId}/${folder.id}`}
              >
                <article>
                  <aside className="flex items-center gap-2">
                    {folder.iconId ?? <FolderIcon />} {folder.title}
                  </aside>
                </article>
              </Link>
            </DialogClose>
          ))}
        </>
      )}
      {!!files.length && (
        <>
          <h3>Files</h3>
          {files.map((file) => (
            <DialogClose asChild key={file.id}>
              <Link
                className="hover:bg-muted rounded-md p-2 flex items-center justify-between"
                href={`/dashboard/${file.workspaceId}/${file.folderId}/${file.id}`}
              >
                <article>
                  <aside className="flex items-center gap-2">
                    {file.iconId ?? <FileIcon />} {file.title}
                  </aside>
                </article>
              </Link>
            </DialogClose>
          ))}
        </>
      )}
      {!files.length && !folders.length && !workspaces.length && (
        <div
          className="text-muted-foreground
          absolute
          top-[50%]
          left-[50%]
          transform
          -translate-x-1/2
          -translate-y-1/2"
        >
          No Items in Trash
        </div>
      )}
    </section>
  );
};

export default TrashRestore;
