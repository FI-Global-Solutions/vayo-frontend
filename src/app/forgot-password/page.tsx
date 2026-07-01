"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail, ArrowLeft, CheckCircle, Phone, KeyRound, Lock } from "lucide-react";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

type Method = "email" | "phone";
type PhoneStep = "phone" | "otp" | "password";

type EmailForm   = { email: string };
type PhoneForm   = { phone: string };
type OtpForm     = { otp: string };
type PasswordForm = { newPassword: string; confirmPassword: string };

export default function ForgotPasswordPage() {
  const [method, setMethod]       = useState<Method>("email");
  const [emailSent, setEmailSent] = useState(false);
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [phoneValue, setPhoneValue] = useState("");
  const [otpValue, setOtpValue]   = useState("");

  // ── Email flow ───────────────────────────────────────────────────────────
  const emailForm = useForm<EmailForm>({ mode: "onChange" });
  const onEmailSubmit = async (data: EmailForm) => {
    try {
      await authApi.forgotPassword(data.email);
      setEmailSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Phone flow — step 1: send OTP ───────────────────────────────────────
  const phoneForm = useForm<PhoneForm>({ mode: "onChange" });
  const onPhoneSubmit = async (data: PhoneForm) => {
    try {
      await authApi.forgotPasswordByPhone(data.phone);
      setPhoneValue(data.phone);
      setPhoneStep("otp");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Phone flow — step 2: verify OTP ─────────────────────────────────────
  const otpForm = useForm<OtpForm>({ mode: "onChange" });
  const onOtpSubmit = async (data: OtpForm) => {
    setOtpValue(data.otp);
    setPhoneStep("password");
  };

  // ── Phone flow — step 3: set new password ───────────────────────────────
  const passwordForm = useForm<PasswordForm>({ mode: "onChange" });
  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await authApi.resetPasswordByPhone(phoneValue, otpValue, data.newPassword);
      toast.success("Password reset successfully!");
      setPhoneStep("phone");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Invalid or expired OTP. Please try again.");
      setPhoneStep("otp");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <VayoLogo height={40} />
          <h1 className="text-xl font-bold text-slate-800 mt-3">Forgot your password?</h1>
          <p className="text-sm text-slate-500 mt-1">
            {method === "email" && !emailSent && "We'll send a reset link to your email"}
            {method === "email" && emailSent  && "Check your inbox"}
            {method === "phone" && phoneStep === "phone"    && "We'll send an OTP to your phone"}
            {method === "phone" && phoneStep === "otp"      && "Enter the code we sent you"}
            {method === "phone" && phoneStep === "password" && "Choose a new password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

          {/* Method toggle — only show on first step */}
          {((method === "email" && !emailSent) || (method === "phone" && phoneStep === "phone")) && (
            <div className="flex rounded-xl border border-slate-200 p-1 mb-5 bg-slate-50">
              <button
                type="button"
                onClick={() => setMethod("email")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  method === "email"
                    ? "bg-white shadow-sm text-slate-800 border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => setMethod("phone")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  method === "phone"
                    ? "bg-white shadow-sm text-slate-800 border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Phone className="h-4 w-4" /> Phone
              </button>
            </div>
          )}

          {/* ── Email flow ──────────────────────────────────────────────── */}
          {method === "email" && !emailSent && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...emailForm.register("email", { required: true })}
                    type="email"
                    placeholder="you@email.com"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting || !emailForm.formState.isValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
              >
                {emailForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
              </button>
              <p className="text-center text-sm text-slate-500 mt-2">
                <Link href="/login" className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </Link>
              </p>
            </form>
          )}

          {method === "email" && emailSent && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-slate-800 mb-1">Reset link sent!</p>
              <p className="text-sm text-slate-500 mb-1">
                If <span className="font-medium text-slate-700">{emailForm.getValues("email")}</span> is registered,
                you'll receive a reset link shortly.
              </p>
              <p className="text-xs text-slate-400 mb-6">The link expires in 15 minutes.</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-emerald-600 font-medium hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </Link>
            </div>
          )}

          {/* ── Phone — step 1: enter phone ─────────────────────────────── */}
          {method === "phone" && phoneStep === "phone" && (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...phoneForm.register("phone", { required: true })}
                    type="tel"
                    placeholder="+250788000000"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={phoneForm.formState.isSubmitting || !phoneForm.formState.isValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
              >
                {phoneForm.formState.isSubmitting ? "Sending..." : "Send OTP"}
              </button>
              <p className="text-center text-sm text-slate-500 mt-2">
                <Link href="/login" className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </Link>
              </p>
            </form>
          )}

          {/* ── Phone — step 2: enter OTP ───────────────────────────────── */}
          {method === "phone" && phoneStep === "otp" && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <p className="text-sm text-slate-500 mb-2">
                Enter the 6-digit code sent to <span className="font-medium text-slate-700">{phoneValue}</span>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">OTP code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...otpForm.register("otp", { required: true, minLength: 6, maxLength: 6 })}
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest text-center font-mono text-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={otpForm.formState.isSubmitting || !otpForm.formState.isValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
              >
                Verify OTP
              </button>
              <button
                type="button"
                onClick={() => setPhoneStep("phone")}
                className="w-full text-sm text-slate-500 hover:text-slate-700 mt-1"
              >
                ← Try a different number
              </button>
            </form>
          )}

          {/* ── Phone — step 3: set new password ────────────────────────── */}
          {method === "phone" && phoneStep === "password" && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...passwordForm.register("newPassword", { required: true, minLength: 8 })}
                    type="password"
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...passwordForm.register("confirmPassword", { required: true })}
                    type="password"
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
              >
                {passwordForm.formState.isSubmitting ? "Saving..." : "Set new password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
