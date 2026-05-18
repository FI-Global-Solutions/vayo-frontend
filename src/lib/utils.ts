import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clearStopSelection(tripId: string) {
  sessionStorage.removeItem(`vayo_stop_origin_${tripId}`);
  sessionStorage.removeItem(`vayo_stop_destination_${tripId}`);
}
