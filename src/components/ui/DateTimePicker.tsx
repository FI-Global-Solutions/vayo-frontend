"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid } from "date-fns";
import { CalendarDays, Clock, ChevronDown } from "lucide-react";
import "react-day-picker/dist/style.css";

interface DateTimePickerProps {
  value: string; // ISO string "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  label?: string;
}

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  minDate,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen]         = useState(false);
  const [month, setMonth]       = useState<Date>(minDate ?? new Date());
  const containerRef            = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsed = value ? new Date(value) : null;
  const selectedDay   = parsed && isValid(parsed) ? parsed : undefined;
  const selectedHour  = parsed && isValid(parsed) ? String(parsed.getHours()).padStart(2, "0")   : "08";
  const selectedMin   = parsed && isValid(parsed) ? String(parsed.getMinutes()).padStart(2, "0") : "00";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commit = (day: Date | undefined, h: string, m: string) => {
    if (!day) return;
    const d = new Date(day);
    d.setHours(Number(h), Number(m), 0, 0);
    onChange(format(d, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleDaySelect = (day: Date | undefined) => {
    commit(day, selectedHour, selectedMin);
  };

  const handleHourChange = (h: string) => {
    commit(selectedDay, h, selectedMin);
  };

  const handleMinChange = (m: string) => {
    commit(selectedDay, selectedHour, m);
  };

  const displayValue = selectedDay && isValid(selectedDay)
    ? format(selectedDay, "EEE, dd MMM yyyy") + "  ·  " + selectedHour + ":" + selectedMin
    : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 pl-3 pr-3 py-3 border rounded-xl text-sm text-left transition-all
          ${open ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "bg-white cursor-pointer"}
          ${!selectedDay ? "text-slate-400" : "text-slate-800"}`}
      >
        <CalendarDays className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className="flex-1 truncate">{displayValue}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden min-w-[280px]">
          {/* Calendar */}
          <div className="px-2 pt-2">
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={handleDaySelect}
              month={month}
              onMonthChange={setMonth}
              disabled={minDate ? { before: minDate } : undefined}
              classNames={{
                root: "!m-0",
                months: "flex flex-col",
                month: "space-y-1",
                caption: "flex justify-center items-center relative py-2",
                caption_label: "text-sm font-semibold text-slate-800",
                nav: "flex items-center",
                nav_button: "h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 absolute",
                nav_button_previous: "left-1",
                nav_button_next: "right-1",
                table: "w-full border-collapse",
                head_row: "flex mb-1",
                head_cell: "flex-1 text-xs font-medium text-slate-400 text-center py-1",
                row: "flex",
                cell: "flex-1 text-center",
                day: "w-8 h-8 mx-auto rounded-lg text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors",
                day_selected: "!bg-emerald-600 !text-white hover:!bg-emerald-700 font-semibold",
                day_today: "font-bold text-emerald-600",
                day_disabled: "opacity-30 cursor-not-allowed",
                day_outside: "text-slate-300",
              }}
            />
          </div>

          {/* Time picker */}
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Pick a time</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <select
                value={selectedHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="flex-1 py-2 px-2 border border-slate-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-slate-800 font-medium"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-lg font-bold text-slate-400">:</span>
              {/* Minute */}
              <select
                value={selectedMin}
                onChange={(e) => handleMinChange(e.target.value)}
                className="flex-1 py-2 px-2 border border-slate-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-slate-800 font-medium"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {/* Done */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={!selectedDay}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>

            {/* Live preview */}
            {selectedDay && (
              <p className="text-xs text-emerald-700 font-medium mt-2 text-center">
                {format(selectedDay, "EEE, dd MMM yyyy")} at {selectedHour}:{selectedMin}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
