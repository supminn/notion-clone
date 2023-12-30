import { SubscriptionModalContextProvider } from "@/lib/providers/subscription-modal-provider";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}
const Layout: React.FC<LayoutProps> = ({ children, params }) => {
  return (
    <main className="flex overflow-hidden h-screen">
      <SubscriptionModalContextProvider>
        {children}
      </SubscriptionModalContextProvider>
    </main>
  );
};

export default Layout;
