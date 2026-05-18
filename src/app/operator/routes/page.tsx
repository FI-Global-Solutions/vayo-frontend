"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Route, Plus, Pencil, Trash2, X, MapPin,
  ArrowRight, AlertCircle, ChevronLeft, ChevronRight,
  ListOrdered, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import RouteStopsEditor, { StopDraft, emptyStop, stopsValid } from "@/components/routes/RouteStopsEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteStop = {
  id: string;
  stopName: string;
  distanceFromOriginKm: number;
  boardingAllowed: boolean;
  droppingAllowed: boolean;
  countryCode: string;
  stopOrder: number;
};

type RouteItem = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  basePrice: number;
  active: boolean;
  stops: RouteStop[];
};

type FormData = {
  origin: string;
  destination: string;
  distanceKm: number;
  basePrice: number;
};

function defaultStops(origin: string, destination: string, distanceKm: number): StopDraft[] {
  return [
    { stopName: origin || "", distanceFromOriginKm: 0, boardingAllowed: true, droppingAllowed: false, countryCode: "RW" },
    { stopName: destination || "", distanceFromOriginKm: distanceKm || "", boardingAllowed: false, droppingAllowed: true, countryCode: "RW" },
  ];
}

function stopsToDraft(stops: RouteStop[]): StopDraft[] {
  return stops
    .slice()
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => ({
      stopName: s.stopName,
      distanceFromOriginKm: s.distanceFromOriginKm,
      boardingAllowed: s.boardingAllowed,
      droppingAllowed: s.droppingAllowed,
      countryCode: s.countryCode,
    }));
}

// ─── Stop count indicator ─────────────────────────────────────────────────────

function StopCountBadge({ count }: { count: number }) {
  const isMinimal = count <= 2;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        isMinimal
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-slate-100 text-slate-500"
      }`}
      title={isMinimal ? "Only origin and destination — no intermediate stops" : `${count} stops`}
    >
      <ListOrdered className="h-3 w-3" />
      {count} stop{count !== 1 ? "s" : ""}
      {isMinimal && <AlertTriangle className="h-3 w-3" />}
    </span>
  );
}

// ─── Route stops inline panel ─────────────────────────────────────────────────

function StopsSection({
  route,
  onSaved,
}: {
  route: RouteItem;
  onSaved: (updated: RouteItem) => void;
}) {
  const [stops, setStops] = useState<StopDraft[]>(() =>
    route.stops.length > 0 ? stopsToDraft(route.stops) : defaultStops(route.origin, route.destination, route.distanceKm)
  );
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const handleSave = async () => {
    if (!stopsValid(stops)) {
      setShowValidation(true);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        origin: route.origin,
        destination: route.destination,
        distanceKm: route.distanceKm,
        basePrice: route.basePrice,
        stops: stops.map((s) => ({
          stopName: s.stopName,
          distanceFromOriginKm: Number(s.distanceFromOriginKm),
          boardingAllowed: s.boardingAllowed,
          droppingAllowed: s.droppingAllowed,
          countryCode: s.countryCode,
        })),
      };
      const res = await operatorApi.updateRoute(route.id, payload);
      const updated: RouteItem = res.data.data;
      onSaved(updated);
      toast.success("Stops updated");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to save stops");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-100 px-4 sm:px-5 pt-4 pb-5 bg-slate-50/50">
      <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Stops</p>
      <RouteStopsEditor
        stops={stops}
        onChange={(s) => { setStops(s); setShowValidation(false); }}
        routeDistanceKm={route.distanceKm}
      />
      {showValidation && !stopsValid(stops) && (
        <p className="text-xs text-red-500 mt-2">Fix the errors above before saving.</p>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {saving ? "Saving…" : "Save Stops"}
        </button>
      </div>
    </div>
  );
}

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
    watch,
    formState: { isSubmitting, errors, isValid },
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: editing
      ? { origin: editing.origin, destination: editing.destination, distanceKm: editing.distanceKm, basePrice: editing.basePrice }
      : {},
  });

  const originValue = watch("origin") ?? "";
  const destinationValue = watch("destination") ?? "";
  const distanceValue = watch("distanceKm");

  // Stops state — only shown when creating (editing uses the inline section)
  const [stops, setStops] = useState<StopDraft[]>(() =>
    editing ? [] : [
      { stopName: "", distanceFromOriginKm: 0, boardingAllowed: true, droppingAllowed: false, countryCode: "RW" },
      { stopName: "", distanceFromOriginKm: "", boardingAllowed: false, droppingAllowed: true, countryCode: "RW" },
    ]
  );
  const [showStopValidation, setShowStopValidation] = useState(false);

  // Keep first and last stop names in sync with origin/destination fields
  const syncedStops = stops.map((s, i) => {
    if (i === 0 && originValue && s.stopName !== originValue) return { ...s, stopName: originValue };
    if (i === stops.length - 1 && destinationValue && s.stopName !== destinationValue) return { ...s, stopName: destinationValue };
    return s;
  });

  const onSubmit = async (data: FormData) => {
    if (!editing && !stopsValid(syncedStops)) {
      setShowStopValidation(true);
      return;
    }
    try {
      const base = { ...data, distanceKm: Number(data.distanceKm), basePrice: Number(data.basePrice) };
      if (editing) {
        const res = await operatorApi.updateRoute(editing.id, base);
        onSaved(res.data.data, true);
        toast.success("Route updated");
      } else {
        const payload = {
          ...base,
          stops: syncedStops.map((s) => ({
            stopName: s.stopName,
            distanceFromOriginKm: Number(s.distanceFromOriginKm),
            boardingAllowed: s.boardingAllowed,
            droppingAllowed: s.droppingAllowed,
            countryCode: s.countryCode,
          })),
        };
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
          <button type="button" onClick={onClose} title="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Route fields */}
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

          {/* Stops editor — only on create */}
          {!editing && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">Stops</p>
                <span className="text-xs text-slate-400">Configure pickup and drop-off points</span>
              </div>
              <RouteStopsEditor
                stops={syncedStops}
                onChange={(s) => { setStops(s); setShowStopValidation(false); }}
                routeDistanceKm={Number(distanceValue) || undefined}
              />
              {showStopValidation && !stopsValid(syncedStops) && (
                <p className="text-xs text-red-500 mt-2">Fix the stop errors before creating the route.</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} type="button" className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            type="submit"
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
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Route card ───────────────────────────────────────────────────────────────

function RouteCard({
  route,
  expandedId,
  onToggleExpand,
  onEdit,
  onDelete,
  onStopsSaved,
}: {
  route: RouteItem;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onEdit: (r: RouteItem) => void;
  onDelete: (r: RouteItem) => void;
  onStopsSaved: (updated: RouteItem) => void;
}) {
  const stopCount = route.stops?.length ?? 0;
  const isOpen = expandedId === route.id;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-colors ${isOpen ? "border-emerald-200 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
      {/* Main row */}
      <div className="p-4 sm:p-5 flex items-center gap-4">
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
            <StopCountBadge count={stopCount} />
          </div>
          <div className="flex gap-4 mt-1 text-xs text-slate-400">
            <span>{route.distanceKm} km</span>
            <span>{route.basePrice?.toLocaleString()} RWF base price</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit stops toggle */}
          <button
            type="button"
            onClick={() => onToggleExpand(route.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isOpen
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
            }`}
            title="Edit stops"
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stops</span>
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button type="button" onClick={() => onEdit(route)} className="p-2 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit route">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(route)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete route">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inline stops section */}
      {isOpen && (
        <StopsSection route={route} onSaved={onStopsSaved} />
      )}
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    if (isEdit) {
      setRoutes((prev) => prev.map((r) => r.id === route.id ? route : r));
    } else {
      setRoutes((prev) => [route, ...prev]);
      // Auto-open stops editor for newly created route
      setExpandedId(route.id);
    }
  };

  const handleStopsSaved = (updated: RouteItem) => {
    setRoutes((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  };

  const openAdd = () => { setEditing(null); setShowPanel(true); };
  const openEdit = (r: RouteItem) => { setEditing(r); setShowPanel(true); };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
          <p className="text-slate-500 text-sm mt-1">Define origin–destination pairs and their stops</p>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
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
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
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
              <RouteCard
                key={route.id}
                route={route}
                expandedId={expandedId}
                onToggleExpand={toggleExpand}
                onEdit={openEdit}
                onDelete={setToDelete}
                onStopsSaved={handleStopsSaved}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button type="button" title="Previous page" disabled={page === 0} onClick={() => load(page - 1)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-500">Page {page + 1}</span>
            <button type="button" title="Next page" disabled={!hasMore} onClick={() => load(page + 1)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
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
