"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2, Users, Route, Ticket, CheckCircle2,
  Clock, ShieldAlert, TrendingUp, Search, ChevronLeft, ChevronRight,
  FileText, X, IdCard, Award, ExternalLink, Loader2,
  MessageSquareWarning, XCircle, History,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { PlatformStats, OperatorAdminResponse, OperatorStatus, ApplicationHistoryItem } from "@/lib/types";
import { RequestInformationModal } from "@/components/admin/RequestInformationModal";
import { RejectOperatorModal } from "@/components/admin/RejectOperatorModal";

type StatusFilter = "ALL" | "PENDING" | "ACTIVE" | "SUSPENDED";
type MainTab = "operators" | "pending";

type OperatorDocument = {
  id: string;
  documentType: "NID_FRONT" | "NID_BACK" | "CERTIFICATE";
  fileName: string;
  contentType: string;
  data: string;
  uploadedAt: string;
};

const DOC_LABELS: Record<string, string> = {
  NID_FRONT: "NID — Front",
  NID_BACK: "NID — Back",
  CERTIFICATE: "Certificate",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:              "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE:               "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUSPENDED:            "bg-red-50 text-red-600 border-red-200",
  INFORMATION_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
  REJECTED:             "bg-red-50 text-red-700 border-red-200",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-RW", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

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

// ── Pending Review row ────────────────────────────────────────────────────────

interface PendingRowProps {
  op: OperatorAdminResponse;
  rfaCount: number | null;
  actioning: string | null;
  onApprove: (id: string) => void;
  onDocs: (op: OperatorAdminResponse) => void;
  onHistory: (op: OperatorAdminResponse) => void;
  onRfa: (op: OperatorAdminResponse) => void;
  onReject: (op: OperatorAdminResponse) => void;
}

function PendingRow({ op, rfaCount, actioning, onApprove, onDocs, onHistory, onRfa, onReject }: PendingRowProps) {
  const rfaDisabled = rfaCount !== null && rfaCount >= 3;
  const canRfa = op.status === "PENDING" || op.status === "INFORMATION_REQUIRED";

  return (
    <div className="px-5 py-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
        {(op.companyName ?? "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 text-sm truncate">{op.companyName}</p>
        <p className="text-xs text-slate-400 truncate">{op.contactEmail}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[op.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
          {op.status.replace("_", " ")}
        </span>
        {rfaCount !== null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rfaDisabled ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            RFA {rfaCount}/3
          </span>
        )}
      </div>

      <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
        <button
          type="button"
          onClick={() => onDocs(op)}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-1"
        >
          <FileText className="h-3 w-3" />
          Docs
        </button>
        <button
          type="button"
          onClick={() => onHistory(op)}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-1"
        >
          <History className="h-3 w-3" />
          History
        </button>
        {canRfa && (
          <button
            type="button"
            disabled={rfaDisabled || actioning === op.id}
            onClick={() => onRfa(op)}
            title={rfaDisabled ? "Maximum 3 RFAs reached" : "Request more information"}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageSquareWarning className="h-3 w-3" />
            Request Info
          </button>
        )}
        <button
          type="button"
          disabled={actioning === op.id}
          onClick={() => onApprove(op.id)}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          {actioning === op.id ? "..." : "Approve"}
        </button>
        <button
          type="button"
          disabled={actioning === op.id}
          onClick={() => onReject(op)}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 disabled:opacity-50"
        >
          <XCircle className="h-3 w-3" />
          Reject
        </button>
      </div>
    </div>
  );
}

// ── History modal ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  SUBMITTED:    { label: "Application submitted",       color: "bg-blue-500" },
  RESUBMITTED:  { label: "Application resubmitted",     color: "bg-blue-500" },
  APPROVED:     { label: "Application approved",        color: "bg-emerald-500" },
  SUSPENDED:    { label: "Account suspended",           color: "bg-red-500" },
  RFA_SENT:     { label: "Information requested",       color: "bg-amber-500" },
  REJECTED:     { label: "Application rejected",        color: "bg-red-600" },
  REACTIVATED:  { label: "Account reactivated",         color: "bg-emerald-500" },
};

function HistoryModal({ op, onClose }: { op: OperatorAdminResponse; onClose: () => void }) {
  const [history, setHistory] = useState<ApplicationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getApplicationHistory(op.id)
      .then((r) => {
        const items: ApplicationHistoryItem[] = r.data.data ?? [];
        setHistory(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, [op.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Application History</h2>
            <p className="text-xs text-slate-400 mt-0.5">{op.companyName}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 text-emerald-500 animate-spin" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No history found.</p>
          ) : (
            <div className="space-y-0">
              {history.map((item, i) => {
                const meta = ACTION_LABELS[item.action] ?? { label: item.action, color: "bg-slate-400" };
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${meta.color}`} />
                      {i < history.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1 mb-1" />}
                    </div>
                    <div className={`pb-5 ${i === history.length - 1 ? "pb-0" : ""}`}>
                      <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                      {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        {item.actorName !== "System" ? `by ${item.actorName} · ` : ""}
                        {fmt(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [operators, setOperators] = useState<OperatorAdminResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOps, setLoadingOps] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>(
    searchParams.get("tab") === "pending" ? "pending" : "operators"
  );

  // Pending review
  const [pendingReview, setPendingReview] = useState<OperatorAdminResponse[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingRfaCounts, setPendingRfaCounts] = useState<Record<string, number>>({});

  // Modals
  const [docsOperator, setDocsOperator] = useState<OperatorAdminResponse | null>(null);
  const [docs, setDocs] = useState<OperatorDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeDoc, setActiveDoc] = useState<OperatorDocument | null>(null);
  const [historyOperator, setHistoryOperator] = useState<OperatorAdminResponse | null>(null);
  const [rfaOperator, setRfaOperator] = useState<OperatorAdminResponse | null>(null);
  const [rejectOperator, setRejectOperator] = useState<OperatorAdminResponse | null>(null);

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

  const loadPendingReview = useCallback(() => {
    setLoadingPending(true);
    adminApi.getPendingReview()
      .then(async (r) => {
        const list: OperatorAdminResponse[] = r.data.data ?? [];
        setPendingReview(list);
        // Fetch rfaCount via application-history for each
        const counts: Record<string, number> = {};
        await Promise.allSettled(
          list.map(async (op) => {
            try {
              const h = await adminApi.getApplicationHistory(op.id);
              const items: ApplicationHistoryItem[] = h.data.data ?? [];
              counts[op.id] = items.filter((i) => i.action === "RFA_SENT").length;
            } catch {
              counts[op.id] = 0;
            }
          })
        );
        setPendingRfaCounts(counts);
      })
      .catch(() => toast.error("Failed to load pending review"))
      .finally(() => setLoadingPending(false));
  }, []);

  useEffect(() => {
    if (mainTab === "pending") loadPendingReview();
  }, [mainTab, loadPendingReview]);


  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await adminApi.approve(id);
      toast.success("Operator approved");
      setOperators((prev) => prev.map((o) => o.id === id ? { ...o, status: "ACTIVE" as OperatorStatus } : o));
      setPendingReview((prev) => prev.filter((o) => o.id !== id));
      setStats((prev) => prev ? { ...prev, pendingOperators: Math.max(0, prev.pendingOperators - 1), activeOperators: prev.activeOperators + 1 } : prev);
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
      setOperators((prev) => prev.map((o) => o.id === id ? { ...o, status: "SUSPENDED" as OperatorStatus } : o));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to suspend operator");
    } finally {
      setActioning(null);
    }
  };

  const openDocs = async (op: OperatorAdminResponse) => {
    setDocsOperator(op);
    setDocs([]);
    setActiveDoc(null);
    setLoadingDocs(true);
    try {
      const res = await adminApi.operatorDocuments(op.id);
      const list: OperatorDocument[] = res.data.data ?? [];
      setDocs(list);
      if (list.length > 0) setActiveDoc(list[0]);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocs(false);
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

      {/* Main tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMainTab("operators")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${mainTab === "operators" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              All Operators
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMainTab("pending")}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${mainTab === "pending" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pending Review
            {stats && stats.pendingOperators > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${mainTab === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                {stats.pendingOperators}
              </span>
            )}
          </button>
        </div>

        {/* ── All Operators tab ── */}
        {mainTab === "operators" && (
          <>
            <div className="px-5 py-3 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex gap-1">
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
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
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
                        {op.status.replace("_", " ")}
                      </span>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openDocs(op)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Docs
                        </button>
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
                {totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400">Page {page + 1} of {totalPages}</p>
                    <div className="flex gap-2">
                      <button type="button" aria-label="Previous page" disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                        <ChevronLeft className="h-4 w-4 text-slate-500" />
                      </button>
                      <button type="button" aria-label="Next page" disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Pending Review tab ── */}
        {mainTab === "pending" && (
          <>
            {loadingPending ? (
              <div className="p-6 space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : pendingReview.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-200" />
                <p className="text-sm font-medium text-slate-500">No operators pending review</p>
                <p className="text-xs mt-1">All applications have been processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingReview.map((op) => (
                  <PendingRow
                    key={op.id}
                    op={op}
                    rfaCount={pendingRfaCounts[op.id] ?? null}
                    actioning={actioning}
                    onApprove={handleApprove}
                    onDocs={openDocs}
                    onHistory={setHistoryOperator}
                    onRfa={setRfaOperator}
                    onReject={setRejectOperator}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Document Viewer Modal ── */}
      {docsOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {docsOperator.companyName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{docsOperator.companyName}</p>
                <p className="text-xs text-slate-400">Submitted documents</p>
              </div>
              <button type="button" aria-label="Close documents panel" onClick={() => setDocsOperator(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {loadingDocs ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="h-10 w-10 mb-3 text-slate-200" />
                <p className="text-sm font-medium">No documents submitted</p>
                <p className="text-xs mt-1">This operator did not upload any documents during registration.</p>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">
                <div className="w-48 flex-shrink-0 border-r border-slate-100 overflow-y-auto p-3 space-y-1">
                  {docs.map((doc) => {
                    const isNid = doc.documentType.startsWith("NID");
                    return (
                      <button key={doc.id} type="button" onClick={() => setActiveDoc(doc)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors flex items-center gap-2
                          ${activeDoc?.id === doc.id ? "bg-emerald-50 border border-emerald-200" : "hover:bg-slate-50 border border-transparent"}`}>
                        {isNid ? <IdCard className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" /> : <Award className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />}
                        <span className="text-xs font-medium text-slate-700 truncate">{DOC_LABELS[doc.documentType] ?? doc.documentType}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-auto p-4 flex flex-col">
                  {activeDoc && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{DOC_LABELS[activeDoc.documentType] ?? activeDoc.documentType}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{activeDoc.fileName}</p>
                        </div>
                        <a href={`data:${activeDoc.contentType};base64,${activeDoc.data}`} download={activeDoc.fileName}
                          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                      {activeDoc.contentType === "application/pdf" ? (
                        <iframe src={`data:application/pdf;base64,${activeDoc.data}`} title={activeDoc.fileName}
                          className="flex-1 w-full rounded-xl border border-slate-200 min-h-[400px]" />
                      ) : (
                        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`data:${activeDoc.contentType};base64,${activeDoc.data}`} alt={activeDoc.fileName}
                            className="max-w-full max-h-[500px] object-contain rounded-lg shadow" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {historyOperator && (
        <HistoryModal op={historyOperator} onClose={() => setHistoryOperator(null)} />
      )}

      {/* ── RFA Modal ── */}
      {rfaOperator && (
        <RequestInformationModal
          operatorId={rfaOperator.id}
          companyName={rfaOperator.companyName}
          onSuccess={() => {
            setRfaOperator(null);
            loadPendingReview();
          }}
          onClose={() => setRfaOperator(null)}
        />
      )}

      {/* ── Reject Modal ── */}
      {rejectOperator && (
        <RejectOperatorModal
          operatorId={rejectOperator.id}
          companyName={rejectOperator.companyName}
          onSuccess={() => {
            setRejectOperator(null);
            setPendingReview((prev) => prev.filter((o) => o.id !== rejectOperator.id));
            setStats((prev) => prev ? { ...prev, pendingOperators: Math.max(0, prev.pendingOperators - 1) } : prev);
          }}
          onClose={() => setRejectOperator(null)}
        />
      )}
    </div>
  );
}
