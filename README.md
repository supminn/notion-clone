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

# My Notes

Following the [Web Prodigies](https://www.youtube.com/watch?v=A3l6YYkXzzg) tutorial

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
