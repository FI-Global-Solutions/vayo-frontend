"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Route, Bus, Calendar, Users, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { operatorApi } from "@/lib/api";
import { OperatorDashboardStats } from "@/lib/types";

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

export default function OperatorDashboardPage() {
  const [stats, setStats] = useState<OperatorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    operatorApi.dashboard()
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { href: "/operator/trips", icon: Calendar, label: "Schedule Trip", desc: "Add a new trip" },
    { href: "/operator/routes", icon: Route, label: "Manage Routes", desc: "Add or edit routes" },
    { href: "/operator/buses", icon: Bus, label: "Manage Fleet", desc: "Add or edit buses" },
    { href: "/operator/conductors", icon: Users, label: "Conductors", desc: "Manage your field staff" },
  ];

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

      {/* Revenue card */}
      {stats && (
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
