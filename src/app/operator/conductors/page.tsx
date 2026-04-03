"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { operatorApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Conductor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enabled: boolean;
  createdAt: string;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

// ─── Add conductor slide-over panel ──────────────────────────────────────────

function AddConductorPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Conductor) => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<FormData>({ mode: "onTouched" });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await operatorApi.createConductor(data);
      const conductor: Conductor = res.data.data;
      toast.success(`${conductor.firstName} added as conductor`);
      onCreated(conductor);
      reset();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to create conductor");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Add Conductor</h2>
              <p className="text-xs text-slate-400">Create a new conductor account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  {...register("firstName", { required: true })}
                  placeholder="Jean"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
              <input
                {...register("lastName", { required: true })}
                placeholder="Habimana"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register("email", {
                  required: true,
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
                })}
                type="email"
                placeholder="conductor@company.com"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register("phone", { required: true })}
                placeholder="+250788000000"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Temporary Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register("password", {
                  required: true,
                  minLength: { value: 8, message: "Minimum 8 characters" },
                })}
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Share this with the conductor — they can change it after logging in
            </p>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <p className="text-xs text-blue-700 font-medium mb-1">What conductors can do</p>
            <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
              <li>View today&apos;s assigned trips</li>
              <li>Pull the passenger manifest</li>
              <li>Scan and verify boarding tickets</li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="conductor-form"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  conductor,
  onConfirm,
  onCancel,
}: {
  conductor: Conductor;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Remove Conductor?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <span className="font-medium text-slate-700">
            {conductor.firstName} {conductor.lastName}
          </span>{" "}
          will lose access immediately. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConductorsPage() {
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toDelete, setToDelete] = useState<Conductor | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    operatorApi.conductors()
      .then((r) => setConductors(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (c: Conductor) => {
    setConductors((prev) => [c, ...prev]);
  };

  const handleRemove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await operatorApi.removeConductor(toDelete.id);
      setConductors((prev) => prev.filter((c) => c.id !== toDelete.id));
      toast.success(`${toDelete.firstName} removed`);
    } catch {
      toast.error("Failed to remove conductor");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conductors</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your field staff — drivers and ticket checkers
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Conductor
        </button>
      </div>

      {/* Empty state */}
      {!loading && conductors.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No conductors yet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Add your first conductor to let them access trip manifests and verify tickets
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add First Conductor
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-40" />
                <div className="h-3 bg-slate-100 rounded w-56" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conductors list */}
      {!loading && conductors.length > 0 && (
        <div className="space-y-3">
          {conductors.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-slate-300 transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {c.firstName[0]}{c.lastName[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                    ${c.enabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    <CheckCircle className="h-3 w-3" />
                    {c.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />{c.email}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />{c.phone}
                  </span>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => setToDelete(c)}
                className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Remove conductor"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {!loading && conductors.length > 0 && (
        <p className="text-xs text-slate-400 mt-4 text-center">
          {conductors.length} conductor{conductors.length !== 1 ? "s" : ""} in your team
        </p>
      )}

      {/* Add panel */}
      {showAdd && (
        <AddConductorPanel
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Delete dialog */}
      {toDelete && (
        <ConfirmDeleteDialog
          conductor={toDelete}
          onConfirm={handleRemove}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
