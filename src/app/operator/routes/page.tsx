"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Route, Plus, Pencil, Trash2, X, MapPin,
  ArrowRight, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteItem = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  basePrice: number;
  active: boolean;
};

type FormData = {
  origin: string;
  destination: string;
  distanceKm: number;
  basePrice: number;
};

// ─── Slide-over panel ─────────────────────────────────────────────────────────

function RoutePanel({
  editing,
  onClose,
  onSaved,
}: {
  editing: RouteItem | null;
  onClose: () => void;
  onSaved: (route: RouteItem, isEdit: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors, isValid },
    reset,
  } = useForm<FormData>({ mode: "onChange",
    defaultValues: editing
      ? { origin: editing.origin, destination: editing.destination, distanceKm: editing.distanceKm, basePrice: editing.basePrice }
      : {},
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, distanceKm: Number(data.distanceKm), basePrice: Number(data.basePrice) };
      if (editing) {
        const res = await operatorApi.updateRoute(editing.id, payload);
        onSaved(res.data.data, true);
        toast.success("Route updated");
      } else {
        const res = await operatorApi.createRoute(payload);
        onSaved(res.data.data, false);
        toast.success("Route created");
      }
      reset();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save route");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Route className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{editing ? "Edit Route" : "New Route"}</h2>
              <p className="text-xs text-slate-400">{editing ? "Update route details" : "Add a route for your buses"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Origin</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  {...register("origin", { required: "Required" })}
                  placeholder="e.g. Kigali"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.origin && <p className="text-xs text-red-500 mt-1">{errors.origin.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                <input
                  {...register("destination", { required: "Required" })}
                  placeholder="e.g. Musanze"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.destination && <p className="text-xs text-red-500 mt-1">{errors.destination.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Distance (km)</label>
              <input
                {...register("distanceKm", { required: "Required", min: { value: 1, message: "Min 1 km" } })}
                type="number"
                placeholder="e.g. 97"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.distanceKm && <p className="text-xs text-red-500 mt-1">{errors.distanceKm.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Base Price (RWF)</label>
              <input
                {...register("basePrice", { required: "Required", min: { value: 100, message: "Min 100 RWF" } })}
                type="number"
                placeholder="e.g. 3000"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice.message}</p>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-500">
            The base price is a reference — you can set a different price per trip when scheduling.
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} type="button" className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm"
          >
            {isSubmitting ? "Saving..." : editing ? "Save Changes" : "Create Route"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ route, onConfirm, onCancel }: { route: RouteItem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Delete Route?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <span className="font-medium text-slate-700">{route.origin} → {route.destination}</span> will be permanently removed. Existing trips on this route are not affected.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState<RouteItem | null>(null);
  const [toDelete, setToDelete] = useState<RouteItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = (p = 0) => {
    setLoading(true);
    operatorApi.routes(p)
      .then((r) => {
        const data = r.data.data;
        setRoutes(data.content ?? []);
        setHasMore(!data.last);
        setPage(data.page ?? p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const handleSaved = (route: RouteItem, isEdit: boolean) => {
    if (isEdit) setRoutes((prev) => prev.map((r) => r.id === route.id ? route : r));
    else setRoutes((prev) => [route, ...prev]);
  };

  const openAdd = () => { setEditing(null); setShowPanel(true); };
  const openEdit = (r: RouteItem) => { setEditing(r); setShowPanel(true); };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await operatorApi.deleteRoute(toDelete.id);
      setRoutes((prev) => prev.filter((r) => r.id !== toDelete.id));
      toast.success("Route deleted");
    } catch {
      toast.error("Failed to delete route");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Routes</h1>
          <p className="text-slate-500 text-sm mt-1">Define origin–destination pairs for your trips</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="h-4 w-4" /> Add Route
        </button>
      </div>

      {/* Empty */}
      {!loading && routes.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No routes yet</h3>
          <p className="text-sm text-slate-400 mb-6">Add your first route to start scheduling trips</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            <Plus className="h-4 w-4" /> Add First Route
          </button>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Route cards */}
      {!loading && routes.length > 0 && (
        <>
          <div className="space-y-3">
            {routes.map((route) => (
              <div key={route.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Route className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{route.origin}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">{route.destination}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${route.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {route.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-400">
                    <span>{route.distanceKm} km</span>
                    <span>{route.basePrice?.toLocaleString()} RWF base price</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(route)} className="p-2 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(route)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

      {showPanel && (
        <RoutePanel
          editing={editing}
          onClose={() => { setShowPanel(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
      {toDelete && (
        <DeleteDialog
          route={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
