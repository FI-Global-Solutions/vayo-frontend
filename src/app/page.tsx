import SearchForm from "@/components/search/SearchForm";
import { Shield, Smartphone, Clock, MapPin, Sparkles, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";

const DESTINATIONS = [
  { city: "Kampala", country: "Uganda", emoji: "🇺🇬" },
  { city: "Nairobi", country: "Kenya", emoji: "🇰🇪" },
  { city: "Bujumbura", country: "Burundi", emoji: "🇧🇮" },
  { city: "Dar es Salaam", country: "Tanzania", emoji: "🇹🇿" },
  { city: "Butare", country: "Rwanda", emoji: "🇷🇼" },
  { city: "Gisenyi", country: "Rwanda", emoji: "🇷🇼" },
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

      {/* ── Where We Go ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">Where we go</h2>
            <p className="text-xs text-slate-500">Destinations served by our operators</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.city}
              className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm select-none"
            >
              <span className="text-3xl mb-2 block">{dest.emoji}</span>
              <p className="text-sm font-semibold text-slate-800">{dest.city}</p>
              <p className="text-xs text-slate-400 mt-0.5">{dest.country}</p>
            </div>
          ))}
        </div>

        {/* Coming soon banner */}
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">More routes launching soon</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                We're onboarding bus operators across East Africa. More cities and routes will appear here as operators join.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <Bell className="h-4 w-4 text-slate-400" />
            <Link
              href="/operator/register"
              className="text-xs text-emerald-700 font-semibold hover:underline whitespace-nowrap"
            >
              Add your routes →
            </Link>
          </div>
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-800 mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              {
                q: "How do I pay for my ticket?",
                a: "We accept MTN Mobile Money and Airtel Money. After selecting your seat you'll be prompted to enter your mobile number and confirm the payment on your phone.",
              },
              {
                q: "Will I get a ticket confirmation?",
                a: "Yes — as soon as your payment is confirmed you'll receive a QR-code ticket by SMS and email. Show it to the conductor when boarding; no printing needed.",
              },
              {
                q: "Can I cancel or change my booking?",
                a: "You can cancel your booking from the 'Find My Booking' page. Refunds are processed according to how far in advance you cancel — the closer to departure, the smaller the refund percentage.",
              },
              {
                q: "What if the bus is cancelled?",
                a: "If an operator cancels a trip, you automatically receive a full refund to your Mobile Money wallet within 24 hours.",
              },
              {
                q: "Do I need an account to book?",
                a: "No — you can book as a guest with just your phone number. Creating an account lets you view all your past bookings in one place.",
              },
              {
                q: "I haven't received my ticket — what do I do?",
                a: "Check your SMS and email spam folder first. If it's still missing, use the 'Find My Booking' page with your booking reference and phone number, or chat with us on WhatsApp.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                  <span className="text-sm font-semibold text-slate-800 pr-4">{q}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-3">Still have a question?</p>
            <a
              href="https://wa.me/250784673536?text=Hello+VAYO+Support%2C%0A%0AI+need+assistance+with+my+booking.+Could+you+please+help+me%3F%0A%0AThank+you."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Chat with us on WhatsApp →
            </a>
          </div>
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

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <p className="text-white font-bold text-lg mb-2">VAYO</p>
              <p className="text-xs leading-relaxed">
                Book bus tickets across East Africa. Real-time seats, Mobile Money payments, instant QR tickets.
              </p>
            </div>

            {/* Travellers */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Travellers</p>
              <ul className="space-y-2 text-xs">
                <li><Link href="/search" className="hover:text-emerald-400 transition-colors">Search buses</Link></li>
                <li><Link href="/booking/lookup" className="hover:text-emerald-400 transition-colors">Find my booking</Link></li>
                <li><Link href="/#faq" className="hover:text-emerald-400 transition-colors">FAQ</Link></li>
                <li>
                  <a
                    href="https://wa.me/250784673536?text=Hello+VAYO+Support%2C%0A%0AI+need+assistance+with+my+booking.+Could+you+please+help+me%3F%0A%0AThank+you."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    WhatsApp support
                  </a>
                </li>
              </ul>
            </div>

            {/* Operators */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Operators</p>
              <ul className="space-y-2 text-xs">
                <li><Link href="/operator/register" className="hover:text-emerald-400 transition-colors">Register your company</Link></li>
                <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Operator login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p>© {new Date().getFullYear()} VAYO. All rights reserved.</p>
            <p>Built for East Africa 🌍</p>
          </div>
        </div>
      </footer>
    </>
  );
}
