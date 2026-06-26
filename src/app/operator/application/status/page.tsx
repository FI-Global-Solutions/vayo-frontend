"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, AlertTriangle, XCircle, CheckCircle2, ChevronRight,
  Loader2, RefreshCw, Send, FileText, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import { ApplicationStatusResponse, ApplicationHistoryItem, OperatorHistoryAction } from "@/lib/types";
import { saveAuth, getStoredUser } from "@/store/auth";
import { AuthUser } from "@/lib/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_MB = 5;

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-RW", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function canReapplyNow(canReapplyAfter: string | null): boolean {
  if (!canReapplyAfter) return true;
  return new Date() >= new Date(canReapplyAfter);
}

const ACTION_LABELS: Record<OperatorHistoryAction, { label: string; color: string }> = {
  SUBMITTED:    { label: "Application submitted",       color: "bg-blue-500" },
  RESUBMITTED:  { label: "Application resubmitted",     color: "bg-blue-500" },
  APPROVED:     { label: "Application approved",        color: "bg-emerald-500" },
  SUSPENDED:    { label: "Account suspended",           color: "bg-red-500" },
  RFA_SENT:     { label: "Information requested",       color: "bg-amber-500" },
  REJECTED:     { label: "Application rejected",        color: "bg-red-600" },
  REACTIVATED:  { label: "Account reactivated",         color: "bg-emerald-500" },
};

// ── sub-components ────────────────────────────────────────────────────────────

function HistoryTimeline({ items }: { items: ApplicationHistoryItem[] }) {
  if (items.length === 0) return null;
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Application Timeline
        </h3>
      </div>
      <div className="p-5 space-y-0">
        {sorted.map((item, i) => {
          const meta = ACTION_LABELS[item.action] ?? { label: item.action, color: "bg-slate-400" };
          return (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${meta.color}`} />
                {i < sorted.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1 mb-1" />}
              </div>
              <div className={`pb-5 ${i === sorted.length - 1 ? "pb-0" : ""}`}>
                <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                {item.notes && (
                  <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {item.actorName !== "System" ? `by ${item.actorName} · ` : ""}
                  {fmt(item.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── file upload zone (reused from register page pattern) ─────────────────────

function FileUploadZone({
  label, icon: Icon, files, maxFiles, onChange,
}: {
  label: string;
  icon: React.ElementType;
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
        toast.error(`"${f.name}" — only JPEG, PNG, or PDF allowed`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds ${MAX_MB} MB`);
        continue;
      }
      valid.push(f);
    }
    onChange([...files, ...valid].slice(0, maxFiles));
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
        <span className="ml-auto font-normal text-slate-400">{files.length}/{maxFiles}</span>
      </label>

      {files.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-colors group"
        >
          <Upload className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 mx-auto mb-1 transition-colors" />
          <p className="text-xs text-slate-400 group-hover:text-slate-600">Click or drag & drop</p>
          <p className="text-xs text-slate-300 mt-0.5">JPEG, PNG or PDF · max {MAX_MB} MB</p>
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

      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-base leading-none">{f.type === "application/pdf" ? "📄" : "🖼️"}</span>
              <span className="flex-1 text-xs text-slate-700 truncate">{f.name}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 text-xs font-bold px-1"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── resubmit form ─────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

function ResubmitForm({ rfaItems, onSuccess, onCancel }: {
  rfaItems: string[];
  onSuccess: (data: ApplicationStatusResponse) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(
    Object.fromEntries(rfaItems.map((_, i) => [i, false]))
  );
  // One File[] bucket per required item, keyed by item index
  const [itemFiles, setItemFiles] = useState<Record<number, File[]>>(
    Object.fromEntries(rfaItems.map((_, i) => [i, []]))
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allChecked = rfaItems.length === 0 || rfaItems.every((_, i) => checkedItems[i]);
  const allFiles = Object.values(itemFiles).flat();
  const hasNewDocs = allFiles.length > 0;

  const setFilesForItem = (i: number, files: File[]) =>
    setItemFiles((prev) => ({ ...prev, [i]: files }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      // Send all uploaded files under "certificates" — the backend stores them
      // as documents for the operator; the item label provides context to the admin
      allFiles.forEach((f) => formData.append("certificates", f));
      const res = await operatorApi.resubmitApplication(formData);
      const data: ApplicationStatusResponse = res.data.data;
      const user = getStoredUser();
      if (user) {
        const updated: AuthUser = { ...user, operatorStatus: data.status };
        const token = localStorage.getItem("vayo_token") ?? "";
        saveAuth(token, updated);
      }
      toast.success("Application resubmitted successfully");
      onSuccess(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to resubmit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${step >= s ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <ChevronRight className="h-4 w-4 text-slate-300" />}
              </div>
            ))}
          </div>
          <h2 className="text-base font-semibold text-slate-800">
            {step === 1 ? "Address Required Items" : step === 2 ? "Add Notes" : "Ready to Submit"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {step === 1 ? "Check off items and upload updated documents if needed"
              : step === 2 ? "Optionally explain your changes to the reviewer"
              : "Review and submit your updated application"}
          </p>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              {rfaItems.length === 0 && (
                <p className="text-sm text-slate-500 italic">
                  No specific items listed — address the reviewer's message and upload any relevant documents below.
                </p>
              )}

              {rfaItems.map((item, i) => (
                <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Item row — checkbox + label */}
                  <label className="flex items-start gap-3 cursor-pointer px-4 py-3 hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={checkedItems[i] ?? false}
                      onChange={(e) => setCheckedItems((prev) => ({ ...prev, [i]: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-sm font-medium transition-colors ${checkedItems[i] ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {item}
                    </span>
                  </label>

                  {/* Upload zone expands when the item is checked */}
                  {checkedItems[i] && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                      <FileUploadZone
                        label={item}
                        icon={FileText}
                        files={itemFiles[i] ?? []}
                        maxFiles={5}
                        onChange={(files) => setFilesForItem(i, files)}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Fallback upload zone when there are no checklist items */}
              {rfaItems.length === 0 && (
                <FileUploadZone
                  label="Supporting documents"
                  icon={FileText}
                  files={itemFiles[0] ?? []}
                  maxFiles={5}
                  onChange={(files) => setFilesForItem(0, files)}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes for reviewer <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Describe what you changed or updated..."
                rows={4}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-800 font-medium">Your application will be resubmitted for review.</p>
                <p className="text-xs text-emerald-600 mt-1">
                  The admin team will be notified and will review your updated application.
                </p>
              </div>
              {rfaItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Items addressed:</p>
                  <ul className="space-y-1">
                    {rfaItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hasNewDocs && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Documents to upload:</p>
                  <ul className="space-y-1">
                    {allFiles.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        {f.name} <span className="text-slate-400">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between flex-shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onCancel : () => setStep((s) => (s - 1) as Step)}
            className="text-sm font-medium text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !allChecked}
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="text-sm font-semibold px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ApplicationStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<ApplicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResubmit, setShowResubmit] = useState(false);

  const fetchStatus = useCallback(async (isInitial = false) => {
    try {
      const res = await operatorApi.getApplicationStatus();
      const incoming: ApplicationStatusResponse = res.data.data;
      setData(incoming);

      if (incoming.status === "ACTIVE") {
        // Update stored auth so the rest of the app reflects approval
        const user = getStoredUser();
        if (user) {
          const updated: AuthUser = { ...user, operatorStatus: "ACTIVE" };
          const token = localStorage.getItem("vayo_token") ?? "";
          saveAuth(token, updated);
        }
        toast.success("Your application has been approved! Welcome to Vayo.");
        router.replace("/operator/dashboard");
      }
    } catch {
      if (isInitial) toast.error("Failed to load application status");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus(true);
    // Poll every 30s so the operator sees approval without refreshing
    const id = setInterval(() => fetchStatus(false), 30_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const handleResubmitSuccess = (updated: ApplicationStatusResponse) => {
    setData(updated);
    setShowResubmit(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Unable to load application status.</p>
      </div>
    );
  }

  const { status, rfaCount, latestRfa, canReapplyAfter, history } = data;
  const rfaItems = latestRfa?.requiredItems ?? [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── PENDING ── */}
        {status === "PENDING" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900">Application Under Review</h1>
                <p className="text-sm text-blue-700 mt-1">
                  Your application has been submitted and is being reviewed by our team. We typically review applications within 1–2 business days.
                </p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">What happens next?</h3>
              <div className="space-y-2">
                {[
                  { done: true,  label: "Application submitted" },
                  { done: false, label: "Admin reviews your documents" },
                  { done: false, label: "Approval decision" },
                  { done: false, label: "Account activated — start creating trips" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                      ${step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${step.done ? "text-slate-500 line-through" : "text-slate-700"}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INFORMATION_REQUIRED ── */}
        {status === "INFORMATION_REQUIRED" && latestRfa && (
          <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-lg font-bold text-amber-900">Action Required</h1>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full flex-shrink-0">
                    RFA {rfaCount}/3
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  The admin team has reviewed your application and needs additional information.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message from reviewer</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{latestRfa.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{fmt(latestRfa.sentAt)}</p>
                </div>
              </div>

              {/* Required items */}
              {rfaItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Required items</p>
                  <ul className="space-y-2">
                    {rfaItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowResubmit(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Resubmit Application
              </button>
            </div>
          </div>
        )}

        {/* ── REJECTED ── */}
        {status === "REJECTED" && (
          <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-6 py-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-red-900">Application Rejected</h1>
                <p className="text-sm text-red-700 mt-1">
                  Unfortunately your application did not meet our requirements.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {canReapplyAfter && !canReapplyNow(canReapplyAfter) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-slate-700">
                    You may reapply after{" "}
                    <span className="font-semibold text-slate-900">{fmtDate(canReapplyAfter)}</span>.
                  </p>
                </div>
              )}

              {canReapplyNow(canReapplyAfter) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-blue-800 font-medium">You are eligible to reapply.</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    You can submit a new application by going through the registration process again.
                  </p>
                </div>
              )}

              {canReapplyNow(canReapplyAfter) && (
                <button
                  type="button"
                  onClick={() => router.push("/operator/register")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Start New Application
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── history ── */}
        <HistoryTimeline items={history} />

        {/* ── resubmit modal ── */}
        {showResubmit && (
          <ResubmitForm
            rfaItems={rfaItems}
            onSuccess={handleResubmitSuccess}
            onCancel={() => setShowResubmit(false)}
          />
        )}
      </div>
    </div>
  );
}
