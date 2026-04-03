import Link from "next/link";
import { Bus } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <Bus className="h-6 w-6 text-emerald-400" />
              VAYO
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Book intercity buses across Rwanda and East Africa. Fast, simple, and reliable.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Travel</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Search Buses</Link></li>
              <li><Link href="/account/bookings" className="hover:text-white">My Bookings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Operators</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/operator/register" className="hover:text-white">Register Your Company</Link></li>
              <li><Link href="/operator/dashboard" className="hover:text-white">Operator Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <p>© {new Date().getFullYear()} VAYO. All rights reserved.</p>
          <p className="text-slate-500">Built for Rwanda &amp; East Africa 🇷🇼</p>
        </div>
      </div>
    </footer>
  );
}
