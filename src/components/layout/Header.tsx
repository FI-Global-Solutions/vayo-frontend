"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Bus, LogOut, LayoutDashboard, Ticket, ChevronDown } from "lucide-react";
import { getStoredUser, clearAuth } from "@/store/auth";
import { AuthUser } from "@/lib/types";
import { toast } from "sonner";

function getInitials(user: AuthUser) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

function avatarColor(role: string) {
  if (role === "OPERATOR_ADMIN") return "bg-violet-600";
  if (role === "ADMIN") return "bg-rose-600";
  return "bg-emerald-600";
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Re-sync user state on auth events (login / logout from any tab or page)
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener("vayo:auth", sync);
    return () => window.removeEventListener("vayo:auth", sync);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    toast.success("Logged out successfully");
    router.push("/");
  };

  const dashboardLink =
    user?.role === "OPERATOR_ADMIN" ? "/operator/dashboard"
    : user?.role === "ADMIN" ? "/admin/dashboard"
    : user?.role === "CONDUCTOR" ? "/conductor/dashboard"
    : "/account/bookings";

  const dashboardLabel =
    user?.role === "OPERATOR_ADMIN" ? "Operator Dashboard"
    : user?.role === "ADMIN" ? "Admin Dashboard"
    : user?.role === "CONDUCTOR" ? "Conductor Panel"
    : "My Bookings";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-emerald-600">
            <Bus className="h-7 w-7" />
            <span>VAYO</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
          </nav>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full ${avatarColor(user.role)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {getInitials(user)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.firstName} {user.lastName}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                    {/* User info */}
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      href={dashboardLink}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {dashboardLabel}
                    </Link>

                    {user.role === "TRAVELER" && (
                      <Link
                        href="/account/bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <Ticket className="h-4 w-4" />
                        My Tickets
                      </Link>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-700"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100">
            <Link href="/" className="block px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            {user ? (
              <>
                {/* Mobile user info */}
                <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100 mb-1">
                  <div className={`w-9 h-9 rounded-full ${avatarColor(user.role)} flex items-center justify-center text-white text-sm font-bold`}>
                    {getInitials(user)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <Link href={dashboardLink} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard className="h-4 w-4" />
                  {dashboardLabel}
                </Link>
                {user.role === "TRAVELER" && (
                  <Link href="/account/bookings" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <Ticket className="h-4 w-4" />
                    My Tickets
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-500 mt-1">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-2 text-sm text-slate-700" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/register" className="block px-2 py-2 text-sm font-medium text-emerald-600" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
