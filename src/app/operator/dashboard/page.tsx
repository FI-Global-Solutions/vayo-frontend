"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Route, Bus, Calendar, Users, TrendingUp, ArrowRight, Clock, Banknote } from "lucide-react";
import { operatorApi, payoutApi } from "@/lib/api";
import { OperatorDashboardStats, UserRole, PayoutBalance } from "@/lib/types";
import { getStoredUser } from "@/store/auth";

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

const ALL_QUICK_LINKS = [
  { href: "/operator/trips",   icon: Calendar, label: "Schedule Trip",   desc: "Add a new trip",          roles: ["OPERATOR_SUPER_ADMIN", "OPERATOR_ADMIN", "DISPATCHER"] },
  { href: "/operator/routes",  icon: Route,    label: "Manage Routes",   desc: "Add or edit routes",       roles: ["OPERATOR_SUPER_ADMIN", "OPERATOR_ADMIN"] },
  { href: "/operator/buses",   icon: Bus,      label: "Manage Fleet",    desc: "Add or edit buses",        roles: ["OPERATOR_SUPER_ADMIN", "OPERATOR_ADMIN"] },
  { href: "/operator/team",    icon: Users,    label: "Team",            desc: "Manage staff accounts",    roles: ["OPERATOR_SUPER_ADMIN", "OPERATOR_ADMIN"] },
];

export default function OperatorDashboardPage() {
  const [stats, setStats] = useState<OperatorDashboardStats | null>(null);
  const [balance, setBalance] = useState<PayoutBalance | null | "error">(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    const storedRole = getStoredUser()?.role as UserRole | undefined;
    setRole(storedRole);

    operatorApi.dashboard()
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));

    if (storedRole === "OPERATOR_SUPER_ADMIN" || storedRole === "OPERATOR_ADMIN" || storedRole === "ACCOUNTANT") {
      payoutApi.getBalance()
        .then((r) => setBalance(r.data.data))
        .catch(() => setBalance("error"));
    }
  }, []);

  const quickLinks = ALL_QUICK_LINKS.filter(
    (l) => !role || l.roles.includes(role)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Operator Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your routes, buses, and trips</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-xl mb-3" />
              <div className="h-7 bg-slate-200 rounded w-16 mb-1" />
              <div className="h-3 bg-slate-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Route} label="Active Routes" value={stats.totalRoutes} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Bus} label="Active Buses" value={stats.totalBuses} color="bg-purple-50 text-purple-600" />
          <StatCard icon={Clock} label="Upcoming Trips" value={stats.upcomingTrips} color="bg-amber-50 text-amber-600" />
          <StatCard icon={Users} label="Bookings (30d)" value={stats.totalConfirmedBookings} color="bg-emerald-50 text-emerald-600" />
        </div>
      )}

      {/* Revenue card — visible to owners, admins, and accountants */}
      {stats && (role === "OPERATOR_SUPER_ADMIN" || role === "OPERATOR_ADMIN" || role === "ACCOUNTANT") && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100">Your Revenue (30 days)</p>
              <p className="text-3xl font-extrabold mt-1">
                {stats.totalRevenue.toLocaleString()} <span className="text-xl font-normal text-emerald-200">RWF</span>
              </p>
              <p className="text-xs text-emerald-200 mt-1">
                Gross: {stats.totalGrossRevenue.toLocaleString()} RWF
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-emerald-300" />
          </div>
        </div>
      )}

      {/* Available balance card */}
      {(role === "OPERATOR_SUPER_ADMIN" || role === "OPERATOR_ADMIN" || role === "ACCOUNTANT") && (
        <Link href="/operator/payouts" className="block mb-8 group">
          <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-100">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Available Balance</p>
                <p className="text-xl font-bold text-slate-900">
                  {balance === null
                    ? <span className="inline-block w-20 h-5 bg-slate-200 rounded animate-pulse" />
                    : balance === "error"
                    ? "--"
                    : `${(balance as PayoutBalance).availableAmountRwf.toLocaleString()} RWF`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium group-hover:gap-3 transition-all">
              View Payouts <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      )}

      {/* Quick links */}
      <h2 className="font-semibold text-slate-700 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100">
                <link.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{link.label}</p>
                <p className="text-xs text-slate-400">{link.desc}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
