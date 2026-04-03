"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail, Bus, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

type FormData = { email: string };

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, getValues, formState: { isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold text-2xl">
            <Bus className="h-7 w-7" />
            VAYO
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-3">Forgot your password?</h1>
          <p className="text-sm text-slate-500 mt-1">
            {sent ? "Check your inbox" : "We'll send a reset link to your email"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-slate-800 mb-1">Reset link sent!</p>
              <p className="text-sm text-slate-500 mb-1">
                If <span className="font-medium text-slate-700">{getValues("email")}</span> is registered,
                you'll receive a reset link shortly.
              </p>
              <p className="text-xs text-slate-400 mb-6">The link expires in 15 minutes.</p>

              {/* Dev helper — shows in dev mode */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1">🔧 Local dev only</p>
                <p className="text-xs text-amber-600">
                  Check the Spring Boot console log for the reset token — look for{" "}
                  <code className="bg-amber-100 px-1 rounded">PASSWORD RESET TOKEN</code>
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-emerald-600 font-medium hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("email", { required: true })}
                      type="email"
                      placeholder="you@email.com"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5">
                <Link href="/login" className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
