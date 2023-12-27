import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React, { FC } from "react";
import CustomDialogTrigger from "../global/CustomDialogTrigger";
import BannerUploadForm from "./BannerUploadForm";

interface BannerUploadProps {
  type: "workspace" | "folder" | "file";
  id: string;
  children: React.ReactNode;
  className?: string;
}

const BannerUpload: FC<BannerUploadProps> = ({
  type,
  id,
  children,
  className,
}) => {
  return (
    <CustomDialogTrigger
      header="Upload Banner"
      content={<BannerUploadForm type={type} id={id} />}
      className={className}
    >
      {children}
    </CustomDialogTrigger>
  );
};

export default BannerUpload;
