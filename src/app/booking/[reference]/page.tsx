"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, Clock, Bus, Printer, Share2, ArrowRight } from "lucide-react";
import { bookingApi } from "@/lib/api";
import { TicketResponse } from "@/lib/types";
import { QRCodeCanvas } from "qrcode.react";

export default function TicketPage() {
  const { reference } = useParams<{ reference: string }>();
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    bookingApi.ticket(reference)
      .then((r) => setTicket(r.data.data))
      .catch(() => setError("Ticket not found or you don't have permission to view it."))
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mx-auto" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-medium">{error || "Ticket not found"}</p>
      </div>
    );
  }

  const isConfirmed = ticket.status === "CONFIRMED" || ticket.status === "USED";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8">

      {/* Success banner */}
      {isConfirmed && (
        <div className="no-print flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Booking confirmed!</p>
            <p className="text-xs text-emerald-600">Your ticket has been sent by SMS and email.</p>
          </div>
        </div>
      )}

      {/* Ticket card */}
      <div className="print-ticket bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">

        {/* Header strip */}
        <div className="bg-emerald-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200 uppercase tracking-wide font-medium">VAYO Ticket</p>
              <p className="text-lg font-bold mt-0.5">{ticket.bookingReference}</p>
            </div>
            <Bus className="h-8 w-8 text-emerald-300" />
          </div>
        </div>

        {/* Route section */}
        <div className="px-6 py-5 border-b border-dashed border-slate-200">
          <div className="flex items-center gap-3">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">
                {format(new Date(ticket.departureTime), "HH:mm")}
              </p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{ticket.origin}</p>
              <p className="text-xs text-slate-400">{format(new Date(ticket.departureTime), "dd MMM yyyy")}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                Direct
              </div>
              <div className="w-16 flex items-center">
                <div className="h-px flex-1 bg-slate-300" />
                <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
              </div>
            </div>

            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">
                {format(new Date(ticket.arrivalTime), "HH:mm")}
              </p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{ticket.destination}</p>
              <p className="text-xs text-slate-400">{format(new Date(ticket.arrivalTime), "dd MMM yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Passenger details */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-dashed border-slate-200 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Passenger</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.passengerName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Phone</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.passengerPhone}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Seat(s)</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.seatNumbers.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Operator</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.operatorName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Amount Paid</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.totalAmount.toLocaleString()} RWF</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Bus Type</p>
            <p className="font-semibold text-slate-800 mt-0.5">{ticket.busType}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="px-6 py-6 flex flex-col items-center">
          <p className="text-xs text-slate-500 mb-4 text-center">
            Show this QR code or your booking reference to the conductor
          </p>
          <div className="bg-white p-3 border border-slate-200 rounded-xl">
            <QRCodeCanvas
              value={ticket.qrCodeBase64 || ticket.bookingReference}
              size={160}
              level="M"
            />
          </div>
          <p className="text-xs font-mono font-bold text-slate-600 mt-3 tracking-widest">
            {ticket.bookingReference}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 text-center text-xs text-slate-400">
          Booked on {format(new Date(ticket.createdAt), "dd MMM yyyy, HH:mm")}
        </div>
      </div>

      {/* Actions */}
      <div className="no-print mt-4 flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm"
        >
          <Printer className="h-4 w-4" />
          Print Ticket
        </button>
        <button
          onClick={() => navigator.share?.({ title: "VAYO Ticket", text: `My booking: ${ticket.bookingReference}` })}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 text-sm"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}
