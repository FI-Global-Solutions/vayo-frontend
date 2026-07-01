"use client";
import { useEffect } from "react";
import Link from "next/link";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-50 rounded-full mb-6">
          <AlertTriangle className="h-12 w-12 text-red-400" />
        </div>

        <div className="mb-2">
          <VayoLogo height={32} />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 mt-4 mb-2">Something went wrong</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          We hit an unexpected error. Our team has been notified. You can try again or go back to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-slate-300 mt-6 font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
