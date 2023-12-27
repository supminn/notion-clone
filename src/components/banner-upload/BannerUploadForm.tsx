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
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { toast } from "../ui/use-toast";

interface BannerUploadFormProps {
  details: File | Folder | Workspace;
  type: "workspace" | "folder" | "file";
  id: string;
}
const BannerUploadForm: FC<BannerUploadFormProps> = ({ details, type, id }) => {
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
        prevBannerId = state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === folderId)
          ?.files.find((file) => file.id === id)?.bannerUrl;
        const filePath = await uploadBanner();
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { bannerUrl: filePath },
            fileId: id,
            workspaceId,
            folderId,
          },
        });
        const { error } = await updateFile({ bannerUrl: filePath }, id);
        if (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Could not upload banner for this file",
          });
        } else {
          toast({
            title: "Success",
            description: "Uploaded banner for this file",
          });
        }
      }
      if (type === "folder") {
        if (!workspaceId) return;
        prevBannerId = state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)?.bannerUrl;
        const filePath = await uploadBanner();
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folder: { bannerUrl: filePath },
            workspaceId,
            folderId: id,
          },
        });
        const { error } = await updateFolder({ bannerUrl: filePath }, id);
        if (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Could not upload banner for this folder",
          });
        } else {
          toast({
            title: "Success",
            description: "Uploaded banner for this folder",
          });
        }
      }
      if (type === "workspace") {
        prevBannerId = state.workspaces.find(
          (workspace) => workspace.id === id
        )?.bannerUrl;
        const filePath = await uploadBanner();
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: { workspace: { bannerUrl: filePath }, workspaceId: id },
        });
        const { error } = await updateWorkspace({ bannerUrl: filePath }, id);
        if (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Could not upload banner for this workspace",
          });
        } else {
          toast({
            title: "Success",
            description: "Uploaded banner for this workspace",
          });
        }
      }
      if (prevBannerId) {
        const res = await supabase.storage
          .from("file-banner")
          .remove([prevBannerId]);
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
