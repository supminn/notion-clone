"use client";
import SubscriptionModal from "@/components/global/SubscriptionModal";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { ProductWithPrice } from "../supabase/supabase.types";

type SubscriptionModalContextType = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const SubscriptionModalContext = createContext<SubscriptionModalContextType>({
  open: false,
  setOpen: () => {},
});

export const useSubscriptionModal = () => useContext(SubscriptionModalContext);

export const SubscriptionModalContextProvider = ({
  children,
  products,
}: {
  children: React.ReactNode;
  products: ProductWithPrice[];
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SubscriptionModalContext.Provider value={{ open, setOpen }}>
      {children}
      <SubscriptionModal products={products} />
    </SubscriptionModalContext.Provider>
  );
};