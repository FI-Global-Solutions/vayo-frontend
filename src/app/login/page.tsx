"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Mail, Lock, Eye, EyeOff, Phone, ArrowLeft } from "lucide-react";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/store/auth";
import { AuthResponse } from "@/lib/types";

type LoginMethod = "phone" | "email";
type Step = "form" | "otp";
type PhoneFormData = { phone: string; password: string };
type EmailFormData = { email: string; password: string };

// Valid Rwandan mobile prefixes (9 digits after +250)
// MTN: 78x, 79x  |  Airtel: 73x  |  new allocations covered by 72x
const RW_PHONE_RE = /^(078|079|073|072)\d{6}$|^(78|79|73|72)\d{7}$/;

function validateRwandaPhone(value: string) {
  if (!value) return "Phone number is required";
  const digits = value.replace(/\D/g, "");
  // Accept with or without leading 0 (user types without country code)
  if (digits.length !== 9) return "Enter 9 digits (e.g. 788 000 000)";
  if (!/^(78|79|73|72)/.test(digits)) return "Must be an MTN (078, 079) or Airtel (073) Rwanda number";
  return true;
}

function validateEmail(value: string) {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
  return true;
}

export default function LoginPage() {
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [pendingPhone, setPendingPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const phoneForm = useForm<PhoneFormData>({ mode: "onChange" });
  const emailForm = useForm<EmailFormData>({ mode: "onChange" });

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
    else if (d.role === "ADMIN") router.push("/admin/dashboard");
    else if (["OPERATOR_SUPER_ADMIN", "OPERATOR_ADMIN", "DISPATCHER", "ACCOUNTANT"].includes(d.role)) router.push("/operator/dashboard");
    else if (d.role === "CONDUCTOR") router.push("/conductor/trips");
    else router.push("/");
  };

  const onPhoneSubmit = async (data: PhoneFormData) => {
    const identifier = "+250" + data.phone.replace(/\D/g, "");
    try {
      const res = await authApi.login(identifier, data.password);
      if (res.status === 202) {
        setPendingPhone(res.data.data.phone);
        setMaskedPhone(res.data.data.maskedPhone);
        setOtp(["", "", "", "", "", ""]);
        setStep("otp");
        toast.info("Verification code sent to your phone");
      } else {
        finishLogin(res.data.data as AuthResponse);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Invalid credentials. Please try again.");
    }
  };

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      const res = await authApi.login(data.email.trim().toLowerCase(), data.password);
      if (res.status === 202) {
        setPendingPhone(res.data.data.phone);
        setMaskedPhone(res.data.data.maskedPhone);
        setOtp(["", "", "", "", "", ""]);
        setStep("otp");
        toast.info("Verification code sent to your phone");
      } else {
        finishLogin(res.data.data as AuthResponse);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Invalid credentials. Please try again.");
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
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      let identifier: string;
      if (method === "phone") {
        const phone = phoneForm.getValues("phone").replace(/\D/g, "");
        const password = phoneForm.getValues("password");
        identifier = "+250" + phone;
        await authApi.login(identifier, password);
      } else {
        const email = emailForm.getValues("email").trim().toLowerCase();
        const password = emailForm.getValues("password");
        await authApi.login(email, password);
      }
      toast.success("New code sent");
    } catch {
      toast.error("Could not resend code");
    }
  };

  // ── OTP screen ───────────────────────────────────────────────────────────────
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

  // ── Login form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <VayoLogo height={64} transparent className="mb-2" />
          <h1 className="text-xl font-bold text-slate-800 mt-3">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* Method tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                method === "phone"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              Use phone number
            </button>
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                method === "email"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Use email
            </button>
          </div>

          {/* ── Phone form ── */}
          {method === "phone" && (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} noValidate className="space-y-4">
              <div>
                <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                  Phone number
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className={`flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 ${phoneForm.formState.errors.phone ? "border-red-400" : "border-slate-200"}`}>
                  <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 shrink-0">
                    <span className="text-base leading-none">🇷🇼</span>
                    <span className="text-sm font-medium text-slate-600">+250</span>
                  </div>
                  <input
                    {...phoneForm.register("phone", { validate: validateRwandaPhone })}
                    type="tel"
                    inputMode="numeric"
                    placeholder="788 000 000"
                    maxLength={9}
                    autoComplete="tel-national"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                      phoneForm.setValue("phone", val, { shouldValidate: phoneForm.formState.isSubmitted });
                    }}
                    onKeyDown={(e) => {
                      if (!/^\d$/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="flex-1 px-3 py-3 text-sm bg-white focus:outline-none"
                  />
                </div>
                {phoneForm.formState.errors.phone ? (
                  <p className="text-red-500 text-xs mt-1">{phoneForm.formState.errors.phone.message}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">MTN (078, 079) or Airtel (073) Rwanda</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className={`relative border rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 ${phoneForm.formState.errors.password ? "border-red-400" : "border-slate-200"}`}>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...phoneForm.register("password", { required: "Password is required" })}
                    type={showPass ? "text" : "password"}
                    placeholder="Your password"
                    className="w-full pl-9 pr-10 py-3 text-sm bg-transparent focus:outline-none rounded-xl"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {phoneForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{phoneForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end -mt-1">
                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={phoneForm.formState.isSubmitting || !phoneForm.formState.isValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl">
                {phoneForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* ── Email form ── */}
          {method === "email" && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} noValidate className="space-y-4">
              <div>
                <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                  Email address
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className={`relative border rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 ${emailForm.formState.errors.email ? "border-red-400" : "border-slate-200"}`}>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...emailForm.register("email", { validate: validateEmail })}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-3 text-sm bg-transparent focus:outline-none rounded-xl"
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className={`relative border rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 ${emailForm.formState.errors.password ? "border-red-400" : "border-slate-200"}`}>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...emailForm.register("password", { required: "Password is required" })}
                    type={showPass ? "text" : "password"}
                    placeholder="Your password"
                    className="w-full pl-9 pr-10 py-3 text-sm bg-transparent focus:outline-none rounded-xl"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {emailForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end -mt-1">
                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={emailForm.formState.isSubmitting || !emailForm.formState.isValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl">
                {emailForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
