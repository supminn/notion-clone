"use client";
import { AuthUser } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import EmojiPicker from "../global/EmojiPicker";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { SubmitHandler, useForm } from "react-hook-form";
import { Subscription, Workspace } from "@/lib/supabase/supabase.types";
import { CreateWorkspaceFormSchema } from "@/lib/types";
import { z } from "zod";
import { v4 } from "uuid";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "../ui/button";
import Loader from "../global/Loader";
import { createWorkspace } from "@/lib/supabase/queries";
import { useAppState } from "@/lib/providers/state-provider";
import { toast } from "../ui/use-toast";

interface DashboardSetupProps {
  user: AuthUser;
  subscription: Subscription | null;
}

const DashboardSetup: React.FC<DashboardSetupProps> = ({
  user,
  subscription,
}) => {
  const router = useRouter();
  const { dispatch } = useAppState();
  const [selectedEmoji, setSelectedEmoji] = useState("💼");
  const supabase = createClientComponentClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting: isLoading, errors },
  } = useForm<z.infer<typeof CreateWorkspaceFormSchema>>({
    mode: "onChange",
    defaultValues: {
      logo: "",
      workspaceName: "",
    },
  });

  const onSubmit: SubmitHandler<
    z.infer<typeof CreateWorkspaceFormSchema>
  > = async (value) => {
    const file = value.logo?.[0];
    let filePath = null;
    // v4 UUID was used instead. I have added this
    const workspaceUUID = v4();

    if (file) {
      try {
        const { data, error } = await supabase.storage
          .from("workspace-logos")
          .upload(`workspaceLogo.${workspaceUUID}`, file, {
            cacheControl: "3600",
            upsert: true,
          });
        if (error) throw new Error("Unable to upload file to workspace logos");
        filePath = data.path;
      } catch (error) {
        console.log("Error", error);
        toast({
          variant: "destructive",
          title: "Error! Could not upload your workspace logo",
        });
      }
    }
    try {
      const newWorkspace: Workspace = {
        data: null,
        createdAt: new Date().toISOString(),
        iconId: selectedEmoji,
        id: workspaceUUID,
        inTrash: "",
        title: value.workspaceName,
        workspaceOwner: user.id,
        logo: filePath || null,
        bannerUrl: "",
      };
      const { error: createError } = await createWorkspace(newWorkspace);
      if (createError)
        throw new Error(
          "Error while creating a new workspace, createWorkspace"
        );
      dispatch({
        type: "ADD_WORKSPACE",
        payload: { ...newWorkspace, folders: [] },
      });
      toast({
        title: "Workspace Created",
        description: `${newWorkspace.title} has been created successfully`,
      });
      router.replace(`/dashboard/${newWorkspace.id}`);
    } catch (error) {
      console.log("Error while creating new workspace", error);
      toast({
        variant: "destructive",
        title: "Could not create your workspace",
        description:
          "Oops! Something went wrond, and we couldn't create your workspace. Try again or come back later.",
      });
    } finally {
      reset();
    }
  };

  return (
    <Card className="w-[800px] h-screen sm:h-auto">
      <CardHeader>
        <CardTitle>Create a Workspace</CardTitle>
        <CardDescription>
          Lets create a private workspace to get you started.You can add
          collaborators later from the workspace settings tab.
        </CardDescription>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                <EmojiPicker getValue={(emoji) => setSelectedEmoji(emoji)}>
                  {selectedEmoji}
                </EmojiPicker>
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
                  disabled={isLoading}
                  {...register("workspaceName", {
                    required: "Workspace name is required",
                  })}
                />
                <small className="text-red-600">
                  {errors.workspaceName?.message?.toString()}
                </small>
              </div>
            </div>
            <div className="w-full">
              <Label htmlFor="logo" className="text-sm text-muted-foreground">
                Workspace Logo
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                placeholder="Workspace Logo"
                {...register("logo", {
                  required: false,
                })}
              />
              <small className="text-red-600">
                {errors.logo?.message?.toString()}
              </small>
              {subscription?.status !== "active" && (
                <small className="text-muted-foreground block">
                  To customise your workspace, ou need to be on a Pro Plan
                </small>
              )}
            </div>
            <div className="self-end">
              <Button disabled={isLoading} type="submit">
                {!isLoading ? "Create Workspace" : <Loader />}
              </Button>
            </div>
          </div>
        </form>
      </CardHeader>
    </Card>
  );
};

export default DashboardSetup;
