"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ScanLine, CheckCircle2, XCircle,
  Clock, Users, Loader2, RefreshCw, AlertCircle, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { conductorApi } from "@/lib/api";
import { ManifestEntry, VerifyTicketResponse } from "@/lib/types";

const BOOKING_STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  USED:      "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-50 text-red-500",
  PENDING:   "bg-amber-50 text-amber-700",
  EXPIRED:   "bg-slate-100 text-slate-400",
};

export default function ConductorScannerPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [manifestError, setManifestError] = useState(false);
  const [reference, setReference] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyTicketResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // initial = true → show error state + toast on failure
  // initial = false → silent background refresh after a verify
  const loadManifest = useCallback((initial = false) => {
    if (initial) {
      setLoadingManifest(true);
      setManifestError(false);
    }
    conductorApi.manifest(tripId)
      .then((r) => {
        setManifest(r.data.data ?? []);
        setManifestError(false);
      })
      .catch(() => {
        if (initial) {
          setManifestError(true);
          toast.error("Could not load manifest. Tap Retry.");
        }
        // silent failure on background refresh — manifest just stays stale
      })
      .finally(() => {
        if (initial) setLoadingManifest(false);
      });
  }, [tripId]);

  useEffect(() => {
    loadManifest(true);
    // Small delay so the page is mounted before focusing
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [loadManifest]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setScanning(true);
    setResult(null);
    try {
      const res = await conductorApi.verify(reference.trim().toUpperCase());
      const data: VerifyTicketResponse = res.data.data;
      setResult(data);
      if (data.valid) {
        toast.success("Ticket verified — passenger boarded!");
        loadManifest(false); // silent refresh
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setScanning(false);
      setReference("");
      inputRef.current?.focus();
    }
  };

  const boarded = manifest.filter((m) => m.status === "USED").length;
  const total = manifest.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/conductor/trips" className="no-print inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      {/* Trip summary */}
      <div className="print-manifest bg-emerald-700 text-white rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-200 mb-1 uppercase tracking-wide">Active Trip</p>
            <p className="font-bold text-lg">Scanning tickets</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-emerald-200 text-sm mb-1">
              <Users className="h-3.5 w-3.5" />
              <span>{boarded}/{total} boarded</span>
            </div>
            <div className="w-32 h-2 bg-emerald-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-300 rounded-full transition-all duration-500"
                style={{ width: total ? `${(boarded / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scanner input */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="h-4 w-4 text-emerald-600" />
          <h2 className="font-semibold text-slate-800">Scan / Enter Reference</h2>
        </div>

        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            ref={inputRef}
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="e.g. VY-4821"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={scanning || !reference.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 text-sm"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            {scanning ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* Scan result */}
        {result && (
          <div className={`mt-4 rounded-xl p-4 border ${result.valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-start gap-3">
              {result.valid
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              }
              <div className="flex-1">
                <p className={`font-semibold text-sm ${result.valid ? "text-emerald-800" : "text-red-700"}`}>
                  {result.valid ? "Valid Ticket" : "Invalid Ticket"}
                </p>
                <p className={`text-xs mt-0.5 ${result.valid ? "text-emerald-600" : "text-red-500"}`}>
                  {result.message}
                </p>
                {result.valid && result.passengerName && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 grid grid-cols-2 gap-1 text-xs text-emerald-700">
                    <span><strong>Ref:</strong> {result.bookingReference}</span>
                    <span><strong>Seats:</strong> {result.seatNumbers?.join(", ")}</span>
                    <span className="col-span-2"><strong>Passenger:</strong> {result.passengerName}</span>
                    <span className="col-span-2"><strong>Phone:</strong> {result.passengerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manifest */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          Passenger Manifest
        </h2>
        <span className="text-xs font-normal text-slate-400 ml-auto">{total} passengers</span>
        <button
          type="button"
          onClick={() => loadManifest(true)}
          className="no-print p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
          title="Refresh manifest"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        {manifest.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
            title="Print manifest"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loadingManifest ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-1.5" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : manifestError ? (
        <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600 mb-3">Could not load manifest</p>
          <button
            type="button"
            onClick={() => loadManifest(true)}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : manifest.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          No confirmed bookings yet
        </div>
      ) : (
        <div className="space-y-2">
          {manifest.map((entry) => (
            <div
              key={entry.bookingId}
              className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${entry.status === "USED" ? "border-slate-100 opacity-60" : "border-slate-200"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${entry.status === "USED" ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-700"}`}>
                {entry.passengerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{entry.passengerName}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono">{entry.bookingReference}</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    Seats: {entry.seatNumbers.join(", ")}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${BOOKING_STATUS_STYLES[entry.status] ?? "bg-slate-100 text-slate-500"}`}>
                {entry.status === "USED" ? "Boarded" : entry.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
