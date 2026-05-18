"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Clock, ChevronRight, MapPin, Loader2 } from "lucide-react";
import SeatMap from "@/components/trips/SeatMap";
import { StopSelector } from "@/components/trips/StopSelector";
import { tripApi } from "@/lib/api";
import { TripDetail, RouteStop, SeatStatus } from "@/lib/types";
import { clearStopSelection } from "@/lib/utils";

// ── sessionStorage helpers ────────────────────────────────────────────────────

function saveStopSelection(tripId: string, origin: { id: string; name: string }, dest: { id: string; name: string }) {
  sessionStorage.setItem(`vayo_stop_origin_${tripId}`, JSON.stringify(origin));
  sessionStorage.setItem(`vayo_stop_destination_${tripId}`, JSON.stringify(dest));
}

function loadStopSelection(tripId: string) {
  try {
    const o = sessionStorage.getItem(`vayo_stop_origin_${tripId}`);
    const d = sessionStorage.getItem(`vayo_stop_destination_${tripId}`);
    return o && d
      ? { origin: JSON.parse(o) as { id: string; name: string }, dest: JSON.parse(d) as { id: string; name: string } }
      : null;
  } catch { return null; }
}

// ── Component ─────────────────────────────────────────────────────────────────

type PageStep = "stops" | "seats";

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? "";
  const router = useRouter();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Stop selection state
  const [pageStep, setPageStep] = useState<PageStep>("stops");
  const [originStopId, setOriginStopId] = useState<string | null>(null);
  const [destStopId, setDestStopId] = useState<string | null>(null);
  const [originStopName, setOriginStopName] = useState<string>("");
  const [destStopName, setDestStopName] = useState<string>("");

  // Seat state — populated after stop confirmation
  const [seats, setSeats] = useState<SeatStatus[]>([]);
  const [segmentPrice, setSegmentPrice] = useState<number | null>(null);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Load trip detail on mount
  useEffect(() => {
    tripApi.detail(tripId)
      .then((res) => {
        const detail = res.data.data as TripDetail;
        setTrip(detail);

        const stops: RouteStop[] = detail.stops ?? [];

        // Restore prior stop selection from sessionStorage
        const saved = loadStopSelection(tripId);
        if (saved) {
          // Validate that saved stop IDs still exist on this trip
          const originExists = stops.some((s) => s.id === saved.origin.id);
          const destExists = stops.some((s) => s.id === saved.dest.id);
          if (originExists && destExists) {
            setOriginStopId(saved.origin.id);
            setOriginStopName(saved.origin.name);
            setDestStopId(saved.dest.id);
            setDestStopName(saved.dest.name);
            // Restore directly to seat step — seats will load via the effect below
            setPageStep("seats");
            return;
          }
        }

        // Auto-skip stop selection for single-segment routes (≤2 stops = origin + destination only)
        if (stops.length <= 2) {
          if (stops.length === 2) {
            setOriginStopId(stops[0].id);
            setOriginStopName(stops[0].stopName);
            setDestStopId(stops[1].id);
            setDestStopName(stops[1].stopName);
          }
          setPageStep("seats");
        }
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [tripId, router]);

  // Load seats whenever we enter the seats step with stop IDs
  const loadSeats = useCallback(() => {
    if (pageStep !== "seats") return;
    setSeatsLoading(true);
    const o = originStopId ?? undefined;
    const d = destStopId ?? undefined;
    tripApi.seats(tripId, o, d)
      .then((res) => {
        const data = res.data.data;
        setSeats(data?.seats ?? []);
        setSegmentPrice(data?.segmentPrice ?? null);
      })
      .catch(() => { /* seats stay empty — SeatMap shows nothing to select */ })
      .finally(() => setSeatsLoading(false));
  }, [tripId, originStopId, destStopId, pageStep]);

  useEffect(() => { loadSeats(); }, [loadSeats]);

  const toggleSeat = (sn: string) => {
    setSelected((prev) =>
      prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn]
    );
  };

  const confirmStops = () => {
    if (!originStopId || !destStopId) return;
    saveStopSelection(tripId,
      { id: originStopId, name: originStopName },
      { id: destStopId, name: destStopName }
    );
    setPageStep("seats");
  };

  const proceed = () => {
    if (!selected.length || !trip) return;
    const pricePerSeat = segmentPrice ?? trip.price;
    const params = new URLSearchParams({
      tripId,
      seats: selected.join(","),
      amount: String(pricePerSeat * selected.length),
      ...(originStopId ? { originStopId } : {}),
      ...(destStopId ? { destinationStopId: destStopId } : {}),
      ...(originStopName ? { originStopName } : {}),
      ...(destStopName ? { destinationStopName: destStopName } : {}),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const stops: RouteStop[] = trip.stops ?? [];
  const boardingStops = stops.filter((s) => s.boardingAllowed);
  const droppingStops = stops.filter((s) => s.droppingAllowed);
  const pricePerSeat = segmentPrice ?? trip.price;
  const total = pricePerSeat * selected.length;

  // Compute disabled stop IDs for dropping selector:
  // disable stops at or before the selected boarding stop (by stopOrder)
  const originStop = originStopId ? stops.find((s) => s.id === originStopId) : null;
  const disabledDroppingIds = originStop
    ? stops.filter((s) => s.stopOrder <= originStop.stopOrder).map((s) => s.id)
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6">
        <span>Search</span>
        <ChevronRight className="h-3 w-3" />
        {pageStep === "stops" ? (
          <span className="text-slate-700 font-medium">Select Stops</span>
        ) : (
          <>
            <button
              type="button"
              className="hover:text-slate-600 transition-colors"
              onClick={() => { setSelected([]); setPageStep("stops"); }}
            >
              Select Stops
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-700 font-medium">Select Seats</span>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span>Checkout</span>
      </nav>

      {/* Trip summary card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">{trip.operatorName}</p>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            {trip.busType}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {format(new Date(trip.departureTime), "HH:mm")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{trip.origin}</p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Direct
            </div>
            <div className="w-full flex items-center">
              <div className="h-px flex-1 bg-slate-200" />
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 mx-1 flex-shrink-0" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">
              {format(new Date(trip.arrivalTime), "HH:mm")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{trip.destination}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">{trip.availableSeats} seats available</span>
          <span className="font-bold text-slate-900">
            {pricePerSeat.toLocaleString()} RWF <span className="text-xs font-normal text-slate-400">/ seat</span>
          </span>
        </div>
      </div>

      {/* ── Step A: Stop selection ──────────────────────────────────────────── */}
      {pageStep === "stops" && stops.length > 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Where are you travelling?</h2>
          </div>

          <StopSelector
            label="Where are you boarding?"
            stops={boardingStops}
            selectedStopId={originStopId}
            onSelect={(id) => {
              const stop = stops.find((s) => s.id === id);
              setOriginStopId(id);
              setOriginStopName(stop?.stopName ?? "");
              // Clear destination if it's now disabled
              if (destStopId) {
                const dest = stops.find((s) => s.id === destStopId);
                const origin = stops.find((s) => s.id === id);
                if (dest && origin && dest.stopOrder <= origin.stopOrder) {
                  setDestStopId(null);
                  setDestStopName("");
                }
              }
            }}
          />

          <StopSelector
            label="Where are you getting off?"
            stops={droppingStops}
            selectedStopId={destStopId}
            disabledStopIds={disabledDroppingIds}
            onSelect={(id) => {
              const stop = stops.find((s) => s.id === id);
              setDestStopId(id);
              setDestStopName(stop?.stopName ?? "");
            }}
          />

          <button
            type="button"
            onClick={confirmStops}
            disabled={!originStopId || !destStopId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            Show available seats →
          </button>
        </div>
      )}

      {/* ── Step B: Seat map ────────────────────────────────────────────────── */}
      {pageStep === "seats" && (
        <>
          {/* Segment summary bar */}
          {(originStopName || destStopName) && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-sm">
              <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-emerald-800">
                {originStopName || trip.origin}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <span className="font-medium text-emerald-800">
                {destStopName || trip.destination}
              </span>
              {segmentPrice && (
                <>
                  <span className="text-emerald-400 mx-1">·</span>
                  <span className="font-bold text-emerald-700">{segmentPrice.toLocaleString()} RWF/seat</span>
                </>
              )}
            </div>
          )}

          <h2 className="text-sm font-semibold text-slate-700 mb-3">Choose your seat(s)</h2>

          {seatsLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <SeatMap
              seats={seats}
              selected={selected}
              onToggle={toggleSeat}
              maxSelectable={5}
              segmentPrice={segmentPrice}
              basePrice={trip.price}
            />
          )}

          {/* Bottom CTA */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
            <div>
              {selected.length > 0 ? (
                <>
                  <p className="text-sm text-slate-500">
                    {selected.length} seat(s) × {pricePerSeat.toLocaleString()} RWF
                  </p>
                  <p className="text-xl font-bold text-slate-900">{total.toLocaleString()} RWF</p>
                </>
              ) : (
                <p className="text-sm text-slate-400">Select at least one seat to continue</p>
              )}
            </div>
            <button
              type="button"
              onClick={proceed}
              disabled={selected.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl flex-shrink-0"
            >
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
