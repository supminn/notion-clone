"use client";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Lock, Plus, Share } from "lucide-react";
import { Button } from "../ui/button";
import { v4 } from "uuid";
import { addCollaborators, createWorkspace } from "@/lib/supabase/queries";
import { useAppState } from "@/lib/providers/state-provider";
import { useRouter } from "next/navigation";
import CollaboratorSearch from "./CollaboratorSearch";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "../ui/use-toast";
import { DialogClose } from "../ui/dialog";

const WorkspaceCreator = () => {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState("private");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<User[]>([]);

  const addCollaborator = (user: User) => {
    setCollaborators((prev) => [...prev, user]);
  };

  const removeCollaborator = (user: User) => {
    setCollaborators((prev) =>
      prev.filter((collaborator) => collaborator.id !== user.id)
    );
  };

  const createItem = async () => {
    setIsLoading(true);
    const uuid = v4();
    if (user?.id) {
      const newWorkspace: Workspace = {
        data: null,
        createdAt: new Date().toISOString(),
        iconId: "💼",
        id: uuid,
        inTrash: "",
        title,
        workspaceOwner: user.id,
        logo: null,
        bannerUrl: "",
      };
      if (permissions === "private") {
        await createWorkspace(newWorkspace);
        toast({
          title: "Success",
          description: "Created the private workspace",
        });
        // ADD_WORKSPACE dispatch doesn't work, we refer to privateWorkspaces
        router.refresh();
      }
      if (permissions === "shared") {
        await createWorkspace(newWorkspace);
        await addCollaborators(collaborators, uuid);
        toast({
          title: "Success",
          description: "Created the shared workspace",
        });
        router.refresh();
      }
    }
    setIsLoading(false);
  };
  return (
    <div className="flex gap-4 flex-col mt-4">
      <div>
        <Label htmlFor="name" className="text-sm text-muted-foreground">
          Name
        </Label>
        <div className="flex justify-center items-center gap-2">
          <Input
            name="name"
            value={title}
            placeholder="Workspace Name"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <>
        <Label htmlFor="permissions" className="text-sm text-muted-foreground">
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
      </>
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
      <DialogClose asChild>
        <Button
          type="button"
          disabled={
            !title ||
            (permissions === "shared" && collaborators.length === 0) ||
            isLoading
          }
          variant="outline"
          onClick={createItem}
        >
          Create
        </Button>
      </DialogClose>
    </div>
  );
};

export default WorkspaceCreator;
