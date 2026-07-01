"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Ticket, ChevronDown, RefreshCw, Banknote, ShieldCheck, RotateCcw, Settings2, SlidersHorizontal, Bell, Building2, Loader2 } from "lucide-react";
import { getStoredUser, clearAuth } from "@/store/auth";
import { AuthUser, AdminNotification } from "@/lib/types";
import { VayoLogo } from "@/components/ui/VayoLogo";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

function getInitials(user: AuthUser) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

function avatarColor(role: string) {
  if (role === "OPERATOR_SUPER_ADMIN") return "bg-violet-700";
  if (role === "OPERATOR_ADMIN")       return "bg-violet-500";
  if (role === "DISPATCHER")           return "bg-blue-600";
  if (role === "ACCOUNTANT")           return "bg-amber-600";
  if (role === "ADMIN")                return "bg-rose-600";
  return "bg-emerald-600";
}

const NOTIF_ICONS: Record<string, string> = {
  OPERATOR_APPLIED:    "🏢",
  OPERATOR_RESUBMITTED:"📋",
  PAYOUT_REQUESTED:    "💳",
  REFUND_ESCALATED:    "↩️",
};

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Re-sync user state on auth events (login / logout from any tab or page)
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener("vayo:auth", sync);
    return () => window.removeEventListener("vayo:auth", sync);
  }, []);

  // Poll unread notification count every 60s for ADMIN users
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const fetch = () => {
      adminApi.getUnreadCount()
        .then((r) => setUnreadCount(r.data.data ?? 0))
        .catch(() => { /* silent */ });
    };
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [user?.role]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openBell = async () => {
    setBellOpen((o) => !o);
    if (bellOpen) return;
    setLoadingNotifs(true);
    try {
      const res = await adminApi.getNotifications();
      const list: AdminNotification[] = res.data.data ?? [];
      setNotifications(list);
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotifClick = async (n: AdminNotification) => {
    setBellOpen(false);
    if (!n.isRead) {
      adminApi.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
    }
    // Route to the relevant section based on type
    if (n.type === "OPERATOR_APPLIED" || n.type === "OPERATOR_RESUBMITTED") {
      router.push("/admin/dashboard?tab=pending");
    } else if (n.type === "PAYOUT_REQUESTED") {
      router.push("/admin/payouts");
    } else if (n.type === "REFUND_ESCALATED") {
      router.push("/admin/refunds");
    } else {
      router.push("/admin/dashboard");
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    toast.success("Logged out successfully");
    router.push("/");
  };

  const isOperatorStaff = ["OPERATOR_SUPER_ADMIN", "OPERATOR_ADMIN", "DISPATCHER", "ACCOUNTANT"].includes(user?.role ?? "");

  const dashboardLink =
    user?.role === "ADMIN"    ? "/admin/dashboard"
    : isOperatorStaff         ? "/operator/dashboard"
    : user?.role === "CONDUCTOR" ? "/conductor/trips"
    : "/account/bookings";

  const dashboardLabel =
    user?.role === "ADMIN"                ? "Admin Dashboard"
    : user?.role === "OPERATOR_SUPER_ADMIN" ? "Owner Dashboard"
    : user?.role === "OPERATOR_ADMIN"     ? "Operator Dashboard"
    : user?.role === "DISPATCHER"         ? "Dispatcher Dashboard"
    : user?.role === "ACCOUNTANT"         ? "Finance Dashboard"
    : user?.role === "CONDUCTOR"          ? "Conductor Panel"
    : "My Bookings";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <VayoLogo height={64} />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            {!user && (
              <Link href="/booking/lookup" className="hover:text-emerald-600">Find My Booking</Link>
            )}
            <Link href="/#faq" className="hover:text-emerald-600">FAQ</Link>
          </nav>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user?.role === "ADMIN" && (
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  title="Notifications"
                  onClick={openBell}
                  className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">Notifications</p>
                      <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setBellOpen(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {loadingNotifs ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                            >
                              <span className="text-base flex-shrink-0 mt-0.5">
                                {NOTIF_ICONS[n.type] ?? "🔔"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-snug ${!n.isRead ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                                  {n.message}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{fmtRelative(n.createdAt)}</p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="border-t border-slate-100 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => { setBellOpen(false); router.push("/admin/dashboard?tab=pending"); }}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        View pending review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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

                    {(user.role === "OPERATOR_ADMIN" || user.role === "OPERATOR_SUPER_ADMIN") && (
                      <Link
                        href="/operator/refunds"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refund Requests
                      </Link>
                    )}

                    {(user.role === "OPERATOR_ADMIN" || user.role === "OPERATOR_SUPER_ADMIN") && (
                      <Link
                        href="/operator/payouts"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <Banknote className="h-4 w-4" />
                        Payouts
                      </Link>
                    )}

                    {(user.role === "OPERATOR_SUPER_ADMIN" || user.role === "OPERATOR_ADMIN") && (
                      <Link
                        href="/operator/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Settings
                      </Link>
                    )}

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/payouts"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Payout Approvals
                      </Link>
                    )}

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/refunds"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Refund Management
                      </Link>
                    )}

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/config"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <Settings2 className="h-4 w-4" />
                        Platform Config
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
                {(user.role === "OPERATOR_ADMIN" || user.role === "OPERATOR_SUPER_ADMIN") && (
                  <Link href="/operator/refunds" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <RefreshCw className="h-4 w-4" />
                    Refund Requests
                  </Link>
                )}
                {(user.role === "OPERATOR_ADMIN" || user.role === "OPERATOR_SUPER_ADMIN") && (
                  <Link href="/operator/payouts" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <Banknote className="h-4 w-4" />
                    Payouts
                  </Link>
                )}
                {(user.role === "OPERATOR_SUPER_ADMIN" || user.role === "OPERATOR_ADMIN") && (
                  <Link href="/operator/settings" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <SlidersHorizontal className="h-4 w-4" />
                    Settings
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/admin/payouts" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <ShieldCheck className="h-4 w-4" />
                    Payout Approvals
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/admin/refunds" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <RotateCcw className="h-4 w-4" />
                    Refund Management
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/admin/config" className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:text-emerald-600" onClick={() => setMenuOpen(false)}>
                    <Settings2 className="h-4 w-4" />
                    Platform Config
                  </Link>
                )}
                <Link href="/#faq" className="block px-2 py-2 text-sm text-slate-700" onClick={() => setMenuOpen(false)}>FAQ</Link>
                <button type="button" onClick={handleLogout} className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-500 mt-1">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/booking/lookup" className="block px-2 py-2 text-sm text-slate-700" onClick={() => setMenuOpen(false)}>Find My Booking</Link>
                <Link href="/login" className="block px-2 py-2 text-sm text-slate-700" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/register" className="block px-2 py-2 text-sm font-medium text-emerald-600" onClick={() => setMenuOpen(false)}>Sign up</Link>
                <Link href="/#faq" className="block px-2 py-2 text-sm text-slate-700" onClick={() => setMenuOpen(false)}>FAQ</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
