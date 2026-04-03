"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Phone, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/store/auth";
import { AuthResponse } from "@/lib/types";

type FormData = { identifier: string; password: string };
type Step = "form" | "otp";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [pendingPhone, setPendingPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { register, handleSubmit, getValues, formState: { isSubmitting } } = useForm<FormData>();

  const finishLogin = (d: AuthResponse) => {
    saveAuth(d.accessToken, {
      id: d.userId,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      role: d.role,
      mustResetPassword: d.mustResetPassword,
    });
    toast.success(`Welcome back, ${d.firstName}!`);
    if (d.mustResetPassword) router.push("/account/password");
    else if (d.role === "OPERATOR_ADMIN") router.push("/operator/dashboard");
    else if (d.role === "ADMIN") router.push("/admin/dashboard");
    else if (d.role === "CONDUCTOR") router.push("/conductor/trips");
    else router.push("/");
  };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.identifier, data.password);
      if (res.status === 202) {
        // Phone login — OTP required
        setPendingPhone(res.data.data.phone);
        setMaskedPhone(res.data.data.maskedPhone);
        setOtp(["", "", "", "", "", ""]);
        setStep("otp");
        toast.info("Verification code sent to your phone");
      } else {
        finishLogin(res.data.data as AuthResponse);
      }
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? "Invalid credentials");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = ["", "", "", "", "", ""];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const submitOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }
    setOtpLoading(true);
    try {
      const res = await authApi.verifyLoginOtp(pendingPhone, code);
      finishLogin(res.data.data as AuthResponse);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { identifier, password } = getValues();
      const res = await authApi.login(identifier, password);
      if (res.status === 202) toast.success("New code sent");
    } catch {
      toast.error("Could not resend code");
    }
  };

  // ── OTP screen ──────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <VayoLogo height={64} transparent className="mb-2" />
            <h1 className="text-xl font-bold text-slate-800 mt-3">Verify it&apos;s you</h1>
            <p className="text-sm text-slate-500 mt-1">
              We sent a 6-digit code to <span className="font-semibold text-slate-700">{maskedPhone}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  aria-label={`OTP digit ${i + 1}`}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ))}
            </div>

            <button
              onClick={submitOtp}
              type="button"
              disabled={otpLoading || otp.join("").length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl"
            >
              {otpLoading ? "Verifying..." : "Sign In"}
            </button>

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-emerald-600 hover:underline font-medium"
              >
                Resend code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Login form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <VayoLogo height={64} transparent className="mb-2" />
          <h1 className="text-xl font-bold text-slate-800 mt-3">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email or phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("identifier", { required: true })}
                  type="text"
                  placeholder="you@email.com or +250788000000"
                  autoComplete="username"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  {...register("password", { required: true })}
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
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
            </div>

            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl mt-2"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
