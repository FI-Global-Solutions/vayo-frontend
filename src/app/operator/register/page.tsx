"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Building2, Mail, Phone, FileText, User, Lock, Eye, EyeOff,
  CheckCircle, ChevronRight, ArrowLeft, Shield, TrendingUp, Users,
  Upload, X, Info, IdCard, Award, FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import { VayoLogo } from "@/components/ui/VayoLogo";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompanyForm = {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
};

type AdminForm = {
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  confirmPassword: string;
};

type Step = "company" | "admin" | "documents" | "success";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_MB = 5;

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-slate-400 hover:text-emerald-600 transition-colors"
        aria-label="More info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}

// ─── File Upload Zone ─────────────────────────────────────────────────────────

function FileUploadZone({
  label,
  tooltip,
  files,
  maxFiles,
  onChange,
}: {
  label: string;
  tooltip: string;
  files: File[];
  maxFiles: number;
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid: File[] = [];
    for (const f of Array.from(incoming)) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not allowed — use JPEG, PNG, or PDF`);
        continue;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds the ${MAX_SIZE_MB} MB limit`);
        continue;
      }
      valid.push(f);
    }
    const merged = [...files, ...valid].slice(0, maxFiles);
    onChange(merged);
  };

  const remove = (idx: number) => onChange(files.filter((_, i) => i !== idx));

  const fileIcon = (f: File) =>
    f.type === "application/pdf" ? "📄" : "🖼️";

  return (
    <div>
      <label className="flex items-center text-xs font-semibold text-slate-600 mb-1.5">
        {label}
        <Tooltip text={tooltip} />
        <span className="ml-auto text-slate-400 font-normal">
          {files.length}/{maxFiles} file{maxFiles > 1 ? "s" : ""}
        </span>
      </label>

      {/* Drop zone */}
      {files.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-5 text-center cursor-pointer transition-colors group"
        >
          <Upload className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 mx-auto mb-1.5 transition-colors" />
          <p className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
            Click or drag & drop
          </p>
          <p className="text-xs text-slate-300 mt-0.5">JPEG, PNG or PDF · max {MAX_SIZE_MB} MB</p>
          <input
            ref={inputRef}
            type="file"
            title={`Upload ${label}`}
            accept=".jpg,.jpeg,.png,.pdf"
            multiple={maxFiles > 1}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Selected files */}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
            >
              <span className="text-base leading-none">{fileIcon(f)}</span>
              <span className="flex-1 text-xs text-slate-700 truncate">{f.name}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {(f.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => remove(i)}
                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "company", label: "Company" },
    { key: "admin", label: "Admin" },
    { key: "documents", label: "Documents" },
  ];
  const order: Step[] = ["company", "admin", "documents", "success"];
  const currentIndex = order.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const stepIndex = order.indexOf(step.key);
        const isDone = currentIndex > stepIndex;
        const isActive = currentIndex === stepIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${isDone ? "bg-emerald-600 text-white" : isActive ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : "bg-slate-100 text-slate-400"}`}
              >
                {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap transition-colors duration-300
                  ${isActive || isDone ? "text-emerald-600" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mb-5 mx-2 transition-all duration-500
                  ${currentIndex > stepIndex ? "bg-emerald-600" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, error, children, hint, optional }: {
  label: string; error?: string; children: React.ReactNode; hint?: string; optional?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
        {label}
        {optional
          ? <span className="text-slate-400 font-normal ml-1">(optional)</span>
          : <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OperatorRegisterPage() {
  const [step, setStep] = useState<Step>("company");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyForm | null>(null);
  const [adminData, setAdminData] = useState<AdminForm | null>(null);
  const [nidFiles, setNidFiles] = useState<File[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [registeredCompany, setRegisteredCompany] = useState("");

  const companyForm = useForm<CompanyForm>({ mode: "onChange" });
  const adminForm = useForm<AdminForm>({ mode: "onChange" });

  const onCompanySubmit = (data: CompanyForm) => {
    setCompanyData(data);
    setStep("admin");
  };

  const onAdminSubmit = (data: AdminForm) => {
    if (data.adminPassword !== data.confirmPassword) {
      adminForm.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    setAdminData(data);
    setStep("documents");
  };

  const onDocumentsSubmit = async () => {
    if (!companyData || !adminData) return;

    const formData = new FormData();
    formData.append(
      "data",
      new Blob(
        [JSON.stringify({
          companyName: companyData.companyName,
          contactEmail: companyData.contactEmail,
          contactPhone: companyData.contactPhone,
          description: companyData.description || undefined,
          adminFirstName: adminData.adminFirstName,
          adminLastName: adminData.adminLastName,
          adminEmail: adminData.adminEmail,
          adminPhone: adminData.adminPhone,
          adminPassword: adminData.adminPassword,
        })],
        { type: "application/json" }
      )
    );
    nidFiles.forEach((f) => formData.append("nidDocuments", f));
    certFiles.forEach((f) => formData.append("certificates", f));

    setSubmitting(true);
    try {
      await operatorApi.register(formData);
      setRegisteredCompany(companyData.companyName);
      setStep("success");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <VayoLogo height={40} className="mb-10" />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h1>
            <p className="text-slate-500 text-sm mb-6">
              <span className="font-semibold text-slate-700">{registeredCompany}</span> has been registered
              and is pending review. Our team will verify your documents and activate your account shortly.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What happens next</p>
              {[
                "Our team reviews your company details & documents",
                "You receive an email confirmation once approved",
                "Log in and start adding routes, buses & trips",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
            <Link href="/login" className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-center transition-colors text-sm">
              Go to Login
            </Link>
            <Link href="/" className="block mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <VayoLogo height={40} />
          <h1 className="text-xl font-bold text-slate-800 mt-3">Partner with VAYO</h1>
          <p className="text-sm text-slate-500 mt-1">Join Rwanda&apos;s fastest-growing bus network</p>
        </div>

        {/* Benefits strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: "Grow revenue", sub: "Reach more passengers" },
            { icon: Users, label: "Easy boarding", sub: "Digital manifests" },
            { icon: Shield, label: "Secure payouts", sub: "Weekly settlements" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center hover:border-emerald-200 transition-colors">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                <Icon className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <StepIndicator current={step} />

        {/* ── Step 1: Company Information ── */}
        {step === "company" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Company Information</h2>
                <p className="text-xs text-slate-400">Your business details</p>
              </div>
            </div>
            <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
              <Field label="Company Name" error={companyForm.formState.errors.companyName?.message}>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...companyForm.register("companyName", { required: "Company name is required" })}
                    placeholder="e.g. Volcano Express"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Email" error={companyForm.formState.errors.contactEmail?.message}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...companyForm.register("contactEmail", {
                        required: "Email is required",
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                      })}
                      type="email"
                      placeholder="office@company.com"
                      className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </Field>
                <Field label="Contact Phone" error={companyForm.formState.errors.contactPhone?.message}>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...companyForm.register("contactPhone", { required: "Phone is required" })}
                      placeholder="+250788000000"
                      className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </Field>
              </div>
              <Field label="Description" hint="Tell passengers about your company" optional>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    {...companyForm.register("description")}
                    placeholder="e.g. Premium long-distance coaches with AC & onboard WiFi"
                    rows={3}
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all"
                  />
                </div>
              </Field>
              <button type="submit" disabled={!companyForm.formState.isValid} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-5">
              Already registered?{" "}
              <Link href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: Admin Account ── */}
        {step === "admin" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Admin Account</h2>
                <p className="text-xs text-slate-400">For <span className="font-medium text-slate-600">{companyData?.companyName}</span></p>
              </div>
            </div>
            <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" error={adminForm.formState.errors.adminFirstName?.message}>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      {...adminForm.register("adminFirstName", { required: "Required" })}
                      placeholder="Jean"
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </Field>
                <Field label="Last Name" error={adminForm.formState.errors.adminLastName?.message}>
                  <input
                    {...adminForm.register("adminLastName", { required: "Required" })}
                    placeholder="Mutesi"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" error={adminForm.formState.errors.adminEmail?.message}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...adminForm.register("adminEmail", {
                        required: "Email is required",
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                      })}
                      type="email"
                      placeholder="you@company.com"
                      className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </Field>
                <Field label="Phone" error={adminForm.formState.errors.adminPhone?.message} hint="For account notifications">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...adminForm.register("adminPhone", { required: "Phone is required" })}
                      placeholder="+250788000000"
                      className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </Field>
              </div>
              <Field label="Password" error={adminForm.formState.errors.adminPassword?.message}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...adminForm.register("adminPassword", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Minimum 8 characters" },
                    })}
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" error={adminForm.formState.errors.confirmPassword?.message}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...adminForm.register("confirmPassword", { required: "Please confirm your password" })}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep("company")} className="flex items-center gap-1.5 px-4 py-3.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <ArrowLeft className="h-4 w-4" />Back
                </button>
                <button type="submit" disabled={!adminForm.formState.isValid} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
            <p className="text-center text-xs text-slate-400 mt-4">
              By registering you agree to VAYO&apos;s{" "}
              <span className="text-emerald-600 cursor-pointer hover:underline">operator terms</span>
              {" "}and{" "}
              <span className="text-emerald-600 cursor-pointer hover:underline">commission policy</span>.
            </p>
          </div>
        )}

        {/* ── Step 3: Supporting Documents ── */}
        {step === "documents" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Supporting Documents</h2>
                <p className="text-xs text-slate-400">For <span className="font-medium text-slate-600">{companyData?.companyName}</span></p>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-5 mt-3">
              <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 leading-relaxed">
                Documents are encrypted and only accessible to VAYO verification staff. They will not be shared with third parties.
              </p>
            </div>

            <div className="space-y-5">
              {/* NID */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <IdCard className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">National ID (NID)</span>
                  <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Required</span>
                </div>
                <FileUploadZone
                  label="Upload NID photos"
                  tooltip="Maximum of 2 files (front & back) of your national ID"
                  files={nidFiles}
                  maxFiles={2}
                  onChange={setNidFiles}
                />
              </div>

              {/* Certificates */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Business Certificate(s)</span>
                  <span className="ml-auto text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Required</span>
                </div>
                <FileUploadZone
                  label="Upload certificates"
                  tooltip="Provide a copy of an RDB issued certificate(s)"
                  files={certFiles}
                  maxFiles={5}
                  onChange={setCertFiles}
                />
              </div>
            </div>

            {/* Validation hint */}
            {(nidFiles.length === 0 || certFiles.length === 0) && (
              <p className="text-xs text-amber-600 mt-3 text-center">
                Please upload at least one NID photo and one certificate to continue.
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setStep("admin")}
                className="flex items-center gap-1.5 px-4 py-3.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />Back
              </button>
              <button
                type="button"
                onClick={onDocumentsSubmit}
                disabled={submitting || nidFiles.length === 0 || certFiles.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                {submitting ? "Submitting application..." : "Submit Application"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
