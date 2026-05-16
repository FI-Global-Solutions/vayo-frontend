"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, Phone, Mail, User, XCircle, Loader2, CreditCard } from "lucide-react";
import { bookingApi, paymentApi } from "@/lib/api";
import { getStoredUser } from "@/store/auth";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FlutterwaveCheckout: (config: any) => { close: () => void };
  }
}

const schema = z.object({
  passengerName: z.string().min(3, "Full name required"),
  passengerPhone: z.string().min(9, "Valid phone number required"),
  passengerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function CheckoutPage() {
  const params = useSearchParams();
  const tripId = params.get("tripId") ?? "";
  const seats = (params.get("seats") ?? "").split(",").filter(Boolean);
  const amount = Number(params.get("amount") ?? 0);
  const router = useRouter();

  const [step, setStep] = useState<"details" | "paying" | "verifying" | "failed">("details");
  const [bookingId, setBookingId] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [error, setError] = useState("");
  const flwModalRef = useRef<{ close: () => void } | null>(null);

  const user = getStoredUser();
  const SERVICE_FEE = 300;
  const total = amount + SERVICE_FEE;

  const { register, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<FormData>({ mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      passengerName: user ? `${user.firstName} ${user.lastName}` : "",
      passengerPhone: user?.phone ?? "",
      passengerEmail: user?.email ?? "",
    },
  });

  // Load Flutterwave inline script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Close modal on unmount
  useEffect(() => {
    return () => { flwModalRef.current?.close(); };
  }, []);

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
      const id = res.data.data.bookingId;
      setBookingId(id);
      openFlutterwave(id, data);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "Failed to initiate booking. Please try again.");
    }
  };

  const openFlutterwave = (bId: string, data: FormData) => {
    setStep("paying");
    const txRef = `VAYO-${bId}-${Date.now()}`;

    flwModalRef.current = window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: total,
      currency: "RWF",
      payment_options: "card, mobilemoneyrwanda",
      customer: {
        email: data.passengerEmail || `${data.passengerPhone}@vayo.rw`,
        phone_number: data.passengerPhone,
        name: data.passengerName,
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
        // User closed modal without paying
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
      router.push(`/booking/${ref}`);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "Payment verification failed. Please contact support.");
      setStep("failed");
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
            <span>{total.toLocaleString()} RWF</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Passenger details */}
      {(step === "details" || step === "paying") && (
        <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-4">
          <h2 className="font-bold text-slate-800">Passenger Details</h2>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Full Name
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("passengerName")} placeholder="John Doe"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.passengerName && <p className="text-red-500 text-xs mt-1">{errors.passengerName.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Phone Number
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("passengerPhone")} placeholder="+250788000000"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.passengerPhone && <p className="text-red-500 text-xs mt-1">{errors.passengerPhone.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Email
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("passengerEmail")} type="email" placeholder="you@email.com"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Payment method info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">Pay securely with <span className="font-medium text-slate-700">Card</span> or <span className="font-medium text-slate-700">Mobile Money (MTN/Airtel)</span> via Flutterwave</p>
          </div>

          <button type="submit" disabled={isSubmitting || !isValid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : `Pay ${total.toLocaleString()} RWF →`}
          </button>
        </form>
      )}

      {/* Verifying */}
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

      {/* Failed */}
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
