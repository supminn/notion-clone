import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type dataWithCreatedAtType = {
  createdAt: string;
};
export function sortByCreatedAt(
  a: dataWithCreatedAtType,
  b: dataWithCreatedAtType
) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}
