"use client";
import { AuthUser } from "@supabase/supabase-js";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
// import EmojiPicker from "../global/EmojiPicker";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FieldValues, useForm } from "react-hook-form";

interface DashboardSetupProps {
  user: AuthUser;
  subscription: {} | null;
}

const DashboardSetup: React.FC<DashboardSetupProps> = ({
  subscription,
  user,
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const {} = useForm<FieldValues>({
    mode: "onChange",
    defaultValues: {
      logo: "",
      workspaceName: "",
    },
  });

  return (
    <Card className="w-[800px] h-screen sm:h-auto">
      <CardHeader>
        <CardTitle>Create A Workspace</CardTitle>
        <CardDescription>
          Let{"'"}s create a private workspace to get you started. You can add
          collaborators later from the workspace settings tab.
        </CardDescription>
        <CardContent>
          <form onSubmit={() => {}}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {/* <EmojiPicker getValue={(emoji) => setSelectedEmoji(emoji)}>
                    {selectedEmoji}
                  </EmojiPicker> */}
                </div>
                <div className="w-full">
                  <Label
                    htmlFor="workspaceName"
                    className="text-sm text-muted-foreground"
                  >
                    Name
                  </Label>
                  <Input
                    id="workspaceName"
                    type="text"
                    placeholder="Workspace Name"
                    className="bg-transparent"
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </CardHeader>
    </Card>
  );
};

export default DashboardSetup;
