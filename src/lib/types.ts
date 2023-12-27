import { z } from "zod";

export const FormSchema = z.object({
  email: z.string().describe("Email").email({ message: "Invalid Email" }),
  password: z.string().describe("Password").min(1, "Password is required"),
});

export const CreateWorkspaceFormSchema = z.object({
  workspaceName: z
    .string()
    .describe("workspaceName")
    .min(1, "Workspace name must be min of 1 character"),
  logo: z.any(),
});

// using z.any for logo since it would cause an issue on the server side otherwise

export const UploadBannerFromStorage = z.object({
  banner: z.string().describe("Banner Image"),
});
