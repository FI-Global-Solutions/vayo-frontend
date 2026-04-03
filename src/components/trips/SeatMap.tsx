"use client";
import { SeatStatus } from "@/lib/types";

interface Props {
  seats: SeatStatus[];
  selected: string[];
  onToggle: (seatNumber: string) => void;
  maxSelectable: number;
}

function seatStyle(status: SeatStatus["status"], isSelected: boolean) {
  if (isSelected) return "bg-emerald-500 border-emerald-600 text-white cursor-pointer hover:bg-emerald-600";
  if (status === "BOOKED") return "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed";
  if (status === "LOCKED") return "bg-orange-100 border-orange-300 text-orange-400 cursor-not-allowed";
  return "bg-white border-slate-300 text-slate-700 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50";
}

export default function SeatMap({ seats, selected, onToggle, maxSelectable }: Props) {
  // Group seats into rows by extracting the number prefix
  const rows: Record<string, SeatStatus[]> = {};
  seats.forEach((seat) => {
    const row = seat.seatNumber.replace(/[^0-9]/g, "");
    if (!rows[row]) rows[row] = [];
    rows[row].push(seat);
  });

  const handleClick = (seat: SeatStatus) => {
    if (seat.status === "BOOKED" || seat.status === "LOCKED") return;
    const isSelected = selected.includes(seat.seatNumber);
    if (!isSelected && selected.length >= maxSelectable) return;
    onToggle(seat.seatNumber);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 text-xs font-medium flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded border border-slate-300 bg-white" />
          <span className="text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded border border-emerald-600 bg-emerald-500" />
          <span className="text-slate-600">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded border border-slate-300 bg-slate-200" />
          <span className="text-slate-600">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded border border-orange-300 bg-orange-100" />
          <span className="text-slate-600">Held</span>
        </div>
      </div>

      {/* Bus front indicator */}
      <div className="flex justify-center mb-4">
        <div className="px-6 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-full">
          DRIVER / FRONT
        </div>
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[200px] max-w-xs mx-auto space-y-2">
          {Object.entries(rows)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([row, rowSeats]) => {
              const sorted = [...rowSeats].sort((a, b) =>
                a.seatNumber.localeCompare(b.seatNumber)
              );
              // Split into left (2) and right (2) with aisle gap
              const left = sorted.slice(0, 2);
              const right = sorted.slice(2);

              return (
                <div key={row} className="flex items-center gap-2 justify-center">
                  {/* Row label */}
                  <span className="text-xs text-slate-400 w-4 text-center">{row}</span>

                  {/* Left seats */}
                  <div className="flex gap-1">
                    {left.map((seat) => (
                      <button
                        key={seat.seatNumber}
                        type="button"
                        onClick={() => handleClick(seat)}
                        title={seat.seatNumber}
                        className={`w-9 h-9 rounded-lg border-2 text-xs font-semibold transition-all ${seatStyle(seat.status, selected.includes(seat.seatNumber))}`}
                      >
                        {seat.seatNumber.replace(/[0-9]/g, "")}
                      </button>
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className="w-4" />

                  {/* Right seats */}
                  <div className="flex gap-1">
                    {right.map((seat) => (
                      <button
                        key={seat.seatNumber}
                        type="button"
                        onClick={() => handleClick(seat)}
                        title={seat.seatNumber}
                        className={`w-9 h-9 rounded-lg border-2 text-xs font-semibold transition-all ${seatStyle(seat.status, selected.includes(seat.seatNumber))}`}
                      >
                        {seat.seatNumber.replace(/[0-9]/g, "")}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-sm text-emerald-700 font-medium">
          {selected.length} seat{selected.length > 1 ? "s" : ""} selected: {selected.join(", ")}
        </div>
      )}
    </div>
  );
}
