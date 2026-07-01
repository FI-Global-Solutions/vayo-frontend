"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string; // yyyy-MM-dd
  onChange: (val: string) => void;
  minDate?: Date;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, dd MMM yyyy");
}

export default function DatePicker({ value, onChange, minDate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div className="flex-1 min-w-0 relative" ref={ref}>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        Date
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-3 rounded-xl border text-sm text-left transition-all",
          "bg-slate-50 hover:bg-white focus:outline-none",
          open
            ? "border-emerald-400 ring-2 ring-emerald-100 bg-white"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className={cn("flex-1", value ? "text-slate-800 font-medium" : "text-slate-400")}>
          {value ? formatDisplay(value) : "Pick a date"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-150 rdp-custom">
          <style>{`
            .rdp-custom .rdp-root {
              --rdp-accent-color: #10b981;
              --rdp-accent-background-color: #d1fae5;
              --rdp-day-height: 36px;
              --rdp-day-width: 36px;
              --rdp-day_button-height: 34px;
              --rdp-day_button-width: 34px;
              --rdp-day_button-border-radius: 8px;
              --rdp-today-color: #059669;
            }
            .rdp-custom .rdp-month_caption {
              font-size: 0.875rem;
              font-weight: 600;
              color: #1e293b;
            }
            .rdp-custom .rdp-weekday {
              font-size: 0.7rem;
              font-weight: 500;
              color: #94a3b8;
              opacity: 1;
            }
            .rdp-custom .rdp-day_button {
              font-size: 0.8125rem;
              font-weight: 500;
              color: #334155;
            }
            .rdp-custom .rdp-day_button:hover:not(:disabled) {
              background-color: #ecfdf5;
              color: #059669;
            }
            .rdp-custom .rdp-selected .rdp-day_button {
              background-color: #10b981;
              color: white;
              font-weight: 600;
              border-color: #10b981;
            }
            .rdp-custom .rdp-button_previous,
            .rdp-custom .rdp-button_next {
              width: 28px;
              height: 28px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              background: white;
              color: #64748b;
            }
            .rdp-custom .rdp-button_previous:hover,
            .rdp-custom .rdp-button_next:hover {
              background: #ecfdf5;
              border-color: #6ee7b7;
              color: #059669;
            }
            .rdp-custom .rdp-disabled .rdp-day_button {
              color: #cbd5e1;
              cursor: not-allowed;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ before: minDate ?? new Date() }}
            showOutsideDays={false}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left"
                  ? <ChevronLeft className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />,
            }}
          />

          {/* Quick picks */}
          <div className="border-t border-slate-100 pt-2 mt-1 flex gap-2">
            {[
              { label: "Today", days: 0 },
              { label: "Tomorrow", days: 1 },
              { label: "In 2 days", days: 2 },
              { label: "In a week", days: 7 },
            ].map(({ label, days }) => {
              const d = new Date();
              d.setDate(d.getDate() + days);
              const val = format(d, "yyyy-MM-dd");
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium",
                    value === val
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
