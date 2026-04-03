"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getStoredUser } from "@/store/auth";

export default function PasswordResetBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const user = getStoredUser();
      setShow(!!user?.mustResetPassword);
    };
    check();
    window.addEventListener("vayo:auth", check);
    return () => window.removeEventListener("vayo:auth", check);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>
            You&apos;re using a temporary password set by your operator.{" "}
            <span className="font-semibold">Please change it now to secure your account.</span>
          </span>
        </div>
        <Link
          href="/account/password"
          className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Change Password
        </Link>
      </div>
    </div>
  );
}
