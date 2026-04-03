"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { User, Mail, Phone, Lock, Eye, EyeOff, MessageSquare, RefreshCw } from "lucide-react";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/store/auth";
import { AuthResponse } from "@/lib/types";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingPhone, setPendingPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { register, handleSubmit, getValues, formState: { isSubmitting, errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data);
      const d = res.data.data as { phone: string; maskedPhone: string };
      setPendingPhone(d.phone);
      setMaskedPhone(d.maskedPhone);
      setStep("otp");
      toast.success(`OTP sent to ${d.maskedPhone}`);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? "Registration failed. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (value && index === 5 && next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (code?: string) => {
    code = code ?? otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }
    setVerifying(true);
    try {
      const res = await authApi.verifyOtp(pendingPhone, code);
      const d: AuthResponse = res.data.data;
      saveAuth(d.accessToken, {
        id: d.userId,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        role: d.role,
        mustResetPassword: false,
      });
      toast.success(`Welcome to VAYO, ${d.firstName}!`);
      router.push("/");
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.register(getValues());
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.success(`New OTP sent to ${maskedPhone}`);
    } catch {
      toast.error("Could not resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── OTP step ─────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <VayoLogo height={64} transparent />
            <div className="mt-4 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Verify your phone</h1>
            <p className="text-sm text-slate-500 mt-1">
              We sent a 6-digit code to <span className="font-semibold text-slate-700">{maskedPhone}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {/* OTP boxes */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  aria-label={`OTP digit ${i + 1}`}
                  className="w-11 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all border-slate-200 bg-slate-50"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={verifying || otp.join("").length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
            >
              {verifying ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-slate-500 hover:text-slate-700"
              >
                ← Change details
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                Resend OTP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <VayoLogo height={64} transparent />
          <h1 className="text-xl font-bold text-slate-800 mt-3">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Book buses across East Africa</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    {...register("firstName", { required: true })}
                    placeholder="John"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
                <input
                  {...register("lastName", { required: true })}
                  placeholder="Doe"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("phone", { required: true })}
                  placeholder="+250788000000"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">We&apos;ll send a verification code to this number</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("password", { required: true, minLength: 8 })}
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
              {errors.password?.type === "minLength" && (
                <p className="text-red-500 text-xs mt-1">Password must be at least 8 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl mt-2"
            >
              {isSubmitting ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
