"use client";
import { useState } from "react";
import { Loader2, XCircle, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

interface Props {
  operatorId: string;
  companyName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function RejectOperatorModal({ operatorId, companyName, onSuccess, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.rejectOperator(operatorId, reason.trim());
      toast.success(`${companyName} application rejected`);
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to reject operator");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Reject Application</h2>
            <p className="text-xs text-slate-400 mt-0.5">{companyName}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-800 font-medium">This action cannot be undone immediately.</p>
            <p className="text-xs text-red-600 mt-1">
              The operator will be blocked from the platform for <strong>30 days</strong> before they can reapply.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !reason.trim()}
            onClick={handleSubmit}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            {submitting ? "Rejecting…" : "Reject Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
