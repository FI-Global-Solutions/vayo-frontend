"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

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
        <div className="absolute z-50 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-150">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ before: minDate ?? new Date() }}
            startMonth={minDate ?? new Date()}
            showOutsideDays={false}
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              month_caption: "flex justify-between items-center px-1 py-1",
              caption_label: "text-sm font-semibold text-slate-800",
              nav: "flex items-center gap-1",
              button_previous: cn(
                "h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300",
                "flex items-center justify-center transition-colors"
              ),
              button_next: cn(
                "h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300",
                "flex items-center justify-center transition-colors"
              ),
              month_grid: "w-full border-collapse",
              weekdays: "flex mb-1",
              weekday: "w-9 text-center text-xs font-medium text-slate-400",
              week: "flex w-full mt-1",
              day: cn(
                "relative w-9 h-9 flex items-center justify-center text-sm",
                "[&:has([aria-selected])]:rounded-lg [&:has([aria-selected])]:bg-emerald-500"
              ),
              day_button: cn(
                "h-9 w-9 rounded-lg flex items-center justify-center text-sm font-medium",
                "hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
              ),
              selected: "bg-emerald-500 text-white hover:bg-emerald-600 font-semibold rounded-lg",
              today: "border border-emerald-300 text-emerald-700 font-semibold",
              outside: "opacity-0 pointer-events-none",
              disabled: "text-slate-200 cursor-not-allowed hover:bg-transparent",
              hidden: "invisible",
            }}
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
