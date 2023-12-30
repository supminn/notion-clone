This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

---

---

# My Notes

Following the [Web Prodigies](https://www.youtube.com/watch?v=A3l6YYkXzzg) tutorial
[Github repo](https://github.com/webprodigies/webprodigies-cypress/tree/main)

> Alternative resource
> [Code with Antonio](https://www.youtube.com/watch?v=0OaDyjB9Ib8) > [Github repo](https://github.com/AntonioErdeljac/notion-clone-tutorial)

We will use [Shadcn UI](https://ui.shadcn.com/) which is built using Radix UI to create components for our application

## Issues faced

- [Button](https://youtu.be/A3l6YYkXzzg?t=2585) is not defined while referencing it. --> Shadcn UI component
- [Timestamp 2:37:00](https://youtu.be/A3l6YYkXzzg?t=9428) to generate TypeScript types from supabase. It is no longer supported in the UI.
  > Steps to generate types
  ```bash
      $: yarn add supabase -d
      $: yarn supabase login
      open the link and login into your account; a token is generated
      $: yarn supabase gen types typescript --project-id=[your-project-ref] --schema=storage,public > src/lib/supabase/supabase.types.ts
      Change your-project-ref; It will create the types within the mentioned file
  ```
  - After this step, when we linked subscription data from `dashboard/page.tsx` to `DashboardSetup` the page refresh was breaking.
    Commenting out `migrateDb()` from `db` file fixed the above issue. Discussion on this issue in the [video](https://youtu.be/A3l6YYkXzzg?t=17685). Even this does not fix it. The docs have been updated.
  - [onSubmitHandler](https://youtu.be/A3l6YYkXzzg?t=10646) code was not added.
  - When we added a new collaborator schema, `yarn generate` and `yarn dev` to migrate the schema, things stopped working. I had to go into supabase database settings and restart the db. This is due to a timeout error. Fix for this is to use the following code. [discussed on discord](https://discord.com/channels/1073369006272172123/1187303494781247518)
  ```js
  import { PrismaClient } from "@prisma/client";
  declare global {
    var prisma: PrismaClient | undefined;
    }
    export const db = globalThis.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
  ```
  But, they haven't mentioned how to use it? Would we not make use of drizzle orm anymore? not clear at all.
- [Timestamp](https://youtu.be/A3l6YYkXzzg?t=14236) - I am unable to open the dropdown on click
- [No need for this](https://youtu.be/A3l6YYkXzzg?t=16223) as we have added delete on cascade.
- At [Timestamp](https://youtu.be/A3l6YYkXzzg?t=22405) didn't talk about how the profile section is created in the sidebar bottom.
- [Timestamp](https://youtu.be/A3l6YYkXzzg?t=25582) we delete the workspace from db instead of adding it to trash. I have added the trash feature.
- [UserCard](https://youtu.be/A3l6YYkXzzg?t=34383) component is not available in the video
- Real time text updates are working sometimes and not working rest of the times. Cursor update is never happening.

## My Learnings

- How to add background gradient colors for containers
- `twMerge` merges various TailwindCSS configs without any conflicts
- `clsx` takes various types of input (including conditional classNames) and creates a string of classNames. Very handy in this app for testimonials
- [...Array(2).map] is added to repeat the same set twice.
- `npx shadcn-ui` components will automatically import from radix and add the Component in `/components/ui` folder
- Revised how to create and define TypeScript types `/components/landingPage/CardDetailsAsProp`
- Zod is a TypeScript-first schema validation with static type inference. We use it with react-hook-form
- A template.tsx file is similar to a layout.tsx in that it wraps each child layout or page. Unlike layouts that persist across routes and maintain state, templates create a new instance for each of their children on navigation.
- Next.js **Server Actions** are focused on handling server-side tasks such as data updates and form submissions, providing a seamless RPC experience, while React Server Components (RSC) are designed to optimize the user experience by allowing UI rendering and caching on the server, with a focus on reducing the client-side JavaScript bundle and improving performance.
- leading-snug --> line-height: 1.375;
- The `InferSelectModel` function, as the name suggests, infers or deduces the SELECT statement based on the model's structure or schema.
- next/dynamic is a composite of React.lazy() and Suspense. It behaves the same way in the app and pages directories to allow for incremental migration.
- To protect your application from malicious users, configuration is required in order to use external images. This ensures that only external images from your account can be served from the Next.js Image Optimization API. These external images can be configured with the `remotePatterns` property in your `next.config.js` file
- According to PostgresJS official website, PostgresJS is the fastest fully featured PostgreSQL client for Node.js and Deno.
- QuillJS, delta -> to decide which real-time cursor should take precedence. **Read more about how things work**
- You cannot use an API folder in a Next.js application while using Socket.IO because Socket.IO requires a server to handle WebSocket connections, and Next.js doesn't support server-side code in its API routes. While Socket.IO requires a persistent server to handle WebSocket connections, the serverless functions used in the api folder are not suitable for maintaining WebSocket connections.
- We create our own quill-cursor module to track the user's cursor at real time.
- Supabase -> Database -> Replication -> Tables -> Enable [folders, files, workspaces, collaborators]

## Todo

- Add .env to gitIgnore and remove from Github
- Add global loader while changing workspaces, login or signup page.
- Add other details input in sign up form. Add these changes within SettingsForm to update the user info.
- If folder is `inTrash` make sure that the files within this folder are also updated to `isTrash`. Similarly, the same approach for workspace too. (giving some TypeScript error)
- Create `avatars` and `file-banner` storages in supabase and access corresponding data from there.
- Close upload banner modal after upload
- Understand [this](https://youtu.be/A3l6YYkXzzg?t=31556) point that is made. `details` would swap between what we have locally and what is on the server. Initially, it would set the data from the server.

  > We do not broadcast other user's change from socket, but instead fetch it from the server using a `useEffect.
  > If we use only socket, then these changes would be updated locally and not the server
  > If we use both, the data would be updated through the socket as well as the data that is coming from the server.

## My Issue

- [Next steps](https://youtu.be/A3l6YYkXzzg?t=34893) have to be completed. Facing some issue w.r.t sockets.
- Issue was with `@types/quill` version.

```bash
Compiled /api/socket in 91ms (62 modules)
Error handling upgrade request TypeError: Cannot read properties of undefined (reading 'bind')
    at DevServer.handleRequestImpl (/Users/supriyam/Documents/Personal/notion-clone/node_modules/next/dist/server/base-server.js:459:50)
```

- `url/dashboard/[workspaceId]` API call is happening redundantly in the network tab.

## Test

- User profile pic update
- Collaborators profile pic load
- On delete of any file or folder, redirect to parent
- If findMatchingFile util is working fine
