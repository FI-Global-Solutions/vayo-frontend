"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Search, Phone, Hash, Loader2, AlertCircle, CheckCircle,
  Clock, ArrowRight, Bus, QrCode, XCircle,
} from "lucide-react";
import { bookingApi, refundApi } from "@/lib/api";
import { TicketResponse, RefundPolicyResponse, RefundSummary } from "@/lib/types";
import { QRCodeCanvas } from "qrcode.react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RefundStatusBadge from "@/components/refund/RefundStatusBadge";

// ─── Refund banner (reused from ticket page) ──────────────────────────────────

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
            {refund.rejectionReason && <p className="text-xs text-red-600 mt-0.5">{refund.rejectionReason}</p>}
            <p className="text-xs text-slate-500 mt-1">
              Contact{" "}
              <a href="mailto:support@vayo.rw" className="underline hover:text-emerald-600">support@vayo.rw</a>
              {" "}if you believe this is incorrect.
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
            <p className="text-xs text-orange-600 mt-0.5">Our team has been notified and will contact you within 24 hours.</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Lookup form schema ───────────────────────────────────────────────────────

const lookupSchema = z.object({
  reference: z.string().min(1, "Booking reference is required"),
  phone: z.string().min(9, "Phone number is required"),
});
type LookupForm = z.infer<typeof lookupSchema>;

// ─── Main page ────────────────────────────────────────────────────────────────

function BookingLookupPage() {
  const searchParams = useSearchParams();
  const prefillRef = searchParams.get("reference") ?? "";

  // State 1: lookup form / State 2: ticket display
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  // phone kept in component state only — never in URL or localStorage (PII)
  const [lookedUpPhone, setLookedUpPhone] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  // Cancel flow
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [refundAfterCancel, setRefundAfterCancel] = useState<RefundSummary | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [estimatedRefund, setEstimatedRefund] = useState<number | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LookupForm>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { reference: prefillRef, phone: "" },
  });

  const onLookup = async (data: LookupForm) => {
    setLookupError("");
    setLookupLoading(true);
    try {
      const res = await bookingApi.lookup(data.reference.trim().toUpperCase(), data.phone.trim());
      setTicket(res.data.data);
      setLookedUpPhone(data.phone.trim());
    } catch (e: unknown) {
      const axiosErr = e as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        setLookupError("No booking found with these details. Please check your reference and phone number.");
      } else {
        setLookupError("Something went wrong. Please try again.");
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const openCancelDialog = async () => {
    if (!ticket) return;
    setPolicyLoading(true);
    try {
      const r = await refundApi.getTripRefundPolicy(ticket.tripId);
      const policy: RefundPolicyResponse = r.data.data;
      const hoursUntil = (new Date(ticket.departureTime).getTime() - Date.now()) / 3_600_000;
      const tier = [...policy.tiers]
        .sort((a, b) => (b.hoursThreshold ?? 0) - (a.hoursThreshold ?? 0))
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
    setCancelError("");
    try {
      const r = await bookingApi.guestCancel(ticket.bookingReference, lookedUpPhone);
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
      setCancelError(err?.response?.data?.message ?? "Could not cancel booking. Please try again.");
      setShowCancelDialog(false);
    } finally {
      setCancelling(false);
    }
  };

  const resetToLookup = () => {
    setTicket(null);
    setLookedUpPhone("");
    setLookupError("");
    setCancelMessage("");
    setCancelError("");
    setRefundAfterCancel(null);
    setEstimatedRefund(null);
  };

  // ── STATE 1: Lookup form ────────────────────────────────────────────────────

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Find Your Booking</h1>
          <p className="text-sm text-slate-500 mt-2">
            Enter your booking reference and the phone number you used when booking.
          </p>
        </div>

        <form onSubmit={handleSubmit(onLookup)} className="space-y-4">
          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Booking Reference <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register("reference")}
                placeholder="e.g. VAYO-ABC123"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                style={{ textTransform: "uppercase" }}
              />
            </div>
            {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Phone Number <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register("phone")}
                placeholder="The phone used when booking"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {lookupError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{lookupError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={lookupLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            {lookupLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</> : <><Search className="h-4 w-4" /> Find Booking</>}
          </button>
        </form>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Your reference was sent to your phone via SMS when you booked. It starts with <span className="font-mono font-semibold text-slate-700">VAYO-</span>
          </p>
        </div>
      </div>
    );
  }

  // ── STATE 2: Ticket display ─────────────────────────────────────────────────

  const isCancelled = ticket.status === "CANCELLED";
  const canCancel = ticket.status === "CONFIRMED";
  const activeRefund = refundAfterCancel ?? ticket.refund ?? null;

  const cancelDialogMessage = estimatedRefund
    ? `Cancel your booking? Your seat will be released. A refund request of approximately ${estimatedRefund.toLocaleString()} RWF will be submitted to the operator for review.`
    : "Cancel your booking? Your seat will be released. A refund request will be submitted to the operator for review.";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8">

      {/* Cancel success */}
      {cancelMessage && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{cancelMessage}</p>
        </div>
      )}

      {/* Cancel error */}
      {cancelError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">{cancelError}</p>
        </div>
      )}

      {/* Refund status banner */}
      {activeRefund && <RefundBanner refund={activeRefund} />}

      {/* Ticket card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">

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

        {/* Route */}
        <div className="px-6 py-5 border-b border-dashed border-slate-200">
          <div className="flex items-center gap-3">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">{format(new Date(ticket.departureTime), "HH:mm")}</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{ticket.origin}</p>
              <p className="text-xs text-slate-400">{format(new Date(ticket.departureTime), "dd MMM yyyy")}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" /> Direct
              </div>
              <div className="w-16 flex items-center">
                <div className="h-px flex-1 bg-slate-300" />
                <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
              </div>
            </div>
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">{format(new Date(ticket.arrivalTime), "HH:mm")}</p>
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
          {ticket.boardingStop && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Boarding</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ticket.boardingStop}</p>
            </div>
          )}
          {ticket.droppingStop && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Dropping</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ticket.droppingStop}</p>
            </div>
          )}
          {isCancelled && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
              <p className="font-semibold text-red-600 mt-0.5">Cancelled</p>
            </div>
          )}
        </div>

        {/* QR code — only for active tickets */}
        {!isCancelled && (
          <div className="px-6 py-6 flex flex-col items-center">
            <p className="text-xs text-slate-500 mb-4 text-center">
              Show this QR code or your booking reference to the conductor
            </p>
            <div className="bg-white p-3 border border-slate-200 rounded-xl">
              {ticket.qrCodeBase64 ? (
                <QRCodeCanvas value={ticket.qrCodeBase64} size={160} level="M" />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-300">
                  <QrCode className="h-16 w-16" />
                </div>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-600 mt-3 tracking-widest">
              {ticket.bookingReference}
            </p>
          </div>
        )}

        <div className="bg-slate-50 px-6 py-3 text-center text-xs text-slate-400">
          Booked on {format(new Date(ticket.createdAt), "dd MMM yyyy, HH:mm")}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-3">
        {/* Refund status on cancelled */}
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
            {policyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancel Booking
          </button>
        )}

        <button
          type="button"
          onClick={resetToLookup}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-xl text-sm"
        >
          <Search className="h-4 w-4" />
          Find Another Booking
        </button>
      </div>

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

export default function BookingLookupPageWrapper() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>}>
      <BookingLookupPage />
    </Suspense>
  );
}
