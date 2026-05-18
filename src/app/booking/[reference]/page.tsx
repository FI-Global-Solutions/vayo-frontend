"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  CheckCircle, Clock, Bus, Printer, Share2, ArrowRight,
  AlertCircle, Loader2,
} from "lucide-react";
import { bookingApi, refundApi } from "@/lib/api";
import { TicketResponse, RefundSummary, RefundPolicyResponse } from "@/lib/types";
import { clearStopSelection } from "@/lib/utils";
import { QRCodeCanvas } from "qrcode.react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RefundStatusBadge from "@/components/refund/RefundStatusBadge";

// ─── Refund status banner ─────────────────────────────────────────────────────

function RefundBanner({ refund }: { refund: RefundSummary }) {
  if (refund.status === "AWAITING_APPROVAL") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Refund request pending operator review</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {refund.refundAmountRwf.toLocaleString()} RWF — you will receive an SMS when a decision is made.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (refund.status === "APPROVED" || refund.status === "PENDING" || refund.status === "PROCESSING") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Refund of {refund.refundAmountRwf.toLocaleString()} RWF approved — processing payment
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Allow 24-72 hours for MoMo, 7-14 days for card.</p>
          </div>
        </div>
      </div>
    );
  }

  if (refund.status === "COMPLETED") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Refund of {refund.refundAmountRwf.toLocaleString()} RWF processed
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Allow 24-72 hours for MoMo, 7-14 days for card.</p>
          </div>
        </div>
      </div>
    );
  }

  if (refund.status === "REJECTED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Refund request was not approved</p>
            {refund.rejectionReason && (
              <p className="text-xs text-red-600 mt-0.5">{refund.rejectionReason}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Contact{" "}
              <a href="mailto:support@vayo.rw" className="underline hover:text-emerald-600">
                support@vayo.rw
              </a>{" "}
              if you believe this decision is incorrect.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (refund.status === "FAILED") {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Refund processing failed</p>
            <p className="text-xs text-orange-600 mt-0.5">
              Our team has been notified and will contact you within 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Ticket page ──────────────────────────────────────────────────────────────

export default function TicketPage() {
  const { reference } = useParams<{ reference: string }>();
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cancel flow
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [refundAfterCancel, setRefundAfterCancel] = useState<RefundSummary | null>(null);

  // Estimated refund for dialog
  const [policyLoading, setPolicyLoading] = useState(false);
  const [estimatedRefund, setEstimatedRefund] = useState<number | null>(null);

  useEffect(() => {
    bookingApi.ticket(reference)
      .then((r) => {
        const t = r.data.data;
        setTicket(t);
        if (t?.tripId) clearStopSelection(t.tripId);
      })
      .catch(() => setError("Ticket not found or you don't have permission to view it."))
      .finally(() => setLoading(false));
  }, [reference]);

  const openCancelDialog = async () => {
    if (!ticket) return;
    setPolicyLoading(true);
    try {
      const r = await refundApi.getTripRefundPolicy(ticket.tripId);
      const policy: RefundPolicyResponse = r.data.data;
      const hoursUntil = (new Date(ticket.departureTime).getTime() - Date.now()) / 3_600_000;
      const tier = [...policy.tiers].sort((a, b) => (b.hoursThreshold ?? 0) - (a.hoursThreshold ?? 0))
        .find((t) => hoursUntil >= (t.hoursThreshold ?? 0));
      if (tier) setEstimatedRefund(Math.round((ticket.totalAmount * tier.refundPct) / 100));
    } catch {
      setEstimatedRefund(null);
    } finally {
      setPolicyLoading(false);
      setShowCancelDialog(true);
    }
  };

  const handleCancel = async () => {
    if (!ticket) return;
    setCancelling(true);
    try {
      const r = await bookingApi.cancel(reference);
      const resp = r.data.data;
      const refundAmt = resp?.refundAmountRwf ?? estimatedRefund;
      setCancelMessage(
        refundAmt
          ? `Booking cancelled. Your refund request of ${Number(refundAmt).toLocaleString()} RWF has been submitted to ${ticket.operatorName} for review. You will receive an SMS when a decision is made.`
          : "Booking cancelled. A refund request has been submitted to the operator for review."
      );
      if (refundAmt) {
        setRefundAfterCancel({
          refundId: "",
          status: "AWAITING_APPROVAL",
          refundAmountRwf: Number(refundAmt),
          requestedAt: new Date().toISOString(),
        });
      }
      setTicket((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
      setShowCancelDialog(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setCancelMessage("");
      // Re-show error inline — keep dialog open so user can retry or dismiss
      setError(err?.response?.data?.message ?? "Could not cancel booking. Please try again.");
      setShowCancelDialog(false);
    } finally {
      setCancelling(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mx-auto" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (!ticket) return null;

  const isConfirmed = ticket.status === "CONFIRMED" || ticket.status === "USED";
  const isCancelled = ticket.status === "CANCELLED";
  const canCancel = ticket.status === "CONFIRMED";
  const activeRefund = refundAfterCancel ?? ticket.refund ?? null;

  const cancelDialogMessage = estimatedRefund
    ? `Cancel your booking? Your seat will be released. A refund request of approximately ${estimatedRefund.toLocaleString()} RWF will be submitted to the operator for review.`
    : "Cancel your booking? Your seat will be released. A refund request will be submitted to the operator for review.";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8">

      {/* Success banner */}
      {isConfirmed && (
        <div className="no-print flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Booking confirmed!</p>
            <p className="text-xs text-emerald-600">Your ticket has been sent by SMS and email.</p>
          </div>
        </div>
      )}

      {/* Cancel success message */}
      {cancelMessage && (
        <div className="no-print flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{cancelMessage}</p>
        </div>
      )}

      {/* API error (non-fatal) */}
      {error && ticket && (
        <div className="no-print bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Refund status banner */}
      {activeRefund && <div className="no-print"><RefundBanner refund={activeRefund} /></div>}

      {/* Ticket card */}
      <div className="print-ticket bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">

        {/* Header strip */}
        <div className="bg-emerald-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200 uppercase tracking-wide font-medium">VAYO Ticket</p>
              <p className="text-lg font-bold mt-0.5">{ticket.bookingReference}</p>
            </div>
            <Bus className="h-8 w-8 text-emerald-300" />
          </div>
        </div>

        {/* Route section */}
        <div className="px-6 py-5 border-b border-dashed border-slate-200">
          <div className="flex items-center gap-3">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">
                {format(new Date(ticket.departureTime), "HH:mm")}
              </p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{ticket.origin}</p>
              <p className="text-xs text-slate-400">{format(new Date(ticket.departureTime), "dd MMM yyyy")}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                Direct
              </div>
              <div className="w-16 flex items-center">
                <div className="h-px flex-1 bg-slate-300" />
                <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
              </div>
            </div>

            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">
                {format(new Date(ticket.arrivalTime), "HH:mm")}
              </p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{ticket.destination}</p>
              <p className="text-xs text-slate-400">{format(new Date(ticket.arrivalTime), "dd MMM yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Passenger details */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-dashed border-slate-200 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Passenger</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.passengerName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Phone</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.passengerPhone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Seat(s)</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.seatNumbers.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Operator</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.operatorName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Amount Paid</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.totalAmount.toLocaleString()} RWF</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Bus Type</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.busType}</p>
          </div>
          {isCancelled && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
              <p className="font-semibold text-red-600 mt-0.5">Cancelled</p>
            </div>
          )}
        </div>

        {/* QR Code — only for confirmed/used tickets */}
        {!isCancelled && (
          <div className="px-6 py-6 flex flex-col items-center">
            <p className="text-xs text-slate-500 mb-4 text-center">
              Show this QR code or your booking reference to the conductor
            </p>
            <div className="bg-white p-3 border border-slate-200 rounded-xl">
              <QRCodeCanvas
                value={ticket.qrCodeBase64 || ticket.bookingReference}
                size={160}
                level="M"
              />
            </div>
            <p className="text-xs font-mono font-bold text-slate-600 mt-3 tracking-widest">
              {ticket.bookingReference}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 text-center text-xs text-slate-400">
          Booked on {format(new Date(ticket.createdAt), "dd MMM yyyy, HH:mm")}
        </div>
      </div>

      {/* Actions */}
      <div className="no-print mt-4 space-y-3">
        {/* Refund status pill on cancelled tickets */}
        {isCancelled && activeRefund && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <span>Refund status:</span>
            <RefundStatusBadge status={activeRefund.status} />
          </div>
        )}

        {/* Cancel button */}
        {canCancel && !cancelMessage && (
          <button
            type="button"
            onClick={openCancelDialog}
            disabled={policyLoading}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl text-sm disabled:opacity-50"
          >
            {policyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancel Booking
          </button>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm"
          >
            <Printer className="h-4 w-4" />
            Print Ticket
          </button>
          <button
            type="button"
            onClick={() => navigator.share?.({ title: "VAYO Ticket", text: `My booking: ${ticket.bookingReference}` })}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 text-sm"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Booking"
        message={cancelDialogMessage}
        confirmLabel="Cancel Booking"
        confirmVariant="warning"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
        isLoading={cancelling}
      />
    </div>
  );
}
