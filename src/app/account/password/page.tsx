"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from "lucide-react";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { saveAuth, getStoredUser } from "@/store/auth";
import { AuthResponse } from "@/lib/types";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConductorReset, setIsConductorReset] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors, isValid },
  } = useForm<FormData>({ mode: "onChange" });

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.push("/login"); return; }
    setIsConductorReset(!!user.mustResetPassword);
  }, [router]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.changePassword(data.currentPassword, data.newPassword);
      const d: AuthResponse = res.data.data;

      // Update stored user — clear mustResetPassword
      saveAuth(d.accessToken, {
        id: d.userId,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        role: d.role,
        mustResetPassword: false,
      });

      toast.success("Password changed successfully");

      if (d.role === "CONDUCTOR") router.push("/conductor/trips");
      else if (d.role === "OPERATOR_ADMIN") router.push("/operator/dashboard");
      else if (d.role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to change password");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <VayoLogo height={40} />

          <div className="mt-4 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-800">
            {isConductorReset ? "Set your own password" : "Change password"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isConductorReset
              ? "Your account was created with a temporary password. Set a private one now."
              : "Enter your current password, then choose a new one."}
          </p>
        </div>

        {/* Conductor notice */}
        {isConductorReset && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Use the temporary password your operator gave you as the current password below, then set your own.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {isConductorReset ? "Temporary password" : "Current password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("currentPassword", { required: "Required" })}
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("newPassword", {
                    required: "Required",
                    minLength: { value: 8, message: "Minimum 8 characters" },
                    validate: {
                      hasUppercase: (v) => /[A-Z]/.test(v) || "Must contain an uppercase letter",
                      hasNumber: (v) => /[0-9]/.test(v) || "Must contain a number",
                    },
                  })}
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("confirmPassword", {
                    required: "Required",
                    validate: (v) => v === watch("newPassword") || "Passwords do not match",
                  })}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  className={`w-full pl-9 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
                    ${errors.confirmPassword
                      ? "border-red-300 focus:ring-red-400"
                      : "border-slate-200 focus:ring-emerald-500"}`}
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password strength checklist */}
            {watch("newPassword") && (
              <div className="space-y-1">
                {[
                  { label: "8+ characters", ok: (watch("newPassword")?.length ?? 0) >= 8 },
                  { label: "Uppercase letter", ok: /[A-Z]/.test(watch("newPassword") ?? "") },
                  { label: "Number", ok: /[0-9]/.test(watch("newPassword") ?? "") },
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
              disabled={isSubmitting || !isValid}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-2 text-sm"
            >
              {isSubmitting ? "Saving..." : "Save New Password"}
            </button>
          </form>

          {!isConductorReset && (
            <p className="text-center text-sm text-slate-500 mt-5">
              <Link href="/" className="text-emerald-600 font-medium hover:underline">
                ← Back
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
