export const dynamic = "force-dynamic";

import QuillEditor from "@/components/quill-editor/QuillEditor";
import { getFileDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

const FilePage = async ({ params }: { params: { fileId: string } }) => {
  const { data, error } = await getFileDetails(params.fileId);
  if (error || !data?.length) redirect("/dashboard");

  return (
    <div className="relative">
      <QuillEditor
        dirType="file"
        fileId={params.fileId}
        dirDetails={data[0] || []}
      />
    </div>
  );
};

export default FilePage;
