import SearchForm from "@/components/search/SearchForm";
import { Bus, Shield, Smartphone, Clock } from "lucide-react";
import Link from "next/link";

const POPULAR_ROUTES = [
  { from: "Kigali", to: "Kampala", price: "From 8,000 RWF", duration: "8h" },
  { from: "Kigali", to: "Nairobi", price: "From 15,000 RWF", duration: "14h" },
  { from: "Kigali", to: "Butare", price: "From 2,500 RWF", duration: "2h 30m" },
  { from: "Kigali", to: "Gisenyi", price: "From 3,000 RWF", duration: "3h" },
  { from: "Kigali", to: "Dar es Salaam", price: "From 20,000 RWF", duration: "22h" },
  { from: "Kigali", to: "Bujumbura", price: "From 5,000 RWF", duration: "5h" },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "Book in 2 minutes",
    desc: "Search, select your seat, and pay with MTN Mobile Money or Airtel Money.",
  },
  {
    icon: Shield,
    title: "Safe & guaranteed",
    desc: "Your seat is held for you. If the bus doesn't run, you get a full refund.",
  },
  {
    icon: Clock,
    title: "Digital ticket",
    desc: "Get your QR code ticket instantly by SMS and email. No printing needed.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-32 sm:pb-24">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              Book Bus Tickets Across<br className="hidden sm:block" /> East Africa
            </h1>
            <p className="text-emerald-100 text-base sm:text-lg max-w-xl mx-auto">
              Real-time seat availability. Pay with Mobile Money. Instant QR ticket.
            </p>
          </div>

          {/* Search form floats over hero */}
          <div className="-mb-16 sm:-mb-16 relative z-10">
            <SearchForm />
            <p className="text-center mt-4 text-sm text-emerald-100">
              Already booked?{" "}
              <Link href="/booking/lookup" className="underline hover:text-white font-medium">
                Find your ticket →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Spacer for overlapping card ────────────────────────────────── */}
      <div className="h-20 sm:h-20 bg-slate-50" />

      {/* ── Popular Routes ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Popular Routes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_ROUTES.map((route) => (
            <Link
              key={`${route.from}-${route.to}`}
              href={`/search?origin=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}&date=${new Date(Date.now() + 86400000).toISOString().split("T")[0]}`}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-md group transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span>{route.from}</span>
                    <span className="text-slate-300">→</span>
                    <span>{route.to}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{route.duration} · {route.price}</p>
                </div>
                <Bus className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-800 mb-10 text-center">How VAYO works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support strip ────────────────────────────────────────────────── */}
      <section className="bg-emerald-50 py-8 border-t border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-slate-600 text-sm">Need help with your booking?</span>
          <a
            href="https://wa.me/250784673536?text=Hi%2C+I+need+help+with+my+booking"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Chat with us on WhatsApp →
          </a>
        </div>
      </section>

      {/* ── Operator CTA ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Are you a bus operator?</h2>
            <p className="text-slate-400 text-sm max-w-md">
              Join VAYO and sell tickets online. Get a modern dashboard to manage your routes, schedules, and passengers.
            </p>
          </div>
          <Link
            href="/operator/register"
            className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
          >
            Register Your Company
          </Link>
        </div>
      </section>
    </>
  );
}
