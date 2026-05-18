const BADGE_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
  BOARDING:  "bg-amber-50 text-amber-700 border-amber-100",
  DEPARTED:  "bg-orange-50 text-orange-700 border-orange-100",
  ARRIVED:   "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-red-50 text-red-500 border-red-100",
};

export default function TripStatusBadge({ status }: { status: string }) {
  const styles = BADGE_STYLES[status] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles}`}>
      {status}
    </span>
  );
}
