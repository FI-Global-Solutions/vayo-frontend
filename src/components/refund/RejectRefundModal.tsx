"use client";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { operatorApi } from "@/lib/api";

interface Props {
  isOpen: boolean;
  refundId: string;
  passengerName: string;
  refundAmountRwf: number;
  onRejected: () => void;
  onCancelled: () => void;
}

export default function RejectRefundModal({
  isOpen, refundId, passengerName, refundAmountRwf, onRejected, onCancelled,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const valid = reason.trim().length >= 10;

  const handleConfirm = async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      await operatorApi.rejectRefund(refundId, reason.trim());
      setReason("");
      onRejected();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "Failed to reject refund. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        <h3 className="text-base font-bold text-slate-800 mb-1">Reject Refund Request</h3>
        <p className="text-sm text-slate-500 mb-4">
          Rejecting this request means{" "}
          <span className="font-semibold text-slate-700">{passengerName}</span> will not receive
          their{" "}
          <span className="font-semibold text-slate-700">{refundAmountRwf.toLocaleString()} RWF</span>{" "}
          refund. They will be notified of your decision and the reason you provide.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Reason for rejection
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why this refund request cannot be approved..."
            rows={4}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <p className={`text-xs mt-1 ${reason.trim().length < 10 && reason.length > 0 ? "text-red-500" : "text-slate-400"}`}>
            {reason.trim().length}/10 characters minimum
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelled}
            disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!valid || loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
