"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Folder, Workspace } from "@/lib/supabase/supabase.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React, { FC } from "react";

interface BannerUploadFormProps {
  details: File | Folder | Workspace;
  type: "workspace" | "folder" | "file";
  id: string;
}
const BannerUploadForm: FC<BannerUploadFormProps> = ({ details, type, id }) => {
  const supabase = createClientComponentClient();
  const { state, workspaceId, folderId, dispatch } = useAppState();

  return <div></div>;
};

export default BannerUploadForm;
