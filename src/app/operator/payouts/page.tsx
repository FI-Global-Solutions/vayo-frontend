"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp, Clock, Wallet, Banknote, ChevronDown, ChevronUp,
  Loader2, AlertCircle, CheckCircle2, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { payoutApi } from "@/lib/api";
import {
  PayoutBalance, PayoutAccount, PayoutSummary, PayoutStatus, PageResponse,
} from "@/lib/types";
import PayoutStatusBadge from "@/components/payouts/PayoutStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRwf(n: number) {
  return n.toLocaleString() + " RWF";
}

function fmtDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy");
}

function fmtDateTime(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

function maskAccount(num: string) {
  if (num.length <= 4) return num;
  return "****" + num.slice(-4);
}

// ─── Balance cards ────────────────────────────────────────────────────────────

function BalanceCard({
  icon: Icon, label, value, subtitle, iconColor, dimmed = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
  dimmed?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 transition-opacity ${dimmed ? "border-slate-100 opacity-60" : "border-slate-200"}`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Payout account form ──────────────────────────────────────────────────────

function PayoutAccountSection({
  account, onSaved,
}: {
  account: PayoutAccount | null;
  onSaved: (a: PayoutAccount) => void;
}) {
  const [editing, setEditing] = useState(!account);
  const [type, setType] = useState<"MOMO_BUSINESS" | "BANK_TRANSFER">(
    account?.accountType ?? "MOMO_BUSINESS"
  );
  const [num, setNum]   = useState(account?.accountNumber ?? "");
  const [name, setName] = useState(account?.accountName ?? "");
  const [bank, setBank] = useState(account?.bankName ?? "");
  const [code, setCode] = useState(account?.bankCode ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!num.trim() || !name.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {
        accountType: type,
        accountNumber: num.trim(),
        accountName: name.trim(),
      };
      if (type === "BANK_TRANSFER") {
        if (bank.trim()) body.bankName = bank.trim();
        if (code.trim()) body.bankCode = code.trim();
      }
      const r = await payoutApi.updatePayoutAccount(body);
      const saved: PayoutAccount = r.data.data;
      onSaved(saved);
      setEditing(false);
      toast.success("Payout account saved");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800">Payout Account</h2>
        {account && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Read-only view */}
      {account && !editing && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Type</p>
              <p className="font-semibold text-slate-800">
                {account.accountType === "MOMO_BUSINESS" ? "MoMo Business" : "Bank Transfer"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Account number</p>
              <p className="font-semibold text-slate-800 font-mono">{maskAccount(account.accountNumber)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Account name</p>
              <p className="font-semibold text-slate-800">{account.accountName}</p>
            </div>
            {account.bankName && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Bank</p>
                <p className="font-semibold text-slate-800">{account.bankName}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {account.isVerified ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                Pending Verification
              </span>
            )}
            {!account.isVerified && (
              <p className="text-xs text-slate-400">VAYO will verify your account before your first payout</p>
            )}
          </div>
        </div>
      )}

      {/* No account yet */}
      {!account && !editing && (
        <p className="text-sm text-slate-500">Set up your payout account to receive payments.</p>
      )}

      {/* Edit / create form */}
      {editing && (
        <div className="space-y-4">
          {account && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Changing your account details will require re-verification by VAYO.
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account type</label>
            <div className="flex gap-2">
              {(["MOMO_BUSINESS", "BANK_TRANSFER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    type === t
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t === "MOMO_BUSINESS" ? "MoMo Business" : "Bank Transfer"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {type === "MOMO_BUSINESS" ? "Phone number" : "Account number"}
            </label>
            <input
              type="text"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              placeholder={type === "MOMO_BUSINESS" ? "+250 7XX XXX XXX" : "Account number"}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Registered account name"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {type === "BANK_TRANSFER" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank name</label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="e.g. Bank of Kigali"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank code (optional)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SWIFT / sort code"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            {account && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !num.trim() || !name.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payout detail modal ──────────────────────────────────────────────────────

function PayoutDetailModal({
  payout, onClose,
}: {
  payout: PayoutSummary;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 font-mono">{payout.payoutReference}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{fmtRwf(payout.amountRwf)}</p>
          </div>
          <PayoutStatusBadge status={payout.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Bookings</p>
            <p className="font-semibold text-slate-800 mt-0.5">{payout.bookingCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Requested</p>
            <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(payout.requestedAt)}</p>
          </div>
          {payout.periodFrom && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Period from</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDate(payout.periodFrom)}</p>
            </div>
          )}
          {payout.periodTo && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Period to</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDate(payout.periodTo)}</p>
            </div>
          )}
          {payout.reviewedAt && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Reviewed</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(payout.reviewedAt)}</p>
            </div>
          )}
          {payout.processedAt && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Processed</p>
              <p className="font-semibold text-slate-800 mt-0.5">{fmtDateTime(payout.processedAt)}</p>
            </div>
          )}
        </div>

        {payout.status === "REJECTED" && payout.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
            <p className="text-xs font-semibold mb-0.5">Rejection reason</p>
            {payout.rejectionReason}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OperatorPayoutsPage() {
  const [balance, setBalance]     = useState<PayoutBalance | null>(null);
  const [account, setAccount]     = useState<PayoutAccount | null | undefined>(undefined); // undefined = not yet loaded
  const [payouts, setPayouts]     = useState<PayoutSummary[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage]           = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [selected, setSelected]   = useState<PayoutSummary | null>(null);

  // Payout request flow
  const [showRequest, setShowRequest] = useState(false);
  const [requesting, setRequesting]   = useState(false);
  const [requestError, setRequestError] = useState("");

  const loadBalance = useCallback(() => {
    setBalanceLoading(true);
    payoutApi.getBalance()
      .then((r) => setBalance(r.data.data))
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, []);

  const loadHistory = useCallback((p = 0) => {
    setHistoryLoading(true);
    payoutApi.getPayouts(p)
      .then((r) => {
        const data: PageResponse<PayoutSummary> = r.data.data;
        setPayouts(data.content ?? []);
        setHasMore(!data.last);
        setPage(data.page ?? p);
      })
      .catch(() => setPayouts([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadBalance();
    loadHistory(0);
    payoutApi.getPayoutAccount()
      .then((r) => setAccount(r.data.data ?? null))
      .catch(() => setAccount(null));
  }, [loadBalance, loadHistory]);

  const handleRequestPayout = async () => {
    setRequesting(true);
    setRequestError("");
    try {
      await payoutApi.requestPayout();
      setShowRequest(false);
      toast.success("Payout request submitted — VAYO will process within 2-3 business days");
      loadBalance();
      loadHistory(0);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to request payout";
      if (msg.toLowerCase().includes("minimum") || msg.toLowerCase().includes("5000")) {
        setRequestError("Minimum payout is 5,000 RWF");
      } else if (msg.toLowerCase().includes("account") || msg.toLowerCase().includes("verified")) {
        setRequestError("Please set up your payout account first");
      } else {
        setRequestError(msg);
      }
      setShowRequest(false);
    } finally {
      setRequesting(false);
    }
  };

  const canRequest = balance
    ? balance.availableAmountRwf >= 5000 && balance.inPayoutAmountRwf === 0
    : false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-500 text-sm mt-1">Your earnings balance and payout history</p>
      </div>

      {/* ── Balance cards ───────────────────────────────────────────────────── */}
      {balanceLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-xl mb-3" />
              <div className="h-7 bg-slate-200 rounded w-24 mb-1" />
              <div className="h-3 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : balance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <BalanceCard
            icon={Wallet}
            label="Available to Request"
            value={fmtRwf(balance.availableAmountRwf)}
            subtitle={`${balance.bookingCount} bookings from arrived trips`}
            iconColor="bg-emerald-50 text-emerald-600"
          />
          <BalanceCard
            icon={Clock}
            label="Pending (Trips Not Departed)"
            value={fmtRwf(balance.pendingAmountRwf)}
            subtitle="Will become available after trips depart"
            iconColor="bg-blue-50 text-blue-600"
            dimmed={balance.pendingAmountRwf === 0}
          />
          <BalanceCard
            icon={Banknote}
            label="In Active Payout"
            value={fmtRwf(balance.inPayoutAmountRwf)}
            subtitle="Currently being processed"
            iconColor={balance.inPayoutAmountRwf > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}
            dimmed={balance.inPayoutAmountRwf === 0}
          />
          <BalanceCard
            icon={TrendingUp}
            label="Total Earned (Lifetime)"
            value={fmtRwf(balance.totalEarnedRwf)}
            iconColor="bg-slate-100 text-slate-500"
          />
        </div>
      )}

      {/* ── Request payout ──────────────────────────────────────────────────── */}
      {balance && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          {requestError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {requestError}
              {requestError.includes("account") && (
                <button
                  type="button"
                  onClick={() => { setRequestError(""); document.getElementById("payout-account")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="underline ml-1 font-medium hover:text-red-900"
                >
                  Set up account
                </button>
              )}
            </div>
          )}

          {canRequest ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-slate-800">
                  {fmtRwf(balance.availableAmountRwf)} available
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {balance.bookingCount} bookings · VAYO processes within 2-3 business days
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequest(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-colors"
              >
                <Banknote className="h-4 w-4" />
                Request Payout of {fmtRwf(balance.availableAmountRwf)}
              </button>
            </div>
          ) : balance.inPayoutAmountRwf > 0 ? (
            <p className="text-sm text-slate-500">
              A payout request is currently being reviewed.{" "}
              <span className="font-medium text-slate-700">{fmtRwf(balance.inPayoutAmountRwf)}</span> is in progress.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Minimum payout is 5,000 RWF. Current available:{" "}
              <span className="font-medium text-slate-700">{fmtRwf(balance.availableAmountRwf)}</span>.
            </p>
          )}
        </div>
      )}

      {/* ── Payout account ──────────────────────────────────────────────────── */}
      <div id="payout-account" className="mb-6">
        {account !== undefined && (
          <PayoutAccountSection account={account} onSaved={setAccount} />
        )}
      </div>

      {/* ── Payout history ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <p className="text-sm font-bold text-slate-800">Payout History</p>
          {historyOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {historyOpen && (
          <>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
              </div>
            ) : payouts.length === 0 ? (
              <div className="px-5 pb-8 pt-2 text-center">
                <Banknote className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No payout requests yet</p>
              </div>
            ) : (
              <>
                {/* Table header — desktop */}
                <div className="hidden sm:grid grid-cols-6 gap-2 px-5 py-2 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <span className="col-span-2">Reference / Period</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Bookings</span>
                  <span>Status</span>
                  <span>Requested</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {payouts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p)}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors group"
                    >
                      {/* Mobile layout */}
                      <div className="sm:hidden flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-700">{p.payoutReference}</p>
                          <p className="text-lg font-bold text-slate-900 mt-0.5">{fmtRwf(p.amountRwf)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.requestedAt)} · {p.bookingCount} bookings</p>
                        </div>
                        <PayoutStatusBadge status={p.status} />
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden sm:grid grid-cols-6 gap-2 items-center">
                        <div className="col-span-2">
                          <p className="font-mono text-xs font-bold text-slate-700 group-hover:text-emerald-600">{p.payoutReference}</p>
                          {p.periodFrom && p.periodTo && (
                            <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.periodFrom)} – {fmtDate(p.periodTo)}</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 text-right">{fmtRwf(p.amountRwf)}</p>
                        <p className="text-sm text-slate-500 text-right">{p.bookingCount}</p>
                        <PayoutStatusBadge status={p.status} />
                        <p className="text-xs text-slate-400">{fmtDate(p.requestedAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={page === 0 || historyLoading}
                    onClick={() => loadHistory(page - 1)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-400">Page {page + 1}</span>
                  <button
                    type="button"
                    disabled={!hasMore || historyLoading}
                    onClick={() => loadHistory(page + 1)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Payout request confirmation ─────────────────────────────────────── */}
      {balance && (
        <ConfirmDialog
          isOpen={showRequest}
          title="Request Payout"
          message={`Request payout of ${fmtRwf(balance.availableAmountRwf)} covering ${balance.bookingCount} booking${balance.bookingCount !== 1 ? "s" : ""}? VAYO will review and process within 2-3 business days.`}
          confirmLabel="Request Payout"
          confirmVariant="primary"
          onConfirm={handleRequestPayout}
          onCancel={() => setShowRequest(false)}
          isLoading={requesting}
        />
      )}

      {/* ── Payout detail modal ─────────────────────────────────────────────── */}
      {selected && (
        <PayoutDetailModal payout={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
