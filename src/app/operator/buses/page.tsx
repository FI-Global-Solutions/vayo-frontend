"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Bus, Plus, Pencil, Trash2, X, Hash,
  AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type BusType = "STANDARD" | "LUXURY" | "MINIBUS";

type BusItem = {
  id: string;
  plateNumber: string;
  totalSeats: number;
  busType: BusType;
  active: boolean;
};

type FormData = {
  plateNumber: string;
  totalSeats: number;
  busType: BusType;
};

const BUS_TYPE_STYLES: Record<BusType, string> = {
  STANDARD: "bg-blue-50 text-blue-700",
  LUXURY:   "bg-purple-50 text-purple-700",
  MINIBUS:  "bg-amber-50 text-amber-700",
};

const BUS_TYPE_OPTIONS: { value: BusType; label: string; desc: string }[] = [
  { value: "STANDARD", label: "Standard",  desc: "Regular intercity bus" },
  { value: "LUXURY",   label: "Luxury",    desc: "AC, reclining seats" },
  { value: "MINIBUS",  label: "Minibus",   desc: "Smaller capacity vehicle" },
];

// ─── Bus panel ────────────────────────────────────────────────────────────────

function BusPanel({ editing, onClose, onSaved }: {
  editing: BusItem | null;
  onClose: () => void;
  onSaved: (bus: BusItem, isEdit: boolean) => void;
}) {
  const { register, handleSubmit, formState: { isSubmitting, errors, isValid } } = useForm<FormData>({ mode: "onChange",
    defaultValues: editing
      ? { plateNumber: editing.plateNumber, totalSeats: editing.totalSeats, busType: editing.busType }
      : { busType: "STANDARD" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, totalSeats: Number(data.totalSeats) };
      if (editing) {
        const res = await operatorApi.updateBus(editing.id, payload);
        onSaved(res.data.data, true);
        toast.success("Bus updated");
      } else {
        const res = await operatorApi.createBus(payload);
        onSaved(res.data.data, false);
        toast.success("Bus added to fleet");
      }
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save bus");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Bus className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{editing ? "Edit Bus" : "Add Bus"}</h2>
              <p className="text-xs text-slate-400">{editing ? "Update bus details" : "Register a new vehicle"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Plate Number</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register("plateNumber", { required: "Plate number is required" })}
                placeholder="e.g. RAD 123 A"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {errors.plateNumber && <p className="text-xs text-red-500 mt-1">{errors.plateNumber.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Seats</label>
            <input
              {...register("totalSeats", {
                required: "Required",
                min: { value: 4, message: "Minimum 4 seats" },
                max: { value: 70, message: "Maximum 70 seats" },
              })}
              type="number"
              placeholder="e.g. 45"
              className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.totalSeats && <p className="text-xs text-red-500 mt-1">{errors.totalSeats.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Bus Type</label>
            <div className="space-y-2">
              {BUS_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input
                    {...register("busType", { required: true })}
                    type="radio"
                    value={opt.value}
                    className="accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} type="button" className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm"
          >
            {isSubmitting ? "Saving..." : editing ? "Save Changes" : "Add Bus"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ bus, onConfirm, onCancel }: { bus: BusItem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Remove Bus?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <span className="font-medium text-slate-700">{bus.plateNumber}</span> will be removed from your fleet. Existing trips using this bus are not affected.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm">Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BusesPage() {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState<BusItem | null>(null);
  const [toDelete, setToDelete] = useState<BusItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = (p = 0) => {
    setLoading(true);
    operatorApi.buses(p)
      .then((r) => {
        const data = r.data.data;
        setBuses(data.content ?? []);
        setHasMore(!data.last);
        setPage(data.page ?? p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const handleSaved = (bus: BusItem, isEdit: boolean) => {
    if (isEdit) setBuses((prev) => prev.map((b) => b.id === bus.id ? bus : b));
    else setBuses((prev) => [bus, ...prev]);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await operatorApi.deleteBus(toDelete.id);
      setBuses((prev) => prev.filter((b) => b.id !== toDelete.id));
      toast.success("Bus removed from fleet");
    } catch {
      toast.error("Failed to remove bus");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your buses and vehicles</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowPanel(true); }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Bus
        </button>
      </div>

      {/* Empty */}
      {!loading && buses.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bus className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No buses yet</h3>
          <p className="text-sm text-slate-400 mb-6">Register your first bus to start scheduling trips</p>
          <button onClick={() => { setEditing(null); setShowPanel(true); }} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            <Plus className="h-4 w-4" /> Add First Bus
          </button>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bus list */}
      {!loading && buses.length > 0 && (
        <>
          <div className="space-y-3">
            {buses.map((bus) => (
              <div key={bus.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bus className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 font-mono">{bus.plateNumber}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BUS_TYPE_STYLES[bus.busType]}`}>
                      {bus.busType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bus.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {bus.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{bus.totalSeats} seats</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(bus); setShowPanel(true); }} className="p-2 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(bus)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={page === 0} onClick={() => load(page - 1)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-500">Page {page + 1}</span>
            <button disabled={!hasMore} onClick={() => load(page + 1)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {showPanel && <BusPanel editing={editing} onClose={() => { setShowPanel(false); setEditing(null); }} onSaved={handleSaved} />}
      {toDelete && <DeleteDialog bus={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} />}
    </div>
  );
}
