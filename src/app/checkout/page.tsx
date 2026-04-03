"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, Phone, Mail, User, Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { bookingApi, paymentApi } from "@/lib/api";
import { getStoredUser } from "@/store/auth";

const schema = z.object({
  passengerName: z.string().min(3, "Full name required"),
  passengerPhone: z.string().min(9, "Valid phone number required"),
  passengerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  momoPhone: z.string().min(9, "Enter your MoMo number"),
});

type FormData = z.infer<typeof schema>;

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

function CheckoutPage() {
  const params = useSearchParams();
  const tripId = params.get("tripId") ?? "";
  const seats = (params.get("seats") ?? "").split(",").filter(Boolean);
  const amount = Number(params.get("amount") ?? 0);
  const router = useRouter();

  const [step, setStep] = useState<"details" | "payment" | "waiting" | "failed">("details");
  const [bookingId, setBookingId] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user = getStoredUser();
  const SERVICE_FEE = 300;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      passengerName: user ? `${user.firstName} ${user.lastName}` : "",
      passengerPhone: user?.phone ?? "",
      passengerEmail: user?.email ?? "",
      momoPhone: user?.phone ?? "",
    },
  });

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startPolling = (ref: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await paymentApi.status(ref);
        const status = res.data.data?.status;
        if (status === "CONFIRMED") {
          clearInterval(pollRef.current!);
          clearTimeout(timeoutRef.current!);
          router.push(`/booking/${ref}`);
        } else if (status === "EXPIRED" || status === "FAILED") {
          clearInterval(pollRef.current!);
          clearTimeout(timeoutRef.current!);
          setStep("failed");
        }
      } catch {
        // silent — keep polling
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current!);
      setStep("failed");
    }, POLL_TIMEOUT_MS);
  };

  const onDetailsSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await bookingApi.initiate({
        tripId,
        seatNumbers: seats,
        passengerName: data.passengerName,
        passengerPhone: data.passengerPhone,
        passengerEmail: data.passengerEmail || undefined,
      });
      setBookingId(res.data.data.bookingId);
      setStep("payment");
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "Failed to initiate booking. Please try again.");
    }
  };

  const onPaymentSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await paymentApi.initiate(bookingId, data.momoPhone);
      const ref = res.data.data?.bookingReference;
      setBookingReference(ref);
      setStep("waiting");
      startPolling(ref);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "Payment failed. Please try again.");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6">
        <span>Search</span>
        <ChevronRight className="h-3 w-3" />
        <span>Select Seats</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700 font-medium">Checkout</span>
      </nav>

      {/* Order summary */}
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
            <span>{(amount + SERVICE_FEE).toLocaleString()} RWF</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Passenger details */}
      {step === "details" && (
        <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-4">
          <h2 className="font-bold text-slate-800">Passenger Details</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("passengerName")} placeholder="John Doe"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.passengerName && <p className="text-red-500 text-xs mt-1">{errors.passengerName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("passengerPhone")} placeholder="+250788000000"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.passengerPhone && <p className="text-red-500 text-xs mt-1">{errors.passengerPhone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Email <span className="text-slate-400 font-normal">(optional — for e-ticket)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("passengerEmail")} type="email" placeholder="you@email.com"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl mt-2">
            {isSubmitting ? "Saving..." : "Continue to Payment →"}
          </button>
        </form>
      )}

      {/* Step 2: MoMo payment */}
      {step === "payment" && (
        <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4">
          <h2 className="font-bold text-slate-800">Pay with Mobile Money</h2>
          <p className="text-sm text-slate-500">Enter your MTN MoMo or Airtel Money number. You will receive a USSD prompt on your phone to confirm the payment.</p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile Money Number *</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("momoPhone")} placeholder="+250788000000"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.momoPhone && <p className="text-red-500 text-xs mt-1">{errors.momoPhone.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep("details")}
              className="flex-1 border border-slate-200 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50">
              ← Back
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl">
              {isSubmitting ? "Sending..." : `Pay ${(amount + SERVICE_FEE).toLocaleString()} RWF`}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Waiting for USSD confirmation */}
      {step === "waiting" && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg mb-2">Check your phone</h2>
          <p className="text-sm text-slate-500 mb-1">A USSD prompt has been sent to your Mobile Money number.</p>
          <p className="text-sm text-slate-500">Enter your PIN to confirm the payment of <span className="font-semibold text-slate-700">{(amount + SERVICE_FEE).toLocaleString()} RWF</span>.</p>
          <p className="text-xs text-slate-400 mt-6">Waiting for confirmation<span className="animate-pulse">...</span></p>
          <p className="text-xs font-mono text-slate-400 mt-1">{bookingReference}</p>
        </div>
      )}

      {/* Step 4: Failed / timed out */}
      {step === "failed" && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg mb-2">Payment not confirmed</h2>
          <p className="text-sm text-slate-500 mb-6">The payment was not completed in time or was rejected. Your seat reservation has expired.</p>
          <button type="button" onClick={() => router.back()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm">
            Try Again
          </button>
        </div>
      )}
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
