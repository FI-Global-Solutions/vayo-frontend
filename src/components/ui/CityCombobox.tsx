"use client";
import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  iconColor?: string;
}

export default function CityCombobox({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  iconColor = "text-emerald-500",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (city: string) => {
    onChange(city);
    setOpen(false);
    setQuery("");
  };

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex-1 min-w-0 relative" ref={ref}>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-3 rounded-xl border text-sm text-left transition-all",
          "bg-slate-50 hover:bg-white focus:outline-none",
          open
            ? "border-emerald-400 ring-2 ring-emerald-100 bg-white"
            : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <MapPin className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
        <span className={cn("flex-1 truncate", value ? "text-slate-800 font-medium" : "text-slate-400")}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[200px] sm:w-64 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="flex-1 text-sm outline-none placeholder-slate-400 bg-transparent"
            />
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No cities found</p>
            ) : (
              filtered.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => select(city)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-emerald-50 transition-colors group"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-400 flex-shrink-0" />
                  <span className={cn(
                    "flex-1",
                    city === value ? "font-semibold text-emerald-700" : "text-slate-700"
                  )}>
                    {city}
                  </span>
                  {city === value && (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
