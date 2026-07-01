"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight, Phone, Mail, User, XCircle, Loader2,
  CreditCard, AlertCircle, CheckCircle, LogIn, UserPlus, UserCheck,
  MapPin, Ticket, MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { bookingApi, paymentApi, refundApi } from "@/lib/api";
import { getStoredUser } from "@/store/auth";
import { TermsModal } from "@/components/terms/TermsModal";
import { RefundPolicyCard } from "@/components/refund/RefundPolicyCard";
import { RefundPolicyResponse } from "@/lib/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FlutterwaveCheckout: (config: any) => { close: () => void };
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const passengerDetailSchema = z.object({
  seatNumber: z.string(),
  passengerName: z.string().min(2, "Name required"),
  passengerPhone: z.string().optional().or(z.literal("")),
  isPrimary: z.boolean(),
});

const schema = z.object({
  primarySeatIdx: z.number(),
  passengers: z.array(passengerDetailSchema),
  contactEmail: z.string().email("Valid email required").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  data.passengers.forEach((p, i) => {
    if (p.passengerName.length < 2) {
      ctx.addIssue({ code: "custom", path: ["passengers", i, "passengerName"], message: "Name required" });
    }
    if (p.isPrimary && (!p.passengerPhone || p.passengerPhone.length < 9)) {
      ctx.addIssue({ code: "custom", path: ["passengers", i, "passengerPhone"], message: "Phone required for primary passenger" });
    }
  });
});

type FormData = z.infer<typeof schema>;
type AuthChoice = "auth" | "guest" | "login" | "register";

// ─── Single-seat simplified schema (unchanged from before) ────────────────────

const singleSchema = z.object({
  passengerName: z.string().min(3, "Full name required"),
  passengerPhone: z.string().min(9, "Valid phone number required"),
  passengerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
});
type SingleFormData = z.infer<typeof singleSchema>;

// ─── Multi-passenger card component ──────────────────────────────────────────

function PassengerCard({
  index,
  seat,
  seatLabel,
  isPrimary,
  onSetPrimary,
  register,
  errors,
}: {
  index: number;
  seat: string;
  seatLabel: string;
  isPrimary: boolean;
  onSetPrimary: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
}) {
  const passengerErrors = errors?.passengers?.[index];
  return (
    <div className={`border rounded-xl p-4 ${isPrimary ? "border-emerald-400 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">
          Seat <span className="font-mono text-emerald-700">{seat}</span> — {seatLabel}
        </p>
        {index === 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={onSetPrimary}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-600">This is me</span>
          </label>
        )}
        {index > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={onSetPrimary}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-600">Primary contact</span>
          </label>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
            Full name <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register(`passengers.${index}.passengerName`)}
              placeholder="Full name"
              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {passengerErrors?.passengerName && (
            <p className="text-red-500 text-xs mt-1">{passengerErrors.passengerName.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
            Phone number{isPrimary ? <span className="text-red-500 ml-0.5">*</span> : <span className="text-slate-400 font-normal ml-1">(optional)</span>}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register(`passengers.${index}.passengerPhone`)}
              placeholder="+250788000000"
              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {passengerErrors?.passengerPhone && (
            <p className="text-red-500 text-xs mt-1">{passengerErrors.passengerPhone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main checkout inner component ───────────────────────────────────────────

function CheckoutPage() {
  const params = useSearchParams();
  const tripId = params.get("tripId") ?? "";
  const seats = (params.get("seats") ?? "").split(",").filter(Boolean);
  const amount = Number(params.get("amount") ?? 0);
  const originStopId = params.get("originStopId") ?? "";
  const destinationStopId = params.get("destinationStopId") ?? "";
  const originStopName = params.get("originStopName") ?? "";
  const destinationStopName = params.get("destinationStopName") ?? "";
  const router = useRouter();

  const user = getStoredUser();
  const isLoggedIn = !!user;
  const isMultiSeat = seats.length > 1;

  const [authChoice, setAuthChoice] = useState<AuthChoice>(isLoggedIn ? "guest" : "auth");
  const [step, setStep] = useState<"details" | "paying" | "verifying" | "failed" | "confirmed">("details");
  const [bookingReference, setBookingReference] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState("");
  const [error, setError] = useState("");
  const flwModalRef = useRef<{ close: () => void } | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const pendingFormData = useRef<FormData | SingleFormData | null>(null);

  const [guestTermsChecked, setGuestTermsChecked] = useState(false);

  const [refundPolicy, setRefundPolicy] = useState<RefundPolicyResponse | null>(null);
  const [refundPolicyLoading, setRefundPolicyLoading] = useState(true);
  const [refundPolicyError, setRefundPolicyError] = useState(false);
  const [refundPolicyAcknowledged, setRefundPolicyAcknowledged] = useState(false);

  const SERVICE_FEE = 300;
  const total = amount + SERVICE_FEE;

  // ── Multi-seat form ──────────────────────────────────────────────────────────

  const multiForm = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      primarySeatIdx: 0,
      contactEmail: user?.email ?? "",
      passengers: seats.map((seat, i) => ({
        seatNumber: seat,
        passengerName: i === 0 && user ? `${user.firstName} ${user.lastName}` : "",
        passengerPhone: i === 0 && user ? (user.phone ?? "") : "",
        isPrimary: i === 0,
      })),
    },
  });

  const { fields } = useFieldArray({ control: multiForm.control, name: "passengers" });
  const primarySeatIdx = multiForm.watch("primarySeatIdx");

  const handleSetPrimary = (idx: number) => {
    const current = multiForm.getValues("primarySeatIdx");
    if (current === idx) return; // already primary
    // Unset old primary
    multiForm.setValue(`passengers.${current}.isPrimary`, false);
    // Set new primary
    multiForm.setValue(`passengers.${idx}.isPrimary`, true);
    multiForm.setValue("primarySeatIdx", idx);
    // Pre-fill from user if setting back to seat 0
    if (idx === 0 && user) {
      const name = multiForm.getValues(`passengers.0.passengerName`);
      if (!name) {
        multiForm.setValue(`passengers.0.passengerName`, `${user.firstName} ${user.lastName}`);
        multiForm.setValue(`passengers.0.passengerPhone`, user.phone ?? "");
      }
    }
  };

  // ── Single-seat form ─────────────────────────────────────────────────────────

  const singleForm = useForm<SingleFormData>({
    mode: "onChange",
    resolver: zodResolver(singleSchema),
    defaultValues: {
      passengerName: user ? `${user.firstName} ${user.lastName}` : "",
      passengerPhone: user?.phone ?? "",
      passengerEmail: user?.email ?? "",
    },
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    return () => { flwModalRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (!tripId) return;
    setRefundPolicyLoading(true);
    setRefundPolicyError(false);
    refundApi.getTripRefundPolicy(tripId)
      .then((res) => setRefundPolicy(res.data.data ?? res.data))
      .catch(() => setRefundPolicyError(true))
      .finally(() => setRefundPolicyLoading(false));
  }, [tripId]);

  // ── Booking initiation ────────────────────────────────────────────────────

  const initiateBookingMulti = async (data: FormData) => {
    setError("");
    try {
      const primaryPassenger = data.passengers[data.primarySeatIdx];
      const additionalPassengers = data.passengers
        .filter((_, i) => i !== data.primarySeatIdx)
        .map((p) => ({
          seatNumber: p.seatNumber,
          passengerName: p.passengerName,
          passengerPhone: p.passengerPhone || undefined,
        }));

      const payload = {
        tripId,
        seatNumbers: seats,
        passengerName: primaryPassenger.passengerName,
        passengerPhone: primaryPassenger.passengerPhone,
        passengerEmail: data.contactEmail || undefined,
        additionalPassengers: additionalPassengers.length > 0 ? additionalPassengers : undefined,
        ...(originStopId ? { originStopId } : {}),
        ...(destinationStopId ? { destinationStopId } : {}),
      };

      const res = isLoggedIn
        ? await bookingApi.initiate(payload)
        : await bookingApi.initiateGuest(payload);

      const id = res.data.data.bookingId;
      setConfirmedPhone(primaryPassenger.passengerPhone ?? "");
      openFlutterwave(id, primaryPassenger.passengerName, primaryPassenger.passengerPhone ?? "", data.contactEmail ?? "");
    } catch (e: unknown) {
      const axiosErr = e as { response?: { status?: number; data?: { error?: string; message?: string } } };
      if (axiosErr?.response?.status === 403 && axiosErr?.response?.data?.error === "TERMS_NOT_ACCEPTED") {
        setTermsAccepted(false);
        pendingFormData.current = data;
        setShowTermsModal(true);
        return;
      }
      setError(axiosErr?.response?.data?.message ?? "Failed to initiate booking. Please try again.");
    }
  };

  const initiateBookingSingle = async (data: SingleFormData) => {
    setError("");
    try {
      const payload = {
        tripId,
        seatNumbers: seats,
        passengerName: data.passengerName,
        passengerPhone: data.passengerPhone,
        passengerEmail: data.passengerEmail || undefined,
        ...(originStopId ? { originStopId } : {}),
        ...(destinationStopId ? { destinationStopId } : {}),
      };

      const res = isLoggedIn
        ? await bookingApi.initiate(payload)
        : await bookingApi.initiateGuest(payload);

      const id = res.data.data.bookingId;
      setConfirmedPhone(data.passengerPhone);
      openFlutterwave(id, data.passengerName, data.passengerPhone, data.passengerEmail ?? "");
    } catch (e: unknown) {
      const axiosErr = e as { response?: { status?: number; data?: { error?: string; message?: string } } };
      if (axiosErr?.response?.status === 403 && axiosErr?.response?.data?.error === "TERMS_NOT_ACCEPTED") {
        setTermsAccepted(false);
        pendingFormData.current = data;
        setShowTermsModal(true);
        return;
      }
      setError(axiosErr?.response?.data?.message ?? "Failed to initiate booking. Please try again.");
    }
  };

  const onMultiSubmit = async (data: FormData) => {
    if (isLoggedIn && !termsAccepted) {
      pendingFormData.current = data;
      setShowTermsModal(true);
      return;
    }
    await initiateBookingMulti(data);
  };

  const onSingleSubmit = async (data: SingleFormData) => {
    if (isLoggedIn && !termsAccepted) {
      pendingFormData.current = data;
      setShowTermsModal(true);
      return;
    }
    await initiateBookingSingle(data);
  };

  const onTermsAccepted = async () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    if (pendingFormData.current) {
      if (isMultiSeat) {
        await initiateBookingMulti(pendingFormData.current as FormData);
      } else {
        await initiateBookingSingle(pendingFormData.current as SingleFormData);
      }
      pendingFormData.current = null;
    }
  };

  const onTermsDismissed = () => {
    setShowTermsModal(false);
    pendingFormData.current = null;
    setError("You must accept the Terms & Conditions to complete your booking.");
  };

  // ── Flutterwave ───────────────────────────────────────────────────────────

  const openFlutterwave = (bId: string, name: string, phone: string, email: string) => {
    setStep("paying");
    const txRef = `VAYO-${bId}-${Date.now()}`;

    flwModalRef.current = window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: total,
      currency: "RWF",
      payment_options: "card, mobilemoneyrwanda",
      customer: {
        email: email || `${phone}@vayo.rw`,
        phone_number: phone,
        name,
      },
      customizations: {
        title: "VAYO Bus Booking",
        description: `Seats ${seats.join(", ")} — ${seats.length} passenger${seats.length > 1 ? "s" : ""}`,
        logo: `${window.location.origin}/assets/vayo-trans.png`,
      },
      callback: async (response: { transaction_id: string; status: string }) => {
        flwModalRef.current?.close();
        if (response.status === "successful") {
          setStep("verifying");
          await verifyPayment(bId, String(response.transaction_id));
        } else {
          setStep("failed");
        }
      },
      onclose: () => {
        if (step === "paying") setStep("details");
      },
    });
  };

  const verifyPayment = async (bId: string, flwTransactionId: string) => {
    setError("");
    try {
      const res = await paymentApi.verify(bId, flwTransactionId);
      const ref = res.data.data?.bookingReference;
      setBookingReference(ref);
      refundApi.acknowledgeRefundPolicy(ref).catch((e) =>
        console.warn("Refund policy acknowledgement failed:", e)
      );
      if (isLoggedIn) {
        router.push(`/booking/${ref}`);
      } else {
        setStep("confirmed");
      }
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "Payment verification failed. Please contact support.");
      setStep("failed");
    }
  };

  // ── Shared UI helpers ─────────────────────────────────────────────────────

  const isGuest = !isLoggedIn;

  const Breadcrumb = () => (
    <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6">
      <span>Search</span>
      <ChevronRight className="h-3 w-3" />
      <span>Select Seats</span>
      <ChevronRight className="h-3 w-3" />
      {isGuest && (
        <>
          <button type="button" onClick={() => setAuthChoice("auth")} className="hover:text-emerald-600">Guest</button>
          <ChevronRight className="h-3 w-3" />
        </>
      )}
      <span className="text-slate-700 font-medium">Checkout</span>
    </nav>
  );

  const OrderSummary = () => (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-emerald-800 mb-2">Order Summary</h3>
      <div className="text-sm text-emerald-700 space-y-1">
        <div className="flex justify-between">
          <span>Seats: {seats.join(", ")}</span>
          <span>{amount.toLocaleString()} RWF</span>
        </div>
        <div className="flex justify-between text-emerald-600">
          <span>Service fee</span>
          <span>{SERVICE_FEE.toLocaleString()} RWF</span>
        </div>
        <div className="flex justify-between font-bold text-emerald-900 border-t border-emerald-200 pt-2 mt-2">
          <span>Total</span>
          <span>{total.toLocaleString()} RWF</span>
        </div>
      </div>
    </div>
  );

  // ── Auth-choice screen ────────────────────────────────────────────────────

  if (authChoice === "auth") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6">
          <span>Search</span><ChevronRight className="h-3 w-3" />
          <span>Select Seats</span><ChevronRight className="h-3 w-3" />
          <span className="text-slate-700 font-medium">Checkout</span>
        </nav>
        <OrderSummary />
        <h2 className="font-bold text-slate-800 text-lg mb-2">How would you like to book?</h2>
        <p className="text-sm text-slate-500 mb-5">Choose how to proceed with your booking.</p>
        <div className="space-y-3">
          <button type="button" onClick={() => setAuthChoice("guest")}
            className="w-full flex items-center gap-4 bg-white border-2 border-emerald-500 rounded-xl p-4 text-left hover:bg-emerald-50 transition-colors">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Continue as Guest</p>
              <p className="text-xs text-slate-500 mt-0.5">No account needed</p>
            </div>
          </button>
          <Link href={`/login?next=${encodeURIComponent(`/checkout?${params.toString()}`)}`}
            className="w-full flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 text-left hover:bg-slate-50 transition-colors block">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <LogIn className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Log In</p>
              <p className="text-xs text-slate-500 mt-0.5">Access saved bookings</p>
            </div>
          </Link>
          <Link href={`/register?next=${encodeURIComponent(`/checkout?${params.toString()}`)}`}
            className="w-full flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 text-left hover:bg-slate-50 transition-colors block">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Create Account</p>
              <p className="text-xs text-slate-500 mt-0.5">Save your details</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // ── Guest confirmation screen ──────────────────────────────────────────────

  if (step === "confirmed" && bookingReference) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">

        {/* Success hero */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-5 shadow-lg shadow-emerald-200">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-2">You&apos;re all set! 🎉</h1>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Your seat is confirmed and your ticket is on its way.
          </p>
        </div>

        {/* Ticket summary card */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4">
          {/* Top stripe */}
          <div className="bg-emerald-600 px-5 py-3 flex items-center justify-between">
            <span className="text-white text-xs font-semibold uppercase tracking-wider">Booking Reference</span>
            <span className="font-mono font-bold text-white text-sm">{bookingReference}</span>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Route */}
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span className="font-semibold text-sm">
                {originStopName || "—"} → {destinationStopName || "—"}
              </span>
            </div>

            {/* Seats */}
            <div className="flex items-center gap-2 text-slate-600">
              <Ticket className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm">
                Seat{seats.length > 1 ? "s" : ""}{" "}
                <span className="font-semibold">{seats.join(", ")}</span>
              </span>
            </div>

            {/* Amount */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Total paid</span>
              <span className="text-base font-bold text-slate-800">{total.toLocaleString()} RWF</span>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-slate-200 mx-5" />

          {/* Delivery notice */}
          <div className="px-5 py-3">
            {confirmedPhone ? (
              <p className="text-xs text-slate-500 text-center">
                QR ticket sent to <span className="font-semibold text-slate-700">{confirmedPhone}</span> via SMS &amp; email
              </p>
            ) : (
              <p className="text-xs text-slate-500 text-center">QR ticket sent via SMS &amp; email</p>
            )}
          </div>
        </div>

        {/* View ticket CTA */}
        <Link
          href={`/booking/lookup?reference=${encodeURIComponent(bookingReference)}`}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors mb-3"
        >
          <Ticket className="h-4 w-4" /> View My Ticket
        </Link>

        {/* Create account nudge — only for guests */}
        {!isLoggedIn && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
            <p className="text-sm font-semibold text-slate-700 mb-1">Save your booking history</p>
            <p className="text-xs text-slate-500 mb-3">
              Create a free account and all your bookings will be linked automatically.
            </p>
            <Link
              href={`/register${confirmedPhone ? `?phone=${encodeURIComponent(confirmedPhone)}` : ""}`}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:border-emerald-400 hover:text-emerald-600 text-slate-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Create a VAYO account
            </Link>
          </div>
        )}

        {/* Help */}
        <div className="text-center">
          <a
            href="https://wa.me/250784673536?text=Hello+VAYO+Support%2C%0A%0AI+need+assistance+with+my+booking.+Could+you+please+help+me%3F%0A%0AThank+you."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Need help? Chat with us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // ── Shared: refund policy + T&Cs + submit button sections ────────────────

  const RefundSection = ({ acknowledged, onAcknowledge }: { acknowledged: boolean; onAcknowledge: () => void }) => (
    <div className="pt-2">
      {refundPolicyLoading && (
        <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 flex-shrink-0" />
          Loading refund policy...
        </div>
      )}
      {refundPolicyError && !refundPolicyLoading && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">Unable to load refund policy. Please refresh the page before continuing.</p>
        </div>
      )}
      {refundPolicy && !refundPolicyLoading && (
        <RefundPolicyCard policy={refundPolicy} acknowledged={acknowledged} onAcknowledged={onAcknowledge} />
      )}
    </div>
  );

  const GuestTerms = () => (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input type="checkbox" checked={guestTermsChecked} onChange={(e) => setGuestTermsChecked(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0" />
      <span className="text-sm text-slate-600">
        I have read and agree to VAYO&apos;s{" "}
        <a href="/terms/passenger/current" target="_blank" rel="noopener noreferrer"
          className="text-emerald-600 underline hover:text-emerald-700">Terms &amp; Conditions</a>
      </span>
    </label>
  );

  // ── Multi-seat checkout form ───────────────────────────────────────────────

  if (isMultiSeat && (step === "details" || step === "paying")) {
    const { formState: { errors: mErrors, isSubmitting: mSubmitting, isValid: mValid } } = multiForm;
    const primaryPhone = multiForm.watch(`passengers.${primarySeatIdx}.passengerPhone`);
    const canSubmitMulti = mValid && refundPolicyAcknowledged && !refundPolicyLoading && !refundPolicyError && (!isGuest || guestTermsChecked);

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <Breadcrumb />

        {(originStopName || destinationStopName) && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-slate-600">
            <span className="font-medium">{originStopName || "Origin"}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-medium">{destinationStopName || "Destination"}</span>
          </div>
        )}

        <OrderSummary />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        <form onSubmit={multiForm.handleSubmit(onMultiSubmit)} className="space-y-4">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Passenger Details</h2>
            <p className="text-sm text-slate-500 mt-0.5">Please provide details for each passenger</p>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <PassengerCard
                key={field.id}
                index={index}
                seat={seats[index]}
                seatLabel={`Passenger ${index + 1}`}
                isPrimary={index === primarySeatIdx}
                onSetPrimary={() => handleSetPrimary(index)}
                register={multiForm.register}
                errors={mErrors}
              />
            ))}
          </div>

          {/* Booking contact section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700 mb-3">Booking Contact</p>
            <div>
              <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                Email <span className="text-slate-400 font-normal ml-1">(for ticket delivery)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input {...multiForm.register("contactEmail")} type="email" placeholder="you@email.com"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
              </div>
              {mErrors.contactEmail && <p className="text-red-500 text-xs mt-1">{mErrors.contactEmail.message}</p>}
            </div>
            {primaryPhone && (
              <p className="text-xs text-slate-400 mt-2">
                Confirmation and updates will be sent to the phone number you provided for Seat{" "}
                <span className="font-mono font-semibold">{seats[primarySeatIdx]}</span>
              </p>
            )}
          </div>

          <RefundSection acknowledged={refundPolicyAcknowledged} onAcknowledge={() => setRefundPolicyAcknowledged(true)} />
          {isGuest && <GuestTerms />}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              Pay securely with <span className="font-medium text-slate-700">Card</span> or{" "}
              <span className="font-medium text-slate-700">Mobile Money (MTN/Airtel)</span> via Flutterwave
            </p>
          </div>

          <button type="submit" disabled={mSubmitting || !canSubmitMulti}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2">
            {mSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Pay ${total.toLocaleString()} RWF →`}
          </button>
        </form>

        <TermsModal isOpen={showTermsModal} termsType="PASSENGER" onAccepted={onTermsAccepted} onDismissed={onTermsDismissed} />
      </div>
    );
  }

  // ── Single-seat checkout form ─────────────────────────────────────────────

  const { formState: { errors, isSubmitting, isValid } } = singleForm;
  const canSubmit = isValid && refundPolicyAcknowledged && !refundPolicyLoading && !refundPolicyError && (!isGuest || guestTermsChecked);

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb />

      {(originStopName || destinationStopName) && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-slate-600">
          <span className="font-medium">{originStopName || "Origin"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-medium">{destinationStopName || "Destination"}</span>
        </div>
      )}

      {!originStopId && !destinationStopId && tripId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Stop selection required</p>
            <p className="text-xs text-amber-700 mt-0.5">Please go back and select your boarding and dropping stops.</p>
            <button type="button" onClick={() => router.back()}
              className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 underline">Go back</button>
          </div>
        </div>
      )}

      <OrderSummary />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
      )}

      {(step === "details" || step === "paying") && (
        <form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-4">
          <h2 className="font-bold text-slate-800">Your Details</h2>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Full Name <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...singleForm.register("passengerName")} placeholder="John Doe"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.passengerName && <p className="text-red-500 text-xs mt-1">{errors.passengerName.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Phone Number <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...singleForm.register("passengerPhone")} placeholder="+250788000000"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.passengerPhone && <p className="text-red-500 text-xs mt-1">{errors.passengerPhone.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Email <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...singleForm.register("passengerEmail")} type="email" placeholder="you@email.com"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {isGuest && <p className="text-xs text-slate-400 mt-1">For ticket delivery</p>}
          </div>

          <RefundSection acknowledged={refundPolicyAcknowledged} onAcknowledge={() => setRefundPolicyAcknowledged(true)} />
          {isGuest && <GuestTerms />}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              Pay securely with <span className="font-medium text-slate-700">Card</span> or{" "}
              <span className="font-medium text-slate-700">Mobile Money (MTN/Airtel)</span> via Flutterwave
            </p>
          </div>

          <button type="submit" disabled={isSubmitting || !canSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Pay ${total.toLocaleString()} RWF →`}
          </button>
        </form>
      )}

      {step === "verifying" && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg mb-2">Confirming your booking...</h2>
          <p className="text-sm text-slate-500">Please wait while we verify your payment.</p>
          {bookingReference && <p className="text-xs font-mono text-slate-400 mt-4">{bookingReference}</p>}
        </div>
      )}

      {step === "failed" && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg mb-2">Payment not completed</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error || "The payment was not completed or could not be verified. Your seat reservation may have expired."}
          </p>
          <button type="button" onClick={() => router.back()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm">
            Try Again
          </button>
        </div>
      )}

      <TermsModal isOpen={showTermsModal} termsType="PASSENGER" onAccepted={onTermsAccepted} onDismissed={onTermsDismissed} />
    </div>
  );
}

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-400">Loading...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
