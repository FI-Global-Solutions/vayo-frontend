"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Lock, Bus, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

type FormData = { newPassword: string; confirmPassword: string };

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
  const newPassword = watch("newPassword");

  if (!token) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="font-semibold text-slate-700 mb-1">Invalid reset link</p>
        <p className="text-sm text-slate-500 mb-4">This link is missing a token.</p>
        <Link href="/forgot-password" className="text-emerald-600 text-sm font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(token, data.newPassword);
      toast.success("Password updated! Redirecting to login...");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? "Reset failed. The link may have expired.");
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-7 w-7 text-emerald-500" />
        </div>
        <p className="font-semibold text-slate-800 mb-1">Password updated!</p>
        <p className="text-sm text-slate-500 mb-4">Redirecting you to login...</p>
        <Link href="/login" className="text-emerald-600 text-sm font-medium hover:underline">
          Go to login now
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register("newPassword", { required: true, minLength: 8 })}
              type={showPass ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword?.type === "minLength" && (
            <p className="text-red-500 text-xs mt-1">At least 8 characters required</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register("confirmPassword", {
                required: true,
                validate: (v) => v === newPassword || "Passwords do not match",
              })}
              type={showPass ? "text" : "password"}
              placeholder="Repeat new password"
              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Password strength indicator */}
        {newPassword && (
          <div className="space-y-1">
            {[
              { label: "8+ characters", ok: newPassword.length >= 8 },
              { label: "Uppercase letter", ok: /[A-Z]/.test(newPassword) },
              { label: "Number", ok: /[0-9]/.test(newPassword) },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ok ? "bg-emerald-500" : "bg-slate-200"}`} />
                <span className={ok ? "text-emerald-600" : "text-slate-400"}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl mt-2"
        >
          {isSubmitting ? "Updating..." : "Set new password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold text-2xl">
            <Bus className="h-7 w-7" />
            VAYO
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-3">Set a new password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose something strong and memorable</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <Suspense fallback={<div className="text-center py-8 text-slate-400 text-sm">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
