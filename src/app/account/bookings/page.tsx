"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Ticket, MapPin, Clock, Users, ChevronRight,
  Bus, CheckCircle2, XCircle, AlertCircle, Hourglass, Loader2,
} from "lucide-react";
import { bookingApi } from "@/lib/api";
import { BookingResponse } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  CONFIRMED: { label: "Confirmed",  style: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  USED:      { label: "Boarded",    style: "bg-slate-100 text-slate-500 border-slate-200",      icon: CheckCircle2 },
  PENDING:   { label: "Pending",    style: "bg-amber-50 text-amber-700 border-amber-200",        icon: Hourglass    },
  CANCELLED: { label: "Cancelled",  style: "bg-red-50 text-red-600 border-red-200",              icon: XCircle      },
  EXPIRED:   { label: "Expired",    style: "bg-slate-100 text-slate-400 border-slate-200",       icon: AlertCircle  },
};

function fmt(iso: string) {
  return format(new Date(iso), "EEE dd MMM yyyy, HH:mm");
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi.myBookings()
      .then((r) => setBookings(r.data.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Ticket className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900">My Tickets</h1>
        </div>
        <p className="text-sm text-slate-500">All your bookings, past and upcoming</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bus className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="font-semibold text-slate-600">No bookings yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">Find a bus and book your first trip</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm"
          >
            Search trips
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.EXPIRED;
            const StatusIcon = cfg.icon;
            const canViewTicket = b.status === "CONFIRMED" || b.status === "USED";

            const card = (
              <div
                className={`bg-white rounded-2xl border p-4 transition-all group ${
                  canViewTicket
                    ? "border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer"
                    : "border-slate-100 opacity-80"
                }`}
              >
                {/* Top row: route + status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-800 text-sm truncate">
                      {b.origin} → {b.destination}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 flex items-center gap-1 ${cfg.style}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmt(b.departureTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="h-3 w-3" />
                    {b.operatorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Seats: {b.seatNumbers.join(", ")}
                  </span>
                </div>

                {/* Bottom row: ref + amount + arrow */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      {b.bookingReference}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {b.totalAmount.toLocaleString()} RWF
                    </span>
                  </div>
                  {canViewTicket && (
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                  )}
                </div>

                {/* Pending warning */}
                {b.status === "PENDING" && (
                  <div className="mt-3 pt-3 border-t border-amber-100 text-xs text-amber-600 flex items-center gap-1.5">
                    <Hourglass className="h-3 w-3 flex-shrink-0" />
                    Payment pending — complete payment to confirm your seat
                  </div>
                )}
              </div>
            );

            return canViewTicket ? (
              <Link key={b.bookingId} href={`/booking/${b.bookingReference}`}>
                {card}
              </Link>
            ) : (
              <div key={b.bookingId}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
