"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Calendar, Plus, X, MapPin, Bus, Clock,
  Users, ArrowRight, AlertCircle, ChevronLeft,
  ChevronRight, XCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

// ─── Types ────────────────────────────────────────────────────────────────────

type TripStatus = "SCHEDULED" | "BOARDING" | "DEPARTED" | "CANCELLED";

type RouteOption = { id: string; origin: string; destination: string };
type BusOption   = { id: string; plateNumber: string; busType: string; totalSeats: number };

type TripItem = {
  id: string;
  origin: string;
  destination: string;
  plateNumber: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  status: TripStatus;
};

type FormData = {
  routeId: string;
  busId: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
};

const STATUS_STYLES: Record<TripStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  BOARDING:  "bg-amber-50 text-amber-700",
  DEPARTED:  "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-50 text-red-500",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit" });
}

// ─── Schedule trip panel ──────────────────────────────────────────────────────

function TripPanel({ routes, buses, onClose, onCreated }: {
  routes: RouteOption[];
  buses: BusOption[];
  onClose: () => void;
  onCreated: (trip: TripItem) => void;
}) {
  const { register, handleSubmit, watch, control, formState: { isSubmitting, errors, isValid } } = useForm<FormData>({ mode: "onChange" });
  const selectedBusId = watch("busId");
  const departureValue = watch("departureTime");
  const selectedBus = buses.find((b) => b.id === selectedBusId);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await operatorApi.createTrip({
        routeId: data.routeId,
        busId: data.busId,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
        price: Number(data.price),
      });
      onCreated(res.data.data);
      toast.success("Trip scheduled");
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to schedule trip");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Schedule Trip</h2>
              <p className="text-xs text-slate-400">Assign a bus to a route and time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {routes.length === 0 || buses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Missing prerequisites</p>
              <p className="text-xs text-slate-400">
                {routes.length === 0 && "You need at least one route. "}
                {buses.length === 0 && "You need at least one bus."}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Route */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Route</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  {...register("routeId", { required: "Select a route" })}
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option value="">Select route...</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>
                  ))}
                </select>
              </div>
              {errors.routeId && <p className="text-xs text-red-500 mt-1">{errors.routeId.message}</p>}
            </div>

            {/* Bus */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bus</label>
              <div className="relative">
                <Bus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  {...register("busId", { required: "Select a bus" })}
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option value="">Select bus...</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>{b.plateNumber} — {b.busType} ({b.totalSeats} seats)</option>
                  ))}
                </select>
              </div>
              {errors.busId && <p className="text-xs text-red-500 mt-1">{errors.busId.message}</p>}
              {selectedBus && (
                <p className="text-xs text-slate-400 mt-1">
                  {selectedBus.busType} · {selectedBus.totalSeats} seats
                </p>
              )}
            </div>

            {/* Departure */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Departure Date & Time</span>
              </label>
              <Controller
                name="departureTime"
                control={control}
                rules={{ required: "Select a departure date and time" }}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Choose departure..."
                    minDate={new Date()}
                  />
                )}
              />
              {errors.departureTime && <p className="text-xs text-red-500 mt-1">{errors.departureTime.message}</p>}
            </div>

            {/* Arrival */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Arrival Date & Time</span>
              </label>
              <Controller
                name="arrivalTime"
                control={control}
                rules={{
                  required: "Select an arrival date and time",
                  validate: (v) => !departureValue || v > departureValue || "Arrival must be after departure",
                }}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Choose arrival..."
                    minDate={departureValue ? new Date(departureValue) : new Date()}
                  />
                )}
              />
              {errors.arrivalTime && <p className="text-xs text-red-500 mt-1">{errors.arrivalTime.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ticket Price (RWF)</label>
              <input
                {...register("price", { required: "Required", min: { value: 100, message: "Min 100 RWF" } })}
                type="number"
                placeholder="e.g. 3500"
                className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
          </form>
        )}

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} type="button" className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          {routes.length > 0 && buses.length > 0 && (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isValid}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Scheduling...</> : "Schedule Trip"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Cancel dialog ────────────────────────────────────────────────────────────

function CancelDialog({ trip, onConfirm, onCancel }: { trip: TripItem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Cancel Trip?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <span className="font-medium text-slate-700">{trip.origin} → {trip.destination}</span> on{" "}
          {fmtDate(trip.departureTime)} at {fmtTime(trip.departureTime)} will be cancelled.
          Any confirmed bookings will be marked for refund.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Keep Trip</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm">Cancel Trip</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OperatorTripsPage() {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [toCancel, setToCancel] = useState<TripItem | null>(null);

  const loadTrips = (p = 0) => {
    setLoading(true);
    operatorApi.trips(p)
      .then((r) => {
        const data = r.data.data;
        setTrips(data.content ?? []);
        setHasMore(!data.last);
        setPage(data.page ?? p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load trips + routes + buses in parallel for the schedule form
    loadTrips(0);
    operatorApi.routes(0).then((r) => setRoutes(r.data.data?.content ?? []));
    operatorApi.buses(0).then((r) => setBuses(r.data.data?.content ?? []));
  }, []);

  const handleCancel = async () => {
    if (!toCancel) return;
    try {
      await operatorApi.cancelTrip(toCancel.id);
      setTrips((prev) => prev.map((t) => t.id === toCancel.id ? { ...t, status: "CANCELLED" } : t));
      toast.success("Trip cancelled");
    } catch {
      toast.error("Failed to cancel trip");
    } finally {
      setToCancel(null);
    }
  };

  const upcoming = trips.filter((t) => t.status === "SCHEDULED" || t.status === "BOARDING");
  const past     = trips.filter((t) => t.status === "DEPARTED"  || t.status === "CANCELLED");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trips</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule and manage your departures</p>
        </div>
        <button
          onClick={() => setShowPanel(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Schedule Trip
        </button>
      </div>

      {/* Empty */}
      {!loading && trips.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No trips scheduled</h3>
          <p className="text-sm text-slate-400 mb-2">Schedule your first trip to start accepting bookings</p>
          {(routes.length === 0 || buses.length === 0) && (
            <p className="text-xs text-amber-600 font-medium mb-4">
              {routes.length === 0 && "⚠ You need to add a route first. "}
              {buses.length === 0 && "⚠ You need to add a bus first."}
            </p>
          )}
          <button
            onClick={() => setShowPanel(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <Plus className="h-4 w-4" /> Schedule First Trip
          </button>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="flex gap-4 items-center">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-56" />
                  <div className="h-3 bg-slate-100 rounded w-72" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip list */}
      {!loading && trips.length > 0 && (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming</p>
              <div className="space-y-3">
                {upcoming.map((trip) => <TripCard key={trip.id} trip={trip} onCancel={() => setToCancel(trip)} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Past</p>
              <div className="space-y-3">
                {past.map((trip) => <TripCard key={trip.id} trip={trip} muted />)}
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={page === 0} onClick={() => loadTrips(page - 1)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-500">Page {page + 1}</span>
            <button disabled={!hasMore} onClick={() => loadTrips(page + 1)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {showPanel && (
        <TripPanel
          routes={routes}
          buses={buses}
          onClose={() => setShowPanel(false)}
          onCreated={(trip) => setTrips((prev) => [trip, ...prev])}
        />
      )}
      {toCancel && <CancelDialog trip={toCancel} onConfirm={handleCancel} onCancel={() => setToCancel(null)} />}
    </div>
  );
}

function TripCard({ trip, onCancel, muted = false }: { trip: TripItem; onCancel?: () => void; muted?: boolean }) {
  const occupancy = trip.totalSeats > 0 ? Math.round((trip.bookedSeats / trip.totalSeats) * 100) : 0;
  const canCancel = trip.status === "SCHEDULED" && onCancel;

  return (
    <div className={`bg-white border rounded-xl p-4 sm:p-5 transition-colors ${muted ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Route */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <span className="font-semibold text-slate-800 text-sm">{trip.origin}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <span className="font-semibold text-slate-800 text-sm">{trip.destination}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[trip.status]}`}>
              {trip.status}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {fmtDate(trip.departureTime)} · {fmtTime(trip.departureTime)} → {fmtTime(trip.arrivalTime)}
            </span>
            <span className="flex items-center gap-1">
              <Bus className="h-3 w-3" />
              {trip.plateNumber}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {trip.bookedSeats}/{trip.totalSeats} booked
            </span>
            <span className="font-medium text-slate-600">
              {trip.price?.toLocaleString()} RWF
            </span>
          </div>

          {/* Occupancy bar */}
          {!muted && trip.totalSeats > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${occupancy > 80 ? "bg-emerald-500" : occupancy > 40 ? "bg-amber-400" : "bg-slate-300"}`}
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">{occupancy}%</span>
            </div>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={onCancel}
            className="flex-shrink-0 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Cancel trip"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
