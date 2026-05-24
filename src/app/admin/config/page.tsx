"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Fuel, TrendingUp, Pencil, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingConfigRow {
  configKey: string;
  configValue: number;
  updatedAt?: string;
}

const KEY_DIESEL   = "diesel_price_rwf_per_liter";
const KEY_EXPONENT = "segment_price_exponent";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(iso: string | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

// ─── Config card ──────────────────────────────────────────────────────────────

interface ConfigCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  currentValue: number | null;
  updatedAt?: string;
  unit?: string;
  editValue: string;
  onEditChange: (v: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  validationError: string | null;
  loading: boolean;
  placeholder?: string;
  step?: string;
}

function ConfigCard({
  icon: Icon,
  title,
  description,
  currentValue,
  updatedAt,
  unit,
  editValue,
  onEditChange,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  validationError,
  loading,
  placeholder,
  step = "1",
}: ConfigCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
            {updatedAt && (
              <p className="text-xs text-slate-400 mt-0.5">Last updated {fmtTs(updatedAt)}</p>
            )}
          </div>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Current value */}
      <div className="mb-4">
        <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
          {currentValue != null
            ? `${Number(currentValue).toLocaleString()}${unit ? ` ${unit}` : ""}`
            : <span className="text-slate-300">—</span>}
        </p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{description}</p>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className="border-t border-slate-100 pt-4 mt-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">New value{unit ? ` (${unit})` : ""}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={step}
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {validationError && (
            <p className="text-xs text-red-600 mt-2">{validationError}</p>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={!!validationError || !editValue.trim() || loading}
            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Review &amp; Save
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<PricingConfigRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Diesel state
  const [dieselEdit, setDieselEdit]       = useState("");
  const [dieselEditing, setDieselEditing] = useState(false);
  const [dieselSaving, setDieselSaving]   = useState(false);
  const [dieselConfirm, setDieselConfirm] = useState(false);

  // Exponent state
  const [expEdit, setExpEdit]         = useState("");
  const [expEditing, setExpEditing]   = useState(false);
  const [expSaving, setExpSaving]     = useState(false);
  const [expConfirm, setExpConfirm]   = useState(false);

  useEffect(() => {
    adminApi.getPricingConfig()
      .then((r) => setConfigs(r.data.data ?? []))
      .catch(() => toast.error("Failed to load pricing config"))
      .finally(() => setLoading(false));
  }, []);

  const get = (key: string) => configs.find((c) => c.configKey === key);
  const diesel   = get(KEY_DIESEL);
  const exponent = get(KEY_EXPONENT);

  // ── Validation ─────────────────────────────────────────────────────────────

  const dieselNum = parseFloat(dieselEdit);
  const dieselError = dieselEdit.trim()
    ? (isNaN(dieselNum) || dieselNum <= 0 || dieselNum >= 10000)
      ? "Must be greater than 0 and less than 10,000"
      : null
    : null;

  const expNum = parseFloat(expEdit);
  const expError = expEdit.trim()
    ? (isNaN(expNum) || expNum < 0.5 || expNum > 1.5)
      ? "Must be between 0.5 and 1.5"
      : null
    : null;

  // ── Save handlers ──────────────────────────────────────────────────────────

  const saveDiesel = async () => {
    setDieselSaving(true);
    try {
      const r = await adminApi.updateDieselPrice(dieselNum);
      const updated: PricingConfigRow = r.data.data;
      setConfigs((prev) => prev.map((c) => c.configKey === KEY_DIESEL ? updated : c));
      setDieselEditing(false);
      setDieselEdit("");
      toast.success("Diesel price updated");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to update diesel price");
    } finally {
      setDieselSaving(false);
      setDieselConfirm(false);
    }
  };

  const saveExponent = async () => {
    setExpSaving(true);
    try {
      const r = await adminApi.updateSegmentExponent(expNum);
      const updated: PricingConfigRow = r.data.data;
      setConfigs((prev) => prev.map((c) => c.configKey === KEY_EXPONENT ? updated : c));
      setExpEditing(false);
      setExpEdit("");
      toast.success("Segment price exponent updated");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to update exponent");
    } finally {
      setExpSaving(false);
      setExpConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-7 bg-slate-200 rounded w-40 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-64 animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-32" />
              </div>
              <div className="h-9 bg-slate-200 rounded w-28 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Platform Config</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pricing parameters that affect all operators and trips
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* ── Diesel price ────────────────────────────────────────────────── */}
        <ConfigCard
          icon={Fuel}
          title="Diesel Price"
          description="Used in the operator price suggestion formula. Affects cost estimates for new trips — does not retroactively change any existing trip prices."
          currentValue={diesel?.configValue ?? null}
          updatedAt={diesel?.updatedAt}
          unit="RWF / litre"
          editValue={dieselEdit}
          onEditChange={setDieselEdit}
          isEditing={dieselEditing}
          onStartEdit={() => {
            setDieselEdit(diesel?.configValue != null ? String(diesel.configValue) : "");
            setDieselEditing(true);
          }}
          onCancelEdit={() => { setDieselEditing(false); setDieselEdit(""); }}
          onSave={() => setDieselConfirm(true)}
          validationError={dieselError}
          loading={dieselSaving}
          placeholder="e.g. 1200"
        />

        {/* ── Segment exponent ────────────────────────────────────────────── */}
        <ConfigCard
          icon={TrendingUp}
          title="Segment Price Exponent"
          description="Controls how prices scale with distance. 1.0 = linear. 0.85 = short segments cost slightly more per km (default). Range: 0.5 – 1.5. Affects all segment price calculations immediately."
          currentValue={exponent?.configValue ?? null}
          updatedAt={exponent?.updatedAt}
          editValue={expEdit}
          onEditChange={setExpEdit}
          isEditing={expEditing}
          onStartEdit={() => {
            setExpEdit(exponent?.configValue != null ? String(exponent.configValue) : "");
            setExpEditing(true);
          }}
          onCancelEdit={() => { setExpEditing(false); setExpEdit(""); }}
          onSave={() => setExpConfirm(true)}
          validationError={expError}
          loading={expSaving}
          placeholder="e.g. 0.85"
          step="0.01"
        />
      </div>

      {/* ── Confirm dialogs ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={dieselConfirm}
        title="Update Diesel Price"
        message={`Change diesel price from ${diesel?.configValue != null ? Number(diesel.configValue).toLocaleString() : "—"} to ${isNaN(dieselNum) ? "—" : dieselNum.toLocaleString()} RWF per litre? This affects the pricing suggestion tool for all operators.`}
        confirmLabel="Update"
        confirmVariant="warning"
        onConfirm={saveDiesel}
        onCancel={() => setDieselConfirm(false)}
        isLoading={dieselSaving}
      />

      <ConfirmDialog
        isOpen={expConfirm}
        title="Update Segment Price Exponent"
        message={`Change segment price exponent from ${exponent?.configValue ?? "—"} to ${isNaN(expNum) ? "—" : expNum}? This immediately affects all new segment price calculations.`}
        confirmLabel="Update"
        confirmVariant="warning"
        onConfirm={saveExponent}
        onCancel={() => setExpConfirm(false)}
        isLoading={expSaving}
      />
    </div>
  );
}
