"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Banknote, ChevronLeft, ChevronRight, Loader2, RefreshCw,
  X, AlertCircle, CheckCircle2, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { AdminPayoutSummary, PayoutStatus, PageResponse, ReconciliationReport } from "@/lib/types";
import PayoutStatusBadge from "@/components/payouts/PayoutStatusBadge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRwf(n: number | null | undefined) {
  if (n == null) return "0 RWF";
  return Number(n).toLocaleString() + " RWF";
}

function fmtDateTime(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

function fmtDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy");
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  payout,
  onConfirm,
  onCancel,
}: {
  payout: AdminPayoutSummary;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return;
    setSubmitting(true);
    await onConfirm(reason.trim());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-slate-900">Reject Payout</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{payout.payoutReference}</p>
          </div>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          This will reject <span className="font-semibold">{fmtRwf(payout.amountRwf)}</span> and
          notify the operator. Funds return to their available balance.
        </p>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Rejection reason <span className="text-slate-400 font-normal">(min 10 characters)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Payout account details could not be verified"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 10}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject Payout
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function PayoutDetailModal({
  payout,
  onClose,
  onApprove,
  onReject,
  onRetry,
  actioning,
}: {
  payout: AdminPayoutSummary;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRetry: () => void;
  actioning: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-slate-400 font-mono">{payout.payoutReference}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{fmtRwf(payout.amountRwf)}</p>
          </div>
          <div className="flex items-center gap-2">
            <PayoutStatusBadge status={payout.status} />
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-5">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Bookings</p>
            <p className="font-semibold text-slate-800 mt-0.5">{payout.bookingCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Requested</p>
            <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(payout.requestedAt)}</p>
          </div>
          {payout.periodFrom && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Period from</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDate(payout.periodFrom)}</p>
            </div>
          )}
          {payout.periodTo && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Period to</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDate(payout.periodTo)}</p>
            </div>
          )}
          {payout.reviewedAt && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Reviewed</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(payout.reviewedAt)}</p>
            </div>
          )}
          {payout.processedAt && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Processed</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(payout.processedAt)}</p>
            </div>
          )}
          {payout.gatewayTransferId && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Gateway transfer ID</p>
              <p className="font-mono text-xs font-semibold text-slate-700 mt-0.5">{payout.gatewayTransferId}</p>
            </div>
          )}
        </div>

        {payout.status === "REJECTED" && payout.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
            <p className="text-xs font-semibold mb-0.5">Rejection reason</p>
            {payout.rejectionReason}
          </div>
        )}

        {payout.failureReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
            <p className="text-xs font-semibold mb-0.5">Failure reason</p>
            {payout.failureReason}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {payout.status === "PENDING_APPROVAL" && (
            <>
              <button
                type="button"
                onClick={onReject}
                disabled={actioning}
                className="flex-1 py-2.5 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={actioning}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {actioning && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve
              </button>
            </>
          )}
          {payout.status === "FAILED" && (
            <button
              type="button"
              onClick={onRetry}
              disabled={actioning}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {actioning && <Loader2 className="h-4 w-4 animate-spin" />}
              <RefreshCw className="h-4 w-4" />
              Retry Payout
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {payout.status === "PENDING_APPROVAL" || payout.status === "FAILED" ? "Cancel" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reconciliation strip ─────────────────────────────────────────────────────

function ReconciliationStrip({ report }: { report: ReconciliationReport }) {
  const items = [
    { label: "Completed", value: report.totalCompleted, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Processing", value: report.totalProcessing, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { label: "Pending Approval", value: report.totalPendingApproval, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Failed", value: report.totalFailed, color: "text-red-700 bg-red-50 border-red-200" },
    { label: "Rejected", value: report.totalRejected, color: "text-slate-600 bg-slate-100 border-slate-200" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.color}`}>
          <p className="text-lg font-bold tabular-nums">{fmtRwf(item.value)}</p>
          <p className="text-xs font-medium mt-0.5 opacity-80">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: PayoutStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Under Review", value: "PENDING_APPROVAL" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Paid", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Rejected", value: "REJECTED" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPayoutsPage() {
  const [payouts, setPayouts]       = useState<AdminPayoutSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "ALL">("ALL");

  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [reconLoading, setReconLoading]     = useState(true);

  const [selected, setSelected]       = useState<AdminPayoutSummary | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminPayoutSummary | null>(null);
  const [actioning, setActioning]     = useState(false);

  const loadPayouts = useCallback((p = 0, status: PayoutStatus | "ALL" = "ALL") => {
    setLoading(true);
    adminApi.payouts({ status: status === "ALL" ? undefined : status, page: p })
      .then((r) => {
        const data: PageResponse<AdminPayoutSummary> = r.data.data;
        setPayouts(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
        setPage(p);
      })
      .catch(() => toast.error("Failed to load payouts"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPayouts(0, statusFilter);
  }, [statusFilter, loadPayouts]);

  useEffect(() => {
    setReconLoading(true);
    adminApi.reconciliation()
      .then((r) => setReconciliation(r.data.data))
      .catch(() => {/* non-fatal */})
      .finally(() => setReconLoading(false));
  }, []);

  const handleApprove = async (payout: AdminPayoutSummary) => {
    setActioning(true);
    try {
      await adminApi.approvePayout(payout.payoutReference);
      toast.success(`Payout ${payout.payoutReference} approved`);
      setSelected(null);
      loadPayouts(page, statusFilter);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to approve payout");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async (payout: AdminPayoutSummary, reason: string) => {
    setActioning(true);
    try {
      await adminApi.rejectPayout(payout.payoutReference, reason);
      toast.success(`Payout ${payout.payoutReference} rejected`);
      setSelected(null);
      setRejectTarget(null);
      loadPayouts(page, statusFilter);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to reject payout");
    } finally {
      setActioning(false);
    }
  };

  const handleRetry = async (payout: AdminPayoutSummary) => {
    setActioning(true);
    try {
      await adminApi.retryPayout(payout.payoutReference);
      toast.success(`Payout ${payout.payoutReference} queued for retry`);
      setSelected(null);
      loadPayouts(page, statusFilter);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to retry payout");
    } finally {
      setActioning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payout Management</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve operator payout requests</p>
      </div>

      {/* ── Reconciliation strip ─────────────────────────────────────────────── */}
      {reconLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-24 mb-1" />
              <div className="h-3 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : reconciliation && (
        <ReconciliationStrip report={reconciliation} />
      )}

      {/* ── Payouts table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-sm">Payouts</h2>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 flex-wrap sm:ml-4">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => { setStatusFilter(f.value); setPage(0); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadPayouts(page, statusFilter)}
            className="sm:ml-auto p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-16 text-center">
            <Banknote className="h-10 w-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No payouts found</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-6 gap-2 px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span className="col-span-2">Reference / Period</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Bookings</span>
              <span>Status</span>
              <span>Requested</span>
            </div>

            <div className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  {/* Mobile */}
                  <div className="sm:hidden flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-700">{p.payoutReference}</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">{fmtRwf(p.amountRwf)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.requestedAt)} · {p.bookingCount} bookings</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <PayoutStatusBadge status={p.status} />
                      {p.status === "PENDING_APPROVAL" && (
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Action needed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-6 gap-2 items-center">
                    <div className="col-span-2">
                      <p className="font-mono text-xs font-bold text-slate-700 group-hover:text-emerald-600">
                        {p.payoutReference}
                      </p>
                      {p.periodFrom && p.periodTo && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {fmtDate(p.periodFrom)} – {fmtDate(p.periodTo)}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 text-right">{fmtRwf(p.amountRwf)}</p>
                    <p className="text-sm text-slate-500 text-right">{p.bookingCount}</p>
                    <div className="flex items-center gap-2">
                      <PayoutStatusBadge status={p.status} />
                      {p.status === "PENDING_APPROVAL" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" aria-label="Action needed" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{fmtDate(p.requestedAt)}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0 || loading}
                    onClick={() => loadPayouts(page - 1, statusFilter)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => loadPayouts(page + 1, statusFilter)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reconciliation footnote */}
      {reconciliation && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <TrendingUp className="h-3.5 w-3.5" />
          Total lifetime paid out: {fmtRwf(reconciliation.totalCompleted)}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {selected && !rejectTarget && (
        <PayoutDetailModal
          payout={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected)}
          onReject={() => setRejectTarget(selected)}
          onRetry={() => handleRetry(selected)}
          actioning={actioning}
        />
      )}

      {rejectTarget && (
        <RejectModal
          payout={rejectTarget}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
