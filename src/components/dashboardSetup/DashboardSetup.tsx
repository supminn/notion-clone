"use client";
import { AuthUser } from "@supabase/supabase-js";
import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface DashboardSetupProps {
  user: AuthUser;
  subscription: {} | null;
}

const DashboardSetup: React.FC<DashboardSetupProps> = ({
  user,
  subscription,
}) => {
  return (
    <Card className="w-[800px] h-screen sm:h-auto">
      <CardHeader>
        <CardTitle>Create a Workspace</CardTitle>
        <CardDescription>
          Lets create a private workspace to get you started.You can add
          collaborators later from the workspace settings tab.
        </CardDescription>
        <form onSubmit={() => {}}>
          <div className="flex flex-col gap-4"></div>
        </form>
      </CardHeader>
    </Card>
  );
};

export default DashboardSetup;
