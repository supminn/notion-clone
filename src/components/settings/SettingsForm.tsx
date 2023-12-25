"use client";
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useAppState } from "@/lib/providers/state-provider";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Briefcase, Lock, Plus, Share } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  addCollaborators,
  removeCollaborators,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { v4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import CollaboratorSearch from "../global/CollaboratorSearch";
import { Alert, AlertDescription } from "../ui/alert";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

const SettingsForm = () => {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const { state, dispatch, workspaceId } = useAppState();
  const { user } = useSupabaseUser();
  const router = useRouter();
  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>(); // debounce timer to make the title change
  // TODO: convert them to useReducer approach
  const [permissions, setPermissions] = useState("private"); // This should ideally be fetched by checking the workspace details
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace>();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Payment portal - billing options and its redirect

  // Add collaborators
  const addCollaborator = async (user: User) => {
    if (!workspaceId) return;
    // subscription
    // if(subscriptionStatus?.status !=='active' && collaborators.length >= 2){
    //     setOpen(true);
    //     return
    // }
    await addCollaborators(collaborators, workspaceId);
    setCollaborators((prev) => [...prev, user]);
    router.refresh();
  };

  // Remove collaborators
  const removeCollaborator = async (user: User) => {
    if (!workspaceId) return;
    if (collaborators.length === 1) {
      setPermissions("private");
    }
    await removeCollaborators([user], workspaceId);
    setCollaborators((prev) =>
      prev.filter((collaborator) => collaborator.id !== user.id)
    );
  };

  // onChanges
  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || !e.target.value) return;
    dispatch({
      type: "UPDATE_WORKSPACE",
      payload: { workspaceId, workspace: { title: e.target.value } },
    });
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      await updateWorkspace({ title: e.target.value }, workspaceId);
    });
  };

  const workspaceLogoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!workspaceId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingLogo(true);
    // supabse suggests to create a new line item each time than to replace the existing one. Storage takes some time to update the existing data.
    // TODO: remove the older data while adding this new line item
    const prevLogoId = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    )?.logo;
    const { data, error } = await supabase.storage
      .from("workspace-logos")
      .upload(`workspaceLogo.${uuid}`, file, {
        cacheControl: "3600",
        upsert: true,
      });
    if (error) throw new Error("Unable to upload file to workspace logos");
    if (data) {
      const { error: dbError } = await updateWorkspace(
        { logo: data.path },
        workspaceId
      );
      if (dbError) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update workspace logo",
        });
      } else {
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: { workspace: { logo: data.path }, workspaceId },
        });
        toast({
          title: "Success",
          description: "Updated workspace logo",
        });
      }
    }
    if (prevLogoId) {
      const res = await supabase.storage
        .from("workspace-logos")
        .remove([prevLogoId]);
      console.log("Logging res", res);
    }
    setUploadingLogo(false);
  };

  // onClickAlerts
  const onDeleteHandler = async () => {
    if (!workspaceId) return;
    await updateWorkspace({ inTrash: `Deleted by ${user?.id}` }, workspaceId);
    toast({ title: "Success", description: "Deleted your workspace" });
    dispatch({
      type: "UPDATE_WORKSPACE",
      payload: {
        workspace: { inTrash: `Deleted by ${user?.id}` },
        workspaceId,
      },
    });
    router.replace(`/dashboard`);
  };
  // Fetching avatar details from supabase storage
  // Get workspace details
  // Get all collaborators

  useEffect(() => {
    const showingWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspaceId, state.workspaces]);

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} /> Workspace
      </p>
      <hr />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="workspaceName"
          className="text-sm text-muted-foreground"
        >
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails.title : ""}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
        <Label
          htmlFor="workspaceLogo"
          className="text-sm text-muted-foreground"
        >
          Workspace Logo
        </Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          placeholder="Workspace Logo"
          onChange={workspaceLogoChange}
          disabled={uploadingLogo}
          // subscription check
        />
        {/* subscriptions */}
        <Label htmlFor="permissions" className="mb-4">
          Permissions
        </Label>
        <Select
          onValueChange={(value) => setPermissions(value)}
          defaultValue={permissions}
        >
          <SelectTrigger className="w-full h-26 -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Lock />
                  <article className="text-left flex flex-col">
                    <span>Private</span>
                    <p>
                      Your workspace is private to you. You can choose to share
                      it later.
                    </p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Share />
                  <article className="text-left flex flex-col">
                    <span>Shared</span>
                    <p>You can invite collaborators</p>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {permissions === "shared" && (
          <div>
            <CollaboratorSearch
              existingCollaborators={collaborators}
              addCollaborator={addCollaborator}
            >
              <Button type="button" className="text-sm mt-4">
                <Plus />
                Add Collaborators
              </Button>
            </CollaboratorSearch>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                Collaborators ({collaborators.length || ""})
              </span>
              <ScrollArea
                className="h-[120px]
              overflow-y-scroll
              w-full
              rounded-md
              border
              border-muted-foreground/20"
              >
                {collaborators.length ? (
                  collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <div className="gap-4 flex items-center">
                        <Avatar>
                          <AvatarImage src="/avatars/5.png" />
                          <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <div
                          className="text-sm
                          gap-2
                          text-muted-foreground
                          overflow-hidden
                          overflow-ellipsis
                          sm:w-[300px]
                          w-[140px]"
                        >
                          {collaborator.email}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => removeCollaborator(collaborator)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="absolute right-0 left-0 top-0 bottom-0 flex justify-center items-center">
                    <span className="text-muted-foreground text-sm">
                      You have no collaborators
                    </span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
        <small className="text-sm text-muted-foreground">
          Changes would be auto-saved.
        </small>
        <hr />
        <Alert variant="destructive">
          <AlertDescription>
            Warning! Deleting your workspace will permanently delete all the
            data related to this workspace
          </AlertDescription>
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            className="mt-4 text-sm bg-destructive/40 border-2 border-destructive"
            onClick={onDeleteHandler}
          >
            Delete Workspace
          </Button>
        </Alert>
      </div>
    </div>
  );
};

export default SettingsForm;
