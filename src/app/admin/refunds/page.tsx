"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  Loader2, X, Info, ShieldCheck, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import {
  AdminRefundItem, AdminRefundPolicy, RefundStatus, RefundReason,
  PageResponse,
} from "@/lib/types";
import RefundStatusBadge from "@/components/refund/RefundStatusBadge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRwf(n: number | null | undefined) {
  if (n == null) return "—";
  return Number(n).toLocaleString() + " RWF";
}

function fmtDateTime(iso: string | undefined | null) {
  if (!iso) return "—";
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

const REASON_LABELS: Record<RefundReason, string> = {
  PASSENGER_CANCELLED:  "Passenger cancelled",
  OPERATOR_CANCELLED:   "Operator cancelled",
  EARLY_DEPARTURE:      "Early departure",
  FORCE_MAJEURE:        "Force majeure",
  ADMIN_OVERRIDE:       "Admin override",
};

const STATUS_FILTERS: { label: string; value: RefundStatus | "ALL" }[] = [
  { label: "All",              value: "ALL" },
  { label: "Awaiting Review",  value: "AWAITING_APPROVAL" },
  { label: "Approved",         value: "APPROVED" },
  { label: "Processing",       value: "PROCESSING" },
  { label: "Refunded",         value: "COMPLETED" },
  { label: "Failed",           value: "FAILED" },
  { label: "Rejected",         value: "REJECTED" },
];

// ─── Force-approve confirm modal ──────────────────────────────────────────────

function ForceApproveModal({
  refund,
  onConfirm,
  onCancel,
  loading,
}: {
  refund: AdminRefundItem;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Force Approve Refund</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{refund.bookingReference}</p>
          </div>
          <button type="button" onClick={onCancel} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          This bypasses operator review and immediately approves{" "}
          <span className="font-semibold">{fmtRwf(refund.refundAmountRwf)}</span> to the passenger.
          The operator will be notified.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
          This action cannot be undone. Use only for escalated disputes.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Force Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manual refund initiation modal ───────────────────────────────────────────

function InitiateRefundModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (bookingRef: string, reason: RefundReason, notes: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [bookingRef, setBookingRef] = useState("");
  const [reason, setReason] = useState<RefundReason>("ADMIN_OVERRIDE");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!bookingRef.trim()) return;
    setLoading(true);
    await onConfirm(bookingRef.trim().toUpperCase(), reason, notes.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-bold text-slate-900">Initiate Refund</p>
            <p className="text-xs text-slate-400 mt-0.5">Manually trigger a refund for any booking</p>
          </div>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Booking Reference</label>
            <input
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              placeholder="e.g. VYO-XXXXXXXX"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {(Object.keys(REASON_LABELS) as RefundReason[]).map((r) => (
                <option key={r} value={r}>{REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes for audit log"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !bookingRef.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Initiate Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Refund detail drawer ─────────────────────────────────────────────────────

function RefundDetailModal({
  refund,
  onClose,
  onForceApprove,
}: {
  refund: AdminRefundItem;
  onClose: () => void;
  onForceApprove: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-slate-100 flex items-start justify-between px-6 py-4">
          <div>
            <p className="text-xs text-slate-400 font-mono">{refund.bookingReference}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{fmtRwf(refund.refundAmountRwf)}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefundStatusBadge status={refund.status} />
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {refund.escalatedToAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Escalated to admin — operator review period expired without action.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Passenger</p>
              <p className="font-semibold text-slate-800 mt-0.5">{refund.passengerName ?? "—"}</p>
              <p className="text-xs text-slate-500">{refund.passengerPhone ?? ""}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Route</p>
              <p className="font-semibold text-slate-800 mt-0.5">{refund.tripRoute ?? "—"}</p>
              <p className="text-xs text-slate-500">{fmtDateTime(refund.tripDepartureTime)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Amount paid</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtRwf(refund.totalAmountPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Refund amount</p>
              <p className="font-semibold text-emerald-700 mt-0.5">{fmtRwf(refund.refundAmountRwf)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Reason</p>
              <p className="font-semibold text-slate-800 mt-0.5">{REASON_LABELS[refund.refundReason] ?? refund.refundReason}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Hours before departure</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {refund.hoursBeforeDeparture != null ? `${refund.hoursBeforeDeparture}h` : "—"}
              </p>
            </div>
            {refund.appliedPolicyTier && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Policy tier</p>
                <p className="font-semibold text-slate-800 mt-0.5">{refund.appliedPolicyTier}</p>
              </div>
            )}
            {refund.appliedPctUsed != null && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Refund %</p>
                <p className="font-semibold text-slate-800 mt-0.5">{Number(refund.appliedPctUsed).toFixed(0)}%</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Requested at</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(refund.requestedAt)}</p>
            </div>
            {refund.reviewedAt && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Reviewed at</p>
                <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(refund.reviewedAt)}</p>
              </div>
            )}
            {refund.processedAt && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Processed at</p>
                <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(refund.processedAt)}</p>
              </div>
            )}
            {refund.gatewayRefundReference && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Gateway ref</p>
                <p className="font-mono text-xs font-semibold text-slate-700 mt-0.5">{refund.gatewayRefundReference}</p>
              </div>
            )}
          </div>

          {refund.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <p className="text-xs font-semibold mb-0.5">Rejection reason</p>
              {refund.rejectionReason}
            </div>
          )}
          {refund.failureReason && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
              <p className="text-xs font-semibold mb-0.5">Failure reason</p>
              {refund.failureReason}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-slate-100 px-6 py-4 flex gap-3">
          {refund.escalatedToAdmin && refund.status === "AWAITING_APPROVAL" && (
            <button
              type="button"
              onClick={onForceApprove}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Force Approve
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Default Policy tab ──────────────────────────────────────────────

function PolicyTab() {
  const [policy, setPolicy] = useState<AdminRefundPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [over48h,    setOver48h]    = useState("");
  const [h24to48h,   setH24to48h]   = useState("");
  const [h12to24h,   setH12to24h]   = useState("");
  const [h4to12h,    setH4to12h]    = useState("");
  const [under4h,    setUnder4h]    = useState("");

  useEffect(() => {
    adminApi.getDefaultPolicy()
      .then((r) => {
        const p: AdminRefundPolicy = r.data.data;
        setPolicy(p);
        setOver48h(String(p.over48hRefundPct));
        setH24to48h(String(p.h24To48hRefundPct));
        setH12to24h(String(p.h12To24hRefundPct));
        setH4to12h(String(p.h4To12hRefundPct));
        setUnder4h(String(p.under4hRefundPct));
      })
      .catch(() => toast.error("Failed to load default policy"))
      .finally(() => setLoading(false));
  }, []);

  const pct = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const over48Val   = pct(over48h);
  const h24to48Val  = pct(h24to48h);
  const h12to24Val  = pct(h12to24h);
  const h4to12Val   = pct(h4to12h);
  const under4Val   = pct(under4h);

  const over48Error  = over48Val != null && over48Val < 60
    ? "over-48h tier must be ≥ 60%" : null;
  const rangeError   = [over48Val, h24to48Val, h12to24Val, h4to12Val, under4Val].some(
    (v) => v != null && (v < 0 || v > 100)
  ) ? "All values must be between 0 and 100" : null;

  const canSave =
    over48Val != null && h24to48Val != null && h12to24Val != null &&
    h4to12Val != null && under4Val != null &&
    !over48Error && !rangeError;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const r = await adminApi.updateDefaultPolicy({
        over48hRefundPct:  over48Val!,
        h24To48hRefundPct: h24to48Val!,
        h12To24hRefundPct: h12to24Val!,
        h4To12hRefundPct:  h4to12Val!,
        under4hRefundPct:  under4Val!,
      });
      const updated: AdminRefundPolicy = r.data.data;
      setPolicy(updated);
      toast.success(`Default policy updated — v${updated.policyVersion}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const tiers: { label: string; sublabel: string; value: string; setter: (v: string) => void }[] = [
    { label: "More than 48 hours",   sublabel: "Min 60% required",  value: over48h,  setter: setOver48h  },
    { label: "24 – 48 hours",        sublabel: "",                   value: h24to48h, setter: setH24to48h },
    { label: "12 – 24 hours",        sublabel: "",                   value: h12to24h, setter: setH12to24h },
    { label: "4 – 12 hours",         sublabel: "",                   value: h4to12h,  setter: setH4to12h  },
    { label: "Under 4 hours",        sublabel: "Typically 0%",       value: under4h,  setter: setUnder4h  },
  ];

  return (
    <div className="max-w-xl">
      {/* Meta */}
      {policy && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            v{policy.policyVersion}
          </span>
          {policy.effectiveFrom && (
            <span className="text-xs text-slate-400">
              Effective from {format(new Date(policy.effectiveFrom), "dd MMM yyyy")}
            </span>
          )}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2 text-sm text-blue-700">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          This policy applies to operators who have not set a custom policy.
          Changes here do <strong>not</strong> affect existing bookings — only new bookings
          made after saving will use the updated percentages.
        </span>
      </div>

      {/* Tier fields */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-6">
        {tiers.map((tier) => (
          <div key={tier.label} className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{tier.label}</p>
              {tier.sublabel && <p className="text-xs text-slate-400 mt-0.5">{tier.sublabel}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={tier.value}
                onChange={(e) => tier.setter(e.target.value)}
                className="w-20 text-right px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-500 w-4">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Validation errors */}
      {(over48Error || rangeError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
          {over48Error ?? rangeError}
        </div>
      )}

      {/* Platform rules note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600 mb-1.5">Platform rules (always enforced, not configurable)</p>
        <p>• Operator-cancelled trips: 100% full refund including service fee</p>
        <p>• Early departure (&gt;30 min): 100% full refund including service fee</p>
        <p>• Passenger cancellations: service fee is non-refundable</p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Default Policy
      </button>
    </div>
  );
}

// ─── Refund Requests tab ──────────────────────────────────────────────────────

function RefundsTab() {
  const [refunds, setRefunds]       = useState<AdminRefundItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [statusFilter, setStatusFilter]   = useState<RefundStatus | "ALL">("ALL");
  const [escalatedOnly, setEscalatedOnly] = useState(false);

  const [selected, setSelected]             = useState<AdminRefundItem | null>(null);
  const [forceApproveTarget, setForceApproveTarget] = useState<AdminRefundItem | null>(null);
  const [showInitiate, setShowInitiate]     = useState(false);
  const [actioning, setActioning]           = useState(false);

  const escalatedCount = refunds.filter((r) => r.escalatedToAdmin && r.status === "AWAITING_APPROVAL").length;

  const load = useCallback((p = 0, status: RefundStatus | "ALL" = "ALL", escalated = false) => {
    setLoading(true);
    adminApi.refunds({
      status: status === "ALL" ? undefined : status,
      escalatedToAdmin: escalated ? true : undefined,
      page: p,
    })
      .then((r) => {
        const data: PageResponse<AdminRefundItem> = r.data.data;
        // Sort escalated+AWAITING_APPROVAL to top
        const sorted = [...(data.content ?? [])].sort((a, b) => {
          const aEsc = a.escalatedToAdmin && a.status === "AWAITING_APPROVAL" ? 0 : 1;
          const bEsc = b.escalatedToAdmin && b.status === "AWAITING_APPROVAL" ? 0 : 1;
          return aEsc - bEsc;
        });
        setRefunds(sorted);
        setTotalPages(data.totalPages ?? 0);
        setPage(p);
      })
      .catch(() => toast.error("Failed to load refunds"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(0, statusFilter, escalatedOnly);
  }, [statusFilter, escalatedOnly, load]);

  const handleForceApprove = async (refund: AdminRefundItem) => {
    setActioning(true);
    try {
      // Force-approve reuses the operator approve endpoint with admin credentials
      await (await import("@/lib/api")).operatorApi.approveRefund(refund.refundId);
      toast.success(`Refund ${refund.bookingReference} force-approved`);
      setForceApproveTarget(null);
      setSelected(null);
      load(page, statusFilter, escalatedOnly);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to force-approve refund");
    } finally {
      setActioning(false);
    }
  };

  const handleInitiateRefund = async (bookingRef: string, reason: RefundReason, notes: string) => {
    try {
      await adminApi.initiateRefund(bookingRef, reason, notes || undefined);
      toast.success(`Refund initiated for ${bookingRef}`);
      setShowInitiate(false);
      load(page, statusFilter, escalatedOnly);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to initiate refund");
    }
  };

  return (
    <div>
      {/* Escalated banner */}
      {escalatedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {escalatedCount} escalated refund{escalatedCount !== 1 ? "s" : ""} need admin action
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Operator review period expired. These are shown at the top of the list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEscalatedOnly((v) => !v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              escalatedOnly
                ? "bg-amber-600 text-white"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {escalatedOnly ? "Show All" : "Show Escalated"}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-sm">Refund Requests</h2>
          </div>

          {/* Status tabs */}
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

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => setShowInitiate(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              + Initiate Refund
            </button>
            <button
              type="button"
              onClick={() => load(page, statusFilter, escalatedOnly)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : refunds.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No refunds found</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-7 gap-2 px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span className="col-span-2">Booking / Passenger</span>
              <span>Route</span>
              <span className="text-right">Amount</span>
              <span>Reason</span>
              <span>Status</span>
              <span>Requested</span>
            </div>

            <div className="divide-y divide-slate-100">
              {refunds.map((r) => {
                const isEscalatedPending = r.escalatedToAdmin && r.status === "AWAITING_APPROVAL";
                return (
                  <button
                    key={r.refundId}
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group ${
                      isEscalatedPending ? "bg-amber-50/40 hover:bg-amber-50" : ""
                    }`}
                  >
                    {/* Mobile */}
                    <div className="sm:hidden flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono text-xs font-bold text-slate-700">{r.bookingReference}</p>
                          {isEscalatedPending && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{fmtRwf(r.refundAmountRwf)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.passengerName} · {r.tripRoute}</p>
                      </div>
                      <RefundStatusBadge status={r.status} />
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-7 gap-2 items-center">
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono text-xs font-bold text-slate-700 group-hover:text-emerald-600">
                            {r.bookingReference}
                          </p>
                          {isEscalatedPending && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{r.passengerName}</p>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{r.tripRoute ?? "—"}</p>
                      <p className="text-sm font-bold text-slate-900 text-right">{fmtRwf(r.refundAmountRwf)}</p>
                      <p className="text-xs text-slate-500">{REASON_LABELS[r.refundReason] ?? r.refundReason}</p>
                      <RefundStatusBadge status={r.status} />
                      <p className="text-xs text-slate-400">{fmtDateTime(r.requestedAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0 || loading}
                    onClick={() => load(page - 1, statusFilter, escalatedOnly)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => load(page + 1, statusFilter, escalatedOnly)}
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

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {selected && !forceApproveTarget && (
        <RefundDetailModal
          refund={selected}
          onClose={() => setSelected(null)}
          onForceApprove={() => setForceApproveTarget(selected)}
        />
      )}

      {forceApproveTarget && (
        <ForceApproveModal
          refund={forceApproveTarget}
          onConfirm={() => handleForceApprove(forceApproveTarget)}
          onCancel={() => setForceApproveTarget(null)}
          loading={actioning}
        />
      )}

      {showInitiate && (
        <InitiateRefundModal
          onConfirm={handleInitiateRefund}
          onCancel={() => setShowInitiate(false)}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "requests" | "policy";

export default function AdminRefundsPage() {
  const [tab, setTab] = useState<Tab>("requests");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Refund Management</h1>
        <p className="text-slate-500 text-sm mt-1">Review escalated refunds, initiate overrides, and configure the default policy</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: "requests", label: "Refund Requests" },
          { key: "policy",   label: "Platform Default Policy" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "requests" ? <RefundsTab /> : <PolicyTab />}
    </div>
  );
}
