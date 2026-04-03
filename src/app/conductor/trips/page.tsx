"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, MapPin, Clock, Users, ChevronRight, ScanLine, CalendarDays, RefreshCw } from "lucide-react";
import { conductorApi } from "@/lib/api";
import { TripOperatorResponse } from "@/lib/types";
import { getStoredUser } from "@/store/auth";

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  BOARDING:  "bg-amber-50 text-amber-700",
  DEPARTED:  "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-50 text-red-600",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit" });
}

export default function ConductorTripsPage() {
  const [trips, setTrips] = useState<TripOperatorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    conductorApi.todayTrips()
      .then((r) => setTrips(r.data.data ?? []))
      .catch(() => setTrips([]))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    load();
    setFirstName(getStoredUser()?.firstName ?? null);
  }, []);

  const today = new Date().toLocaleDateString("en-RW", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const active   = trips.filter((t) => t.status === "SCHEDULED" || t.status === "BOARDING");
  const departed = trips.filter((t) => t.status === "DEPARTED" || t.status === "CANCELLED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScanLine className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              {firstName ? `Hi, ${firstName}` : "Conductor Panel"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{today}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary pills */}
      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total today", value: trips.length, color: "bg-slate-50 text-slate-700" },
            { label: "Active",      value: active.length, color: "bg-emerald-50 text-emerald-700" },
            { label: "Completed",   value: departed.length, color: "bg-blue-50 text-blue-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-xl px-3 py-2.5 text-center border border-white`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 opacity-75">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trips list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No trips assigned today</p>
          <p className="text-sm text-slate-400 mt-1">Check back later or contact your operator</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active trips first */}
          {active.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Active</p>
              {active.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </>
          )}

          {/* Departed / cancelled */}
          {departed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mt-4">Earlier</p>
              {departed.map((trip) => (
                <TripCard key={trip.id} trip={trip} muted />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, muted = false }: { trip: TripOperatorResponse; muted?: boolean }) {
  return (
    <Link
      href={`/conductor/trips/${trip.id}`}
      className={`block bg-white rounded-xl border p-4 transition-all group
        ${muted
          ? "border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200"
          : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            <span className="font-semibold text-slate-800 text-sm truncate">
              {trip.origin} → {trip.destination}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {fmt(trip.departureTime)} → {fmt(trip.arrivalTime)}
            </span>
            <span className="flex items-center gap-1">
              <Bus className="h-3 w-3" />
              {trip.plateNumber}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {trip.bookedSeats}/{trip.totalSeats} booked
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[trip.status] ?? "bg-slate-100 text-slate-500"}`}>
            {trip.status}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
