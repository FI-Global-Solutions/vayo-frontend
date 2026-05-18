"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  AlertTriangle, CheckCircle2, Clock, Loader2, Phone, User, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import { OperatorRefundItem, RefundStatus } from "@/lib/types";
import RefundStatusBadge from "@/components/refund/RefundStatusBadge";
import RejectRefundModal from "@/components/refund/RejectRefundModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "AWAITING_APPROVAL" | "APPROVED" | "REJECTED" | "ALL";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "AWAITING_APPROVAL", label: "Awaiting Review" },
  { key: "APPROVED",          label: "Approved" },
  { key: "REJECTED",          label: "Rejected" },
  { key: "ALL",               label: "All" },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  // LocalDateTime from backend has no timezone suffix — treat as UTC by appending Z
  const normalized = iso.includes("Z") || iso.includes("+") ? iso : iso + "Z";
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy, HH:mm");
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OperatorRefundsPage() {
  const [refunds, setRefunds] = useState<OperatorRefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("AWAITING_APPROVAL");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Approve flow
  const [toApprove, setToApprove] = useState<OperatorRefundItem | null>(null);
  const [approving, setApproving] = useState(false);

  // Reject flow
  const [toReject, setToReject] = useState<OperatorRefundItem | null>(null);

  const loadRefunds = useCallback((tab: FilterTab, p = 0) => {
    setLoading(true);
    const status = tab === "ALL" ? undefined : tab;
    operatorApi.getRefunds(status, p)
      .then((r) => {
        const data = r.data.data;
        setRefunds(data.content ?? []);
        setHasMore(!data.last);
        setPage(data.page ?? p);
      })
      .catch(() => setRefunds([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRefunds(activeTab, 0); }, [activeTab, loadRefunds]);

  const pendingCount = refunds.filter((r) => r.status === "AWAITING_APPROVAL").length;

  const handleApprove = async () => {
    if (!toApprove) return;
    setApproving(true);
    try {
      await operatorApi.approveRefund(toApprove.refundId);
      toast.success("Refund approved — passenger will be notified");
      loadRefunds(activeTab, page);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      const msg = err?.response?.status === 409
        ? "This refund cannot be approved in its current state."
        : (err?.response?.data?.message ?? "Failed to approve refund.");
      toast.error(msg);
    } finally {
      setApproving(false);
      setToApprove(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Refund Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Review and respond to passenger cancellation refund requests</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {label}
            {key === "AWAITING_APPROVAL" && pendingCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                activeTab === key ? "bg-white text-emerald-700" : "bg-amber-500 text-white"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && refunds.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No refund requests awaiting review</p>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === "AWAITING_APPROVAL"
              ? "All caught up — no pending refund requests."
              : "No refund requests match the selected filter."}
          </p>
        </div>
      )}

      {/* Refund cards */}
      {!loading && refunds.length > 0 && (
        <div className="space-y-4">
          {refunds.map((item) => (
            <RefundCard
              key={item.refundId}
              item={item}
              onApprove={() => setToApprove(item)}
              onReject={() => setToReject(item)}
            />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => loadRefunds(activeTab, page - 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400">Page {page + 1}</span>
            <button
              type="button"
              disabled={!hasMore || loading}
              onClick={() => loadRefunds(activeTab, page + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Approve confirmation */}
      {toApprove && (
        <ConfirmDialog
          isOpen
          title="Approve Refund"
          message={`Approve refund of ${toApprove.refundAmountRwf.toLocaleString()} RWF to ${toApprove.passengerName}? The refund will be processed automatically.`}
          confirmLabel="Approve Refund"
          confirmVariant="primary"
          onConfirm={handleApprove}
          onCancel={() => setToApprove(null)}
          isLoading={approving}
        />
      )}

      {/* Reject modal */}
      {toReject && (
        <RejectRefundModal
          isOpen
          refundId={toReject.refundId}
          passengerName={toReject.passengerName}
          refundAmountRwf={toReject.refundAmountRwf}
          onRejected={() => { setToReject(null); loadRefunds(activeTab, page); toast.success("Refund rejected — passenger will be notified"); }}
          onCancelled={() => setToReject(null)}
        />
      )}
    </div>
  );
}

// ─── Refund card ──────────────────────────────────────────────────────────────

function RefundCard({
  item, onApprove, onReject,
}: {
  item: OperatorRefundItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = item.status === "AWAITING_APPROVAL";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-slate-800 text-sm">{item.bookingReference}</span>
          <RefundStatusBadge status={item.status as RefundStatus} />
          {item.escalatedToAdmin && (
            <span
              className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full"
              title="This request is overdue and has been flagged to VAYO admin"
            >
              <AlertTriangle className="h-3 w-3" />
              Flagged to admin
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
          <Clock className="h-3 w-3" />
          Requested {fmtDate(item.requestedAt)}
        </span>
      </div>

      {/* Passenger + route */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-800">{item.passengerName}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {item.passengerPhone}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
          {item.tripRoute}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {fmtDate(item.tripDepartureTime)}
        </span>
      </div>

      {/* Refund detail */}
      <div className="bg-slate-50 rounded-xl px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {item.totalAmountPaid != null && (
          <div>
            <p className="text-slate-400 uppercase tracking-wide">Amount Paid</p>
            <p className="font-semibold text-slate-700 mt-0.5">{item.totalAmountPaid.toLocaleString()} RWF</p>
          </div>
        )}
        {item.hoursBeforeDeparture != null && (
          <div>
            <p className="text-slate-400 uppercase tracking-wide">Cancelled</p>
            <p className="font-semibold text-slate-700 mt-0.5">{item.hoursBeforeDeparture}h before departure</p>
          </div>
        )}
        {item.appliedPolicyTier && (
          <div>
            <p className="text-slate-400 uppercase tracking-wide">Policy tier</p>
            <p className="font-semibold text-slate-700 mt-0.5">{item.appliedPolicyTier.replace(/_/g, " ")}</p>
          </div>
        )}
        <div>
          <p className="text-slate-400 uppercase tracking-wide">Refund amount</p>
          <p className="font-semibold text-emerald-700 mt-0.5">
            {item.refundAmountRwf.toLocaleString()} RWF
            {item.appliedPctUsed != null && (
              <span className="text-slate-400 font-normal"> ({item.appliedPctUsed}%)</span>
            )}
          </p>
          {item.serviceFeeAmount != null && item.serviceFeeAmount > 0 && (
            <p className="text-slate-400 mt-0.5">Service fee {item.serviceFeeAmount.toLocaleString()} RWF retained</p>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {item.status === "REJECTED" && item.rejectionReason && (
        <div className="border-l-2 border-red-200 pl-3">
          <p className="text-xs text-slate-400 mb-0.5">Rejection reason</p>
          <p className="text-sm text-slate-600">{item.rejectionReason}</p>
        </div>
      )}

      {/* Action row */}
      {isPending && (
        <div className="flex gap-3 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onApprove}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Refund
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
