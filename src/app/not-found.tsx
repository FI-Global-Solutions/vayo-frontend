import Link from "next/link";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { MapPin, Home, Ticket } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full mb-6">
          <MapPin className="h-12 w-12 text-slate-300" />
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
            404
          </span>
        </div>

        <div className="mb-2">
          <VayoLogo height={32} />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 mt-4 mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Looks like this route doesn't exist. The page may have moved or the link might be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
          <Link
            href="/booking/lookup"
            className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Ticket className="h-4 w-4" /> Find my booking
          </Link>
        </div>
      </div>
    </div>
  );
}
