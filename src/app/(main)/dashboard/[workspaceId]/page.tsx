export const dynamic = "force-dynamic"; // router cache can be opted out only after 30 secs.

import QuillEditor from "@/components/quill-editor/QuillEditor";
import { getWorkspaceDetails } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import React from "react";

const WorkspacePage = async ({
  params,
}: {
  params: { workspaceId: string };
}) => {
  const { data, error } = await getWorkspaceDetails(params.workspaceId);
  if (error || !data?.length) redirect("/dashboard");

  return (
    <div className="relative">
      <QuillEditor
        dirType="workspace"
        fileId={params.workspaceId}
        dirDetails={data[0] || []}
      />
    </div>
  );
};

export default WorkspacePage;
