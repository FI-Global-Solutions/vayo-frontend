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

export default function ConductorScannerPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [manifestError, setManifestError] = useState(false);
  const [reference, setReference] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyTicketResponse | null>(null);
  const [verifyingSeat, setVerifyingSeat] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      })
      .finally(() => {
        if (initial) setLoadingManifest(false);
      });
  }, [tripId]);

  useEffect(() => {
    loadManifest(true);
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [loadManifest]);

  // QR scan / reference entry — marks all seats (no seatNumber)
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
        toast.success("Ticket verified — passenger(s) boarded!");
        loadManifest(false);
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

  // Per-seat verify from manifest row
  const handleVerifySeat = async (bookingRef: string, seatNumber: string) => {
    const key = `${bookingRef}:${seatNumber}`;
    setVerifyingSeat(key);
    try {
      const res = await conductorApi.verify(bookingRef, seatNumber);
      const data: VerifyTicketResponse = res.data.data;
      if (data.valid) {
        toast.success(`Seat ${seatNumber} boarded!`);
        loadManifest(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifyingSeat(null);
    }
  };

  // Group entries by booking reference for the manifest display
  const groupedByRef = manifest.reduce<Record<string, ManifestEntry[]>>((acc, entry) => {
    if (!acc[entry.bookingReference]) acc[entry.bookingReference] = [];
    acc[entry.bookingReference].push(entry);
    return acc;
  }, {});

  const boardedCount = manifest.filter((m) => m.boardedAt).length;
  const totalCount = manifest.length;

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
              <span>{boardedCount}/{totalCount} boarded</span>
            </div>
            <div className="w-32 h-2 bg-emerald-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-300 rounded-full transition-all duration-500"
                style={{ width: totalCount ? `${(boardedCount / totalCount) * 100}%` : "0%" }}
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
        <p className="text-xs text-slate-400 mb-3">Scanning a reference without a seat marks all passengers as boarded.</p>

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
        <span className="text-xs font-normal text-slate-400 ml-auto">{totalCount} seat{totalCount !== 1 ? "s" : ""}</span>
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
          <button type="button" onClick={() => loadManifest(true)}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : manifest.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          No confirmed bookings yet
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByRef).map(([ref, entries]) => (
            <div key={ref} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Group header */}
              <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-500 tracking-wide">{ref}</span>
                <span className="text-xs text-slate-400">{entries.length} seat{entries.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Per-seat rows */}
              <div className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const isBoarded = !!entry.boardedAt;
                  const verifyKey = `${entry.bookingReference}:${entry.seatNumber}`;
                  const isVerifying = verifyingSeat === verifyKey;

                  return (
                    <div key={entry.seatNumber}
                      className={`flex items-center gap-3 px-3 py-3 ${isBoarded ? "opacity-60" : ""}`}>
                      {/* Seat badge */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono ${
                        isBoarded ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {entry.seatNumber}
                      </div>

                      {/* Passenger info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-slate-800 text-sm truncate">{entry.passengerName}</p>
                          {entry.isPrimaryPassenger && (
                            <span className="text-xs text-slate-400 flex-shrink-0">· primary</span>
                          )}
                        </div>
                        {entry.passengerPhone && (
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">{entry.passengerPhone}</p>
                        )}
                      </div>

                      {/* Status / action */}
                      {isBoarded ? (
                        <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Boarded</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifySeat(entry.bookingReference, entry.seatNumber)}
                          disabled={!!verifyingSeat}
                          className="no-print flex-shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          {isVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                          {isVerifying ? "..." : "Board"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
