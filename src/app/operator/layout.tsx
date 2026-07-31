"use client";
import { usePathname } from "next/navigation";
import HelpButton from "@/components/help/HelpButton";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHelp =
    !pathname.includes("/register") &&
    !pathname.includes("/application");

  return (
    <>
      {children}
      {showHelp && <HelpButton />}
    </>
  );
}
