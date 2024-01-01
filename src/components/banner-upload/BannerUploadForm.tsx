"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Folder, Workspace } from "@/lib/supabase/supabase.types";
import { UploadBannerFromStorage } from "@/lib/types";
// import { zodResolver } from "@hookform/resolvers/zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React, { FC } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../global/Loader";
import { v4 } from "uuid";
import {
  updateFileStateAndDb,
  updateFolderStateAndDb,
  updateWorkspaceStateAndDb,
} from "@/lib/server-actions/db-actions";
import { findMatchingFile, findMatchingFolder } from "@/lib/utils";

interface BannerUploadFormProps {
  type: "workspace" | "folder" | "file";
  id: string;
}
const BannerUploadForm: FC<BannerUploadFormProps> = ({ type, id }) => {
  const supabase = createClientComponentClient();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting: isUploading, errors },
  } = useForm<z.infer<typeof UploadBannerFromStorage>>({
    mode: "onChange",
    // resolver: zodResolver(UploadBannerFromStorage),
    defaultValues: {
      banner: "",
    },
  });

  const onSubmitHandler: SubmitHandler<
    z.infer<typeof UploadBannerFromStorage>
  > = async (values) => {
    const file = values.banner?.[0];
    if (!file || !id) return;
    let prevBannerId;
    try {
      const uploadBanner = async () => {
        const uuid = v4();
        const { data, error } = await supabase.storage
          .from("file-banner")
          .upload(`banner-${uuid}`, file, { cacheControl: "5", upsert: true });
        if (error) {
          console.log("Error in uploading banner image", error);
          throw new Error();
        }
        return data.path;
      };
      if (type === "file") {
        if (!workspaceId || !folderId) return;
        prevBannerId = findMatchingFile(
          state.workspaces,
          workspaceId,
          folderId,
          id
        )?.bannerUrl;
        const filePath = await uploadBanner();
        await updateFileStateAndDb({
          dispatch,
          workspaceId,
          folderId,
          fileId: id,
          data: { bannerUrl: filePath },
          error: "Could not upload banner for this file",
          success: "Uploaded banner for this file",
        });
      }
      if (type === "folder") {
        if (!workspaceId) return;
        prevBannerId = findMatchingFolder(
          state.workspaces,
          workspaceId,
          id
        )?.bannerUrl;
        const filePath = await uploadBanner();
        await updateFolderStateAndDb({
          dispatch,
          data: { bannerUrl: filePath },
          workspaceId,
          folderId: id,
          error: "Could not upload banner for this folder",
          success: "Uploaded banner for this folder",
        });
      }
      if (type === "workspace") {
        prevBannerId = state.workspaces.find(
          (workspace) => workspace.id === id
        )?.bannerUrl;
        const filePath = await uploadBanner();
        await updateWorkspaceStateAndDb({
          dispatch,
          data: { bannerUrl: filePath },
          workspaceId: id,
          error: "Could not upload banner for this workspace",
          success: "Uploaded banner for this workspace",
        });
      }
      if (prevBannerId) {
        await supabase.storage.from("file-banner").remove([prevBannerId]);
      }
    } catch (error) {
      console.log("Error in uploading banner");
    }
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={handleSubmit(onSubmitHandler)}
    >
      <Label htmlFor="bannerImage" className="text-sm text-muted-foreground">
        Banner Image
      </Label>
      <Input
        id="bannerImage"
        type="file"
        accept="image/*"
        disabled={isUploading}
        {...register("banner", { required: "Banner Image is required" })}
      />
      <small className="text-red-600">
        {errors.banner?.message?.toString()}
      </small>
      <Button type="submit" disabled={isUploading}>
        {!isUploading ? "Upload Banner" : <Loader />}
      </Button>
    </form>
  );
};

export default BannerUploadForm;
