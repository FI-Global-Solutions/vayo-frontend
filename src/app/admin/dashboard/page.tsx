"use client";
import { useEffect, useState } from "react";
import {
  Building2, Users, Route, Ticket, CheckCircle2,
  Clock, ShieldAlert, TrendingUp, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { PlatformStats, OperatorAdminResponse } from "@/lib/types";

type StatusFilter = "ALL" | "PENDING" | "ACTIVE" | "SUSPENDED";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [operators, setOperators] = useState<OperatorAdminResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOps, setLoadingOps] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    adminApi.dashboard()
      .then((r) => setStats(r.data.data))
      .catch(() => toast.error("Failed to load platform stats"))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    setLoadingOps(true);
    const status = filter === "ALL" ? undefined : filter;
    adminApi.operators(status, page)
      .then((r) => {
        setOperators(r.data.data.content ?? []);
        setTotalPages(r.data.data.totalPages ?? 0);
      })
      .catch(() => toast.error("Failed to load operators"))
      .finally(() => setLoadingOps(false));
  }, [filter, page]);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await adminApi.approve(id);
      toast.success("Operator approved");
      setOperators((prev) => prev.map((o) => o.id === id ? { ...o, status: "ACTIVE" } : o));
      setStats((prev) => prev ? { ...prev, pendingOperators: prev.pendingOperators - 1, activeOperators: prev.activeOperators + 1 } : prev);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to approve operator");
    } finally {
      setActioning(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActioning(id);
    try {
      await adminApi.suspend(id);
      toast.success("Operator suspended");
      setOperators((prev) => prev.map((o) => o.id === id ? { ...o, status: "SUSPENDED" } : o));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to suspend operator");
    } finally {
      setActioning(null);
    }
  };

  const filtered = operators.filter((o) =>
    o.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    o.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and operator management</p>
      </div>

      {/* Stats grid */}
      {loadingStats ? (
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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard icon={Building2} label="Total Operators" value={stats.totalOperators} color="bg-violet-50 text-violet-600" />
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-50 text-blue-600" />
            <StatCard icon={Route} label="Total Trips" value={stats.totalTrips} color="bg-amber-50 text-amber-600" />
            <StatCard icon={Ticket} label="Total Bookings" value={stats.totalBookings} color="bg-emerald-50 text-emerald-600" />
          </div>
          {/* Operator status strip */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-amber-700">{stats.pendingOperators}</p>
                <p className="text-xs text-amber-600">Pending approval</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-emerald-700">{stats.activeOperators}</p>
                <p className="text-xs text-emerald-600">Active operators</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-200 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-white">{stats.confirmedBookings}</p>
                <p className="text-xs text-emerald-200">Confirmed bookings</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Operators table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Operators
          </h2>

          {/* Filter tabs */}
          <div className="flex gap-1 sm:ml-4">
            {(["ALL", "PENDING", "ACTIVE", "SUSPENDED"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setFilter(s); setPage(0); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operators..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
            />
          </div>
        </div>

        {loadingOps ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No operators found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {filtered.map((op) => (
                <div key={op.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {(op.companyName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{op.companyName}</p>
                    <p className="text-xs text-slate-400 truncate">{op.contactEmail}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_STYLES[op.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {op.status}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    {op.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={actioning === op.id}
                        onClick={() => handleApprove(op.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                      >
                        {actioning === op.id ? "..." : "Approve"}
                      </button>
                    )}
                    {op.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={actioning === op.id}
                        onClick={() => handleSuspend(op.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50"
                      >
                        {actioning === op.id ? "..." : "Suspend"}
                      </button>
                    )}
                    {op.status === "SUSPENDED" && (
                      <button
                        type="button"
                        disabled={actioning === op.id}
                        onClick={() => handleApprove(op.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50"
                      >
                        {actioning === op.id ? "..." : "Reactivate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
