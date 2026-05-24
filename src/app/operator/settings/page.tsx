"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Info, CheckCircle2, Settings } from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import {
  OperatorRefundPolicyData, OperatorPricingInputsData,
  RefundPolicyResponse,
} from "@/lib/types";
import { RefundPolicyCard } from "@/components/refund/RefundPolicyCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(iso: string | undefined) {
  if (!iso) return null;
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

function pct(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function pos(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) || n <= 0 ? null : n;
}

// ─── Shared section wrapper ───────────────────────────────────────────────────

function Section({
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Refund Policy section ────────────────────────────────────────────────────

const TIER_LABELS = [
  { key: "over48hRefundPct",   label: "More than 48 hours",  sublabel: "Platform minimum: 60%" },
  { key: "h24To48hRefundPct",  label: "24 – 48 hours",       sublabel: "" },
  { key: "h12To24hRefundPct",  label: "12 – 24 hours",       sublabel: "" },
  { key: "h4To12hRefundPct",   label: "4 – 12 hours",        sublabel: "" },
  { key: "under4hRefundPct",   label: "Under 4 hours",       sublabel: "Typically 0%" },
] as const;

type PolicyKey = typeof TIER_LABELS[number]["key"];

function buildPreviewPolicy(
  fields: Record<PolicyKey, string>,
  operatorName: string,
): RefundPolicyResponse {
  const safe = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };
  return {
    operatorName,
    tiers: [
      { label: "More than 48 hours before departure", refundPct: safe(fields.over48hRefundPct),  hoursThreshold: 48 },
      { label: "24 – 48 hours before departure",      refundPct: safe(fields.h24To48hRefundPct), hoursThreshold: 24 },
      { label: "12 – 24 hours before departure",      refundPct: safe(fields.h12To24hRefundPct), hoursThreshold: 12 },
      { label: "4 – 12 hours before departure",       refundPct: safe(fields.h4To12hRefundPct),  hoursThreshold: 4  },
      { label: "Less than 4 hours before departure",  refundPct: safe(fields.under4hRefundPct),   hoursThreshold: null },
    ],
    platformRules: {
      operatorCancelledFullRefund: true,
      earlyDepartureFullRefund: true,
      serviceFeeNonRefundable: true,
    },
    policyVersion: 0,
    effectiveFrom: new Date().toISOString(),
  };
}

function RefundPolicySection() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [meta, setMeta]         = useState<Pick<OperatorRefundPolicyData, "policyVersion" | "effectiveFrom" | "operatorCustomPolicy"> | null>(null);
  const [operatorName, setOperatorName] = useState("Your Company");

  const [fields, setFields] = useState<Record<PolicyKey, string>>({
    over48hRefundPct:  "",
    h24To48hRefundPct: "",
    h12To24hRefundPct: "",
    h4To12hRefundPct:  "",
    under4hRefundPct:  "",
  });

  const set = (key: PolicyKey) => (v: string) =>
    setFields((prev) => ({ ...prev, [key]: v }));

  useEffect(() => {
    Promise.all([
      operatorApi.getRefundPolicy(),
      operatorApi.me(),
    ]).then(([policyRes, meRes]) => {
      const p: OperatorRefundPolicyData = policyRes.data.data;
      setMeta({ policyVersion: p.policyVersion, effectiveFrom: p.effectiveFrom, operatorCustomPolicy: p.operatorCustomPolicy });
      setFields({
        over48hRefundPct:  String(p.over48hRefundPct),
        h24To48hRefundPct: String(p.h24To48hRefundPct),
        h12To24hRefundPct: String(p.h12To24hRefundPct),
        h4To12hRefundPct:  String(p.h4To12hRefundPct),
        under4hRefundPct:  String(p.under4hRefundPct),
      });
      setOperatorName(meRes.data.data?.companyName ?? "Your Company");
    })
    .catch(() => toast.error("Failed to load refund policy"))
    .finally(() => setLoading(false));
  }, []);

  // Validation
  const over48Val = pct(fields.over48hRefundPct);
  const allVals: (number | null)[] = TIER_LABELS.map((t) => pct(fields[t.key]));
  const over48Error = over48Val != null && over48Val < 60 ? "Must be ≥ 60%" : null;
  const rangeError  = allVals.some((v) => v != null && (v < 0 || v > 100)) ? "All values must be 0–100" : null;
  const anyEmpty    = allVals.some((v) => v === null);
  const canSave     = !anyEmpty && !over48Error && !rangeError;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const r = await operatorApi.updateRefundPolicy({
        over48hRefundPct:  over48Val!,
        h24To48hRefundPct: pct(fields.h24To48hRefundPct)!,
        h12To24hRefundPct: pct(fields.h12To24hRefundPct)!,
        h4To12hRefundPct:  pct(fields.h4To12hRefundPct)!,
        under4hRefundPct:  pct(fields.under4hRefundPct)!,
      });
      const updated: OperatorRefundPolicyData = r.data.data;
      setMeta({ policyVersion: updated.policyVersion, effectiveFrom: updated.effectiveFrom, operatorCustomPolicy: updated.operatorCustomPolicy });
      toast.success(`Refund policy saved — v${updated.policyVersion}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save refund policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Section title="Refund Policy" subtitle="Configure cancellation refund percentages for your passengers">
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </Section>
    );
  }

  const preview = buildPreviewPolicy(fields, operatorName);

  return (
    <Section
      title="Refund Policy"
      subtitle={meta?.operatorCustomPolicy
        ? `Custom policy · v${meta.policyVersion}${meta.effectiveFrom ? ` · active since ${fmtTs(meta.effectiveFrom)}` : ""}`
        : "Currently using platform default policy"}
    >
      {!meta?.operatorCustomPolicy && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2 text-sm text-blue-700">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>You are using the platform default policy. Save a custom policy to override it for your passengers.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Refund % by cancellation time
          </p>
          <div className="space-y-2">
            {TIER_LABELS.map((tier) => {
              const val = pct(fields[tier.key]);
              const isOver48 = tier.key === "over48hRefundPct";
              const fieldError = isOver48 && over48Error ? over48Error
                : (val != null && (val < 0 || val > 100)) ? "0–100 only"
                : null;
              return (
                <div key={tier.key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{tier.label}</p>
                    {tier.sublabel && <p className="text-xs text-slate-400">{tier.sublabel}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={fields[tier.key]}
                      onChange={(e) => set(tier.key)(e.target.value)}
                      className={`w-20 text-right px-3 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldError ? "border-red-400 bg-red-50" : "border-slate-200"
                      }`}
                    />
                    <span className="text-sm text-slate-400 w-4">%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {(over48Error || rangeError) && (
            <p className="text-xs text-red-600 mt-3">{over48Error ?? rangeError}</p>
          )}

          {/* Non-negotiable rules */}
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">Platform rules — always enforced</p>
            <ul className="space-y-1.5">
              {[
                "Operator cancels trip: 100% refund incl. service fee",
                "Bus departs early without notice: 100% refund",
                "Passenger cancellations: service fee non-refundable",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Refund Policy
          </button>
        </div>

        {/* Live preview */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Live Preview — passenger view
          </p>
          <RefundPolicyCard
            policy={preview}
            acknowledged={false}
            onAcknowledged={() => {}}
          />
        </div>
      </div>
    </Section>
  );
}

// ─── Pricing Inputs section ───────────────────────────────────────────────────

interface PricingField {
  key: keyof Omit<OperatorPricingInputsData, "updatedAt" | "isCustom">;
  label: string;
  unit: string;
  helper: string;
  defaultVal: string;
  step: string;
}

const PRICING_FIELDS: PricingField[] = [
  {
    key: "fuelConsumptionLPer100Km",
    label: "Fuel consumption",
    unit: "L / 100 km",
    helper: "Average litres your buses consume per 100 km. System default: 25 L.",
    defaultVal: "25",
    step: "0.5",
  },
  {
    key: "targetOccupancyPct",
    label: "Target occupancy",
    unit: "%",
    helper: "Expected seat fill rate per trip (1–100%). Used to calculate per-seat cost. Default: 75%.",
    defaultVal: "75",
    step: "1",
  },
  {
    key: "operatorMarginPct",
    label: "Operator margin",
    unit: "%",
    helper: "Profit margin added on top of breakeven cost (0–200%). Default: 25%.",
    defaultVal: "25",
    step: "1",
  },
  {
    key: "maintenanceCostPerKm",
    label: "Maintenance cost",
    unit: "RWF / km",
    helper: "Vehicle wear and maintenance cost per kilometre driven. Default: 2.50 RWF.",
    defaultVal: "2.5",
    step: "0.5",
  },
  {
    key: "driverConductorAllowancePerTrip",
    label: "Driver & conductor allowance",
    unit: "RWF / trip",
    helper: "Combined crew allowance per trip. Default: 80,000 RWF.",
    defaultVal: "80000",
    step: "1000",
  },
  {
    key: "overheadPerTrip",
    label: "Overhead per trip",
    unit: "RWF / trip",
    helper: "Fixed overhead costs per trip (admin, insurance, etc.). Default: 50,000 RWF.",
    defaultVal: "50000",
    step: "1000",
  },
];

function PricingInputsSection() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();

  type PricingFieldKey = typeof PRICING_FIELDS[number]["key"];
  const [fields, setFields] = useState<Record<PricingFieldKey, string>>(
    Object.fromEntries(PRICING_FIELDS.map((f) => [f.key, f.defaultVal])) as Record<PricingFieldKey, string>
  );

  const setF = (key: PricingFieldKey) => (v: string) =>
    setFields((prev) => ({ ...prev, [key]: v }));

  useEffect(() => {
    operatorApi.getPricingInputs()
      .then((r) => {
        const d: OperatorPricingInputsData = r.data.data;
        setIsCustom(d.isCustom);
        setUpdatedAt(d.updatedAt);
        setFields({
          fuelConsumptionLPer100Km:        String(d.fuelConsumptionLPer100Km),
          targetOccupancyPct:              String(d.targetOccupancyPct),
          operatorMarginPct:               String(d.operatorMarginPct),
          maintenanceCostPerKm:            String(d.maintenanceCostPerKm),
          driverConductorAllowancePerTrip: String(d.driverConductorAllowancePerTrip),
          overheadPerTrip:                 String(d.overheadPerTrip),
        });
      })
      .catch(() => toast.error("Failed to load pricing inputs"))
      .finally(() => setLoading(false));
  }, []);

  const errors: Partial<Record<PricingFieldKey, string>> = {};
  PRICING_FIELDS.forEach((f) => {
    const v = parseFloat(fields[f.key]);
    if (isNaN(v) || v <= 0) {
      errors[f.key] = "Required, must be > 0";
    }
    if (f.key === "targetOccupancyPct" && (v < 1 || v > 100)) {
      errors[f.key] = "1–100%";
    }
    if (f.key === "operatorMarginPct" && (v < 0 || v > 200)) {
      errors[f.key] = "0–200%";
    }
  });
  const canSave = Object.keys(errors).length === 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const r = await operatorApi.updatePricingInputs({
        fuelConsumptionLPer100Km:        parseFloat(fields.fuelConsumptionLPer100Km),
        targetOccupancyPct:              parseFloat(fields.targetOccupancyPct),
        operatorMarginPct:               parseFloat(fields.operatorMarginPct),
        maintenanceCostPerKm:            parseFloat(fields.maintenanceCostPerKm),
        driverConductorAllowancePerTrip: parseFloat(fields.driverConductorAllowancePerTrip),
        overheadPerTrip:                 parseFloat(fields.overheadPerTrip),
      });
      const updated: OperatorPricingInputsData = r.data.data;
      setIsCustom(updated.isCustom);
      setUpdatedAt(updated.updatedAt);
      toast.success("Pricing inputs saved");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save pricing inputs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Section title="Pricing Inputs" subtitle="Used for the trip price suggestion tool">
        <div className="space-y-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Pricing Inputs"
      subtitle={isCustom
        ? `Custom inputs${updatedAt ? ` · last updated ${fmtTs(updatedAt)}` : ""}`
        : "Using system defaults — save to customise"}
    >
      {!isCustom && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2 text-sm text-blue-700">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            These are system defaults. Customise them to get accurate price suggestions when scheduling trips.
          </span>
        </div>
      )}

      <div className="space-y-4 max-w-xl">
        {PRICING_FIELDS.map((f) => (
          <div key={f.key}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-0.5">
                  {f.label}
                </label>
                <p className="text-xs text-slate-400 leading-relaxed">{f.helper}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <input
                  type="number"
                  step={f.step}
                  value={fields[f.key]}
                  onChange={(e) => setF(f.key)(e.target.value)}
                  className={`w-28 text-right px-3 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors[f.key] ? "border-red-400 bg-red-50" : "border-slate-200"
                  }`}
                />
                <span className="text-xs text-slate-400 w-16 leading-tight">{f.unit}</span>
              </div>
            </div>
            {errors[f.key] && (
              <p className="text-xs text-red-600 mt-1 text-right pr-20">{errors[f.key]}</p>
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Pricing Inputs
          </button>
        </div>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperatorSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Refund policy and pricing configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        <RefundPolicySection />
        <PricingInputsSection />
      </div>
    </div>
  );
}
