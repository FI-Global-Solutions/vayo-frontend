import Link from "next/link";
import { Clock, Users, ArrowRight, Star } from "lucide-react";
import { TripSearchResult } from "@/lib/types";
import { format } from "date-fns";

function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function busTypeBadge(type: string) {
  const map: Record<string, { label: string; color: string }> = {
    LUXURY: { label: "Luxury", color: "bg-amber-100 text-amber-700" },
    STANDARD: { label: "Standard", color: "bg-slate-100 text-slate-600" },
    MINIBUS: { label: "Minibus", color: "bg-blue-100 text-blue-700" },
  };
  return map[type] ?? { label: type, color: "bg-slate-100 text-slate-600" };
}

function seatAvailabilityColor(available: number, total: number): string {
  const pct = available / total;
  if (pct < 0.1) return "text-red-500";
  if (pct < 0.3) return "text-orange-500";
  return "text-emerald-600";
}

export default function TripCard({ trip, date }: { trip: TripSearchResult; date: string }) {
  const badge = busTypeBadge(trip.busType);
  const seatColor = seatAvailabilityColor(trip.availableSeats, trip.totalSeats);

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left: operator + times */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Operator logo placeholder */}
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
              {trip.operatorName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{trip.operatorName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Time row */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">
                {format(new Date(trip.departureTime), "HH:mm")}
              </p>
              <p className="text-xs text-slate-400">{trip.origin}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {durationLabel(trip.durationMinutes)}
              </div>
              <div className="w-full flex items-center gap-1">
                <div className="h-px flex-1 bg-slate-200" />
                <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">
                {format(new Date(trip.arrivalTime), "HH:mm")}
              </p>
              <p className="text-xs text-slate-400">{trip.destination}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-16 bg-slate-100" />

        {/* Right: seats + price + CTA */}
        <div className="sm:text-right flex sm:flex-col flex-row sm:items-end items-center justify-between sm:gap-2">
          <div className={`flex items-center gap-1 text-xs font-medium ${seatColor}`}>
            <Users className="h-3.5 w-3.5" />
            {trip.availableSeats} seats left
          </div>

          <div className="sm:mt-1">
            <p className="text-2xl font-extrabold text-slate-900">
              {trip.price.toLocaleString()} <span className="text-sm font-normal text-slate-500">RWF</span>
            </p>
          </div>

          <Link
            href={`/trip/${trip.tripId}?date=${date}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex-shrink-0"
          >
            Select Seats
          </Link>
        </div>
      </div>
    </div>
  );
}
