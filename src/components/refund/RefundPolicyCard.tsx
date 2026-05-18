"use client";
import { CheckCircle2 } from "lucide-react";
import { RefundPolicyResponse } from "@/lib/types";

type Props = {
  policy: RefundPolicyResponse;
  acknowledged: boolean;
  onAcknowledged: () => void;
};

function tierColorClass(refundPct: number): string {
  if (refundPct === 100) return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (refundPct === 0) return "bg-amber-50 border-amber-200 text-amber-800";
  return "bg-slate-50 border-slate-200 text-slate-700";
}

function tierPctClass(refundPct: number): string {
  if (refundPct === 100) return "text-emerald-700 font-bold";
  if (refundPct === 0) return "text-amber-700 font-bold";
  return "text-slate-800 font-semibold";
}

export function RefundPolicyCard({ policy, acknowledged, onAcknowledged }: Props) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800">Cancellation &amp; Refund Policy</h3>
        <p className="text-xs text-slate-500 mt-0.5">Set by {policy.operatorName}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Refund tiers */}
        <div className="space-y-2">
          {policy.tiers.map((tier, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${tierColorClass(tier.refundPct)}`}
            >
              <span>{tier.label}</span>
              <span className={tierPctClass(tier.refundPct)}>
                {tier.refundPct}% refund
              </span>
            </div>
          ))}
        </div>

        {/* Platform rules */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Platform Rules</p>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              If operator cancels trip: 100% refund including service fee
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              If bus departs early without notice: 100% refund
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              Service fee is non-refundable on passenger-initiated cancellations
            </li>
          </ul>
        </div>

        {/* Acknowledgement checkbox */}
        <div className="pt-1 border-t border-slate-100">
          <label className={`flex items-start gap-3 ${acknowledged ? "cursor-default" : "cursor-pointer group"}`}>
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={acknowledged}
              onChange={(e) => { if (e.target.checked) onAcknowledged(); }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0 disabled:opacity-70"
            />
            <span className={`text-sm leading-snug select-none ${acknowledged ? "text-slate-500" : "text-slate-700 group-hover:text-slate-900"}`}>
              I understand and agree to this refund policy
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
