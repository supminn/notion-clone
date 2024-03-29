export const dynamic = "force-dynamic";
import React from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import db from "@/lib/supabase/db";
import { redirect } from "next/navigation";
import DashboardSetup from "@/components/dashboardSetup/DashboardSetup";
import { getUserSubscriptionStatus } from "@/lib/supabase/queries";

const DashboardPage = async () => {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { eq, and }) =>
      and(eq(workspace.workspaceOwner, user.id), eq(workspace.inTrash, "")),
  });
  const { data: subscription, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);
  if (subscriptionError) return;
  if (!workspace)
    return (
      <div className="bg-background h-screen w-screen flex justify-center items-center">
        <DashboardSetup
          user={user}
          subscription={subscription}
        ></DashboardSetup>
      </div>
    );

  redirect(`/dashboard/${workspace.id}`);
};

export default DashboardPage;
