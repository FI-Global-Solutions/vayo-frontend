"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import HelpPanel from "./HelpPanel";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Help and guides"
        title="Help and guides"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 flex items-center justify-center"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {open && <HelpPanel onClose={() => setOpen(false)} />}
    </>
  );
}
