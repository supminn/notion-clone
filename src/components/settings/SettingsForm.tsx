"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/lib/providers/state-provider";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Briefcase,
  CreditCard,
  ExternalLink,
  Lock,
  LogOut,
  Plus,
  Share,
  UserIcon,
} from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  addCollaborators,
  findUser,
  getCollaborators,
  getUserDetails,
  removeCollaborators,
  updateUser,
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
import { updateWorkspaceStateAndDb } from "@/lib/server-actions/db-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Separator } from "../ui/separator";
import ProfileIcon from "../icons/ProfileIcon";
import Link from "next/link";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import LogoutButton from "../global/LogoutButton";
import { postData } from "@/lib/utils";

const SettingsForm = () => {
  const supabase = createClientComponentClient();
  const { state, dispatch, workspaceId } = useAppState();
  const { user, subscription } = useSupabaseUser();
  const { setOpen } = useSubscriptionModal();
  const router = useRouter();
  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>(); // debounce timer to make the title change
  // TODO: convert them to useReducer approach
  const [permissions, setPermissions] = useState("private"); // This should ideally be fetched by checking the workspace details
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace>();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const avatarUrl = useMemo(() => {
    if (!user?.id) return "";
    (async () => {
      const response = await findUser(user.id);
      if (!response || !response.avatarUrl) return "";
      return supabase.storage.from("avatars").getPublicUrl(response.avatarUrl)
        .data.publicUrl;
    })();
  }, [user, supabase.storage]);

  // Payment portal - billing options and its redirect
  const redirectToCustomerPortal = async () => {
    setLoadingPortal(true);
    try {
      const { url, error } = await postData({
        url: `/api/create-portal-link`,
      });
      window.location.assign(url);
    } catch (error) {
      console.log("Error in redirectToCustomerPortal", error);
    } finally {
      setLoadingPortal(false);
    }
  };

  // Add collaborators
  const addCollaborator = async (user: User) => {
    if (!workspaceId) return;
    // subscription
    if (subscription?.status !== "active" && collaborators.length >= 2) {
      setOpen(true);
      return;
    }
    await addCollaborators([user], workspaceId);
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
    // TODO: move this into utils and make it common for all the 3 storage buckets
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
      await updateWorkspaceStateAndDb({
        dispatch,
        workspaceId,
        data: { logo: data.path },
        error: "Could not update workspace logo",
        success: "Updated workspace logo",
      });
    }
    if (prevLogoId) {
      await supabase.storage.from("workspace-logos").remove([prevLogoId]);
    }
    setUploadingLogo(false);
  };

  const uploadProfilePicture = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!workspaceId || !user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingProfilePic(true);
    // supabse suggests to create a new line item each time than to replace the existing one. Storage takes some time to update the existing data.
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(`userPic.${uuid}`, file, {
        cacheControl: "3600",
        upsert: true,
      });
    if (error) throw new Error("Unable to upload file to workspace logos");
    if (data) {
      const { data: userData } = await getUserDetails(user.id);
      if (userData && userData[0]) {
        const prevPicUrl = userData[0].avatarUrl;
        if (prevPicUrl) {
          await supabase.storage.from("avatars").remove([prevPicUrl]);
        }
      }
      await updateUser({ avatarUrl: data.path }, user.id);
      setUploadingProfilePic(false);
    }
  };

  // onClickAlerts
  const onDeleteHandler = async () => {
    if (!workspaceId) return;
    await updateWorkspaceStateAndDb({
      dispatch,
      workspaceId,
      data: { inTrash: `Deleted by ${user?.email}` },
      error: "Could not delete the workspace",
      success: "Deleted your workspace",
    });
    router.replace(`/dashboard`);
  };

  const onClickAlertConfirm = async () => {
    if (!workspaceId) return;
    if (collaborators.length > 0) {
      await removeCollaborators(collaborators, workspaceId);
    }
    setPermissions("private");
    setOpenAlertMessage(false);
    router.refresh();
  };

  const onPermissionChange = (value: string) => {
    if (value === "private") {
      setOpenAlertMessage(true);
    } else {
      setPermissions(value);
    }
  };

  // TODO: Fetching avatar details from supabase storage

  // Get workspace details
  useEffect(() => {
    const showingWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspaceId, state.workspaces]);

  // Get all collaborators
  useEffect(() => {
    if (!workspaceId) return;
    const fetchCollaborators = async () => {
      const response = await getCollaborators(workspaceId);
      if (response?.length) {
        setPermissions("shared");
        setCollaborators(response);
      }
    };
    fetchCollaborators();
  }, [workspaceId]);

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} /> Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="workspaceName"
          className="text-sm text-muted-foreground"
        >
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails?.title ?? ""}
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
          disabled={uploadingLogo || subscription?.status !== "active"}
        />
        {subscription?.status !== "active" && (
          <small className="text-muted-foreground">
            To customize your workspace, you need to be on a Pro Plan
          </small>
        )}
        <Label htmlFor="permissions" className="mb-4">
          Permissions
        </Label>
        <Select onValueChange={onPermissionChange} value={permissions}>
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
                          <AvatarImage
                            src={
                              collaborator.avatarUrl
                                ? supabase.storage
                                    .from("avatars")
                                    .getPublicUrl(collaborator.avatarUrl).data
                                    .publicUrl
                                : "/avatars/5.png"
                            }
                          />
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
        <Separator />
        <Alert variant="destructive" className="mt-4">
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
        <div className="flex justify-between mt-3">
          <p className="flex items-center gap-2">
            <UserIcon size={20} /> Profile
          </p>
          <LogoutButton>
            <div className="flex items-center">
              <LogOut size={20} />
            </div>
          </LogoutButton>
        </div>
        <Separator />
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
              <ProfileIcon />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col ml-6">
            <small className="text-muted-foreground cursor-not-allowed">
              {user ? user.email : ""}
            </small>
            <Label
              htmlFor="profilePicture"
              className="text-sm text-muted-foreground"
            >
              Profile Picture
            </Label>
            <Input
              type="file"
              accept="image/*"
              id="profilePicture"
              placeholder="Profile Picture"
              onChange={uploadProfilePicture}
              disabled={uploadingProfilePic}
            />
          </div>
        </div>
        <p className="flex items-center gap-2 mt-4">
          <CreditCard size={20} />
          Billing & Plan
        </p>
        <Separator />
        <p className="text-muted-foreground">
          You are currently on a{" "}
          {subscription?.status === "active" ? "Pro" : "Free"} Plan
        </p>
        <Link
          href="/"
          target="_blank"
          className="text-muted-foreground flex flex-row items-center"
        >
          View Plans <ExternalLink size={16} className="ml-1" />
        </Link>
        {subscription?.status === "active" ? (
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingPortal}
              className="text-sm"
              onClick={redirectToCustomerPortal}
            >
              Manage Subscription
            </Button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-sm"
              onClick={() => setOpen(true)}
            >
              Start Plan
            </Button>
          </div>
        )}
        <AlertDialog open={openAlertMessage}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDescription>
                Changing a shared workspace to a private workspace will remove
                all collaborators permanantly
              </AlertDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={onClickAlertConfirm}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsForm;
