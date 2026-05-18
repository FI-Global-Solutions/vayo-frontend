"use client";
import { useState, useEffect } from "react";
import { ExternalLink, Loader2, FileText, AlertCircle } from "lucide-react";
import { termsApi } from "@/lib/api";
import { format } from "date-fns";

type TermsVersion = {
  id: string;
  versionLabel: string;
  documentUrl: string;
  effectiveFrom: string;
  summaryOfChanges?: string;
};

type Props = {
  isOpen: boolean;
  termsType: "PASSENGER" | "OPERATOR";
  onAccepted: () => void;
  onDismissed: () => void;
};

export function TermsModal({ isOpen, termsType, onAccepted, onDismissed }: Props) {
  const [terms, setTerms] = useState<TermsVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [acceptError, setAcceptError] = useState("");

  const title = termsType === "PASSENGER" ? "Terms & Conditions" : "Operator Agreement";
  const checkboxLabel =
    termsType === "PASSENGER"
      ? "I have read and agree to the Terms & Conditions"
      : "I have read and agree to the Operator Agreement";

  useEffect(() => {
    if (!isOpen) {
      setChecked(false);
      setAcceptError("");
      return;
    }
    setLoading(true);
    setFetchError("");
    const fetch =
      termsType === "PASSENGER"
        ? termsApi.getCurrentPassengerTerms()
        : termsApi.getCurrentOperatorTerms();

    fetch
      .then((res) => setTerms(res.data.data ?? res.data))
      .catch(() => setFetchError("Could not load terms. Please check your connection and try again."))
      .finally(() => setLoading(false));
  }, [isOpen, termsType]);

  // Block Escape key — user must make an explicit choice
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!terms || !checked) return;
    setAccepting(true);
    setAcceptError("");
    try {
      await termsApi.acceptTerms(terms.id);
      onAccepted();
    } catch {
      setAcceptError("Failed to record acceptance. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    // Full-screen overlay — not dismissable by clicking outside
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 id="terms-modal-title" className="text-base font-bold text-slate-800">{title}</h2>
            {terms && (
              <p className="text-xs text-slate-400 mt-0.5">
                Version {terms.versionLabel} · Effective{" "}
                {format(new Date(terms.effectiveFrom), "d MMM yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">

          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            </div>
          )}

          {fetchError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {fetchError}
            </div>
          )}

          {terms && !loading && (
            <>
              {/* Update notice — only shown when summaryOfChanges is present */}
              {terms.summaryOfChanges && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1">What&apos;s changed in this version</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{terms.summaryOfChanges}</p>
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                To continue, please review the {title} and confirm your agreement below.
              </p>

              <a
                href={terms.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Read full document
              </a>
            </>
          )}
        </div>

        {/* Footer — checkbox + actions */}
        {terms && !loading && !fetchError && (
          <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex-shrink-0 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-snug select-none">
                {checkboxLabel}{" "}
                <span className="text-slate-400 font-normal">({terms.versionLabel})</span>
              </span>
            </label>

            {acceptError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {acceptError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onDismissed}
                disabled={accepting}
                className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={!checked || accepting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {accepting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Recording...</>
                ) : (
                  "Accept and Continue"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Retry button when fetch failed */}
        {fetchError && !loading && (
          <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
            <button
              type="button"
              onClick={onDismissed}
              className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setFetchError("");
                setLoading(true);
                const fetch =
                  termsType === "PASSENGER"
                    ? termsApi.getCurrentPassengerTerms()
                    : termsApi.getCurrentOperatorTerms();
                fetch
                  .then((res) => setTerms(res.data.data ?? res.data))
                  .catch(() => setFetchError("Could not load terms. Please check your connection and try again."))
                  .finally(() => setLoading(false));
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
