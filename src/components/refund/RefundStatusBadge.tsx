import { RefundStatus } from "@/lib/types";

const BADGE: Record<RefundStatus, { label: string; styles: string }> = {
  AWAITING_APPROVAL: { label: "Awaiting Review",  styles: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED:          { label: "Approved",          styles: "bg-blue-50 text-blue-700 border-blue-200" },
  PENDING:           { label: "Processing",        styles: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCESSING:        { label: "Processing",        styles: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED:         { label: "Refunded",          styles: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FAILED:            { label: "Failed",            styles: "bg-orange-50 text-orange-700 border-orange-200" },
  REJECTED:          { label: "Rejected",          styles: "bg-red-50 text-red-600 border-red-200" },
};

export default function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const cfg = BADGE[status] ?? { label: status, styles: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.styles}`}>
      {cfg.label}
    </span>
  );
}
