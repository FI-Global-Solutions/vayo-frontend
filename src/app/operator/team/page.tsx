"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Users, UserPlus, Mail, Phone, Lock, User,
  Eye, EyeOff, Trash2, X, AlertCircle, Shield,
  ToggleLeft, ToggleRight,
} from "lucide-react";

import { toast } from "sonner";
import { operatorApi } from "@/lib/api";
import { StaffMember } from "@/lib/types";
import { getStoredUser } from "@/store/auth";

// ─── Role config ──────────────────────────────────────────────────────────────

const ALL_ROLES = ["OPERATOR_ADMIN", "DISPATCHER", "CONDUCTOR", "ACCOUNTANT"] as const;
const BASE_ROLES = ["DISPATCHER", "CONDUCTOR", "ACCOUNTANT"] as const;
type StaffRole = typeof ALL_ROLES[number];

const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; description: string; permissions: string[] }> = {
  OPERATOR_ADMIN: {
    label: "Operator Admin",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Trusted manager — full operational access",
    permissions: ["Manage routes, buses & trips", "Manage staff (below admin)", "View bookings and revenue"],
  },
  DISPATCHER: {
    label: "Dispatcher",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Schedules and manages trips",
    permissions: ["Create & cancel trips", "View routes and buses", "View passenger manifests"],
  },
  CONDUCTOR: {
    label: "Conductor",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Validates tickets on board",
    permissions: ["View assigned trips", "Scan and verify boarding tickets", "View passenger manifest"],
  },
  ACCOUNTANT: {
    label: "Accountant",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Read-only access to revenue",
    permissions: ["View bookings", "View revenue stats", "No operational changes"],
  },
};

// ─── Add Staff Panel ──────────────────────────────────────────────────────────

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: StaffRole;
};

function AddStaffPanel({ onClose, onCreated, isSuperAdmin }: { onClose: () => void; onCreated: (s: StaffMember) => void; isSuperAdmin: boolean }) {
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole>("CONDUCTOR");

  const availableRoles = isSuperAdmin ? ALL_ROLES : BASE_ROLES;

  const { register, handleSubmit, setValue, formState: { isSubmitting, errors, isValid } } = useForm<FormData>({
    mode: "onChange",
    defaultValues: { role: "CONDUCTOR" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await operatorApi.createStaff(data);
      const staff = res.data.data as StaffMember;
      toast.success(`${staff.firstName} added as ${ROLE_CONFIG[staff.role].label}`);
      onCreated(staff);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to create staff member");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Add Staff Member</h2>
              <p className="text-xs text-slate-400">Create a new account with limited access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Role picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Role *</label>
            <div className="space-y-2">
              {availableRoles.map((role) => {
                const cfg = ROLE_CONFIG[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setSelectedRole(role); setValue("role", role); }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedRole === role
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {selectedRole === role && (
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{cfg.description}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {cfg.permissions.map((p) => (
                        <li key={p} className="text-xs text-slate-400 flex items-center gap-1">
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register("role")} value={selectedRole} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                First Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input {...register("firstName", { required: true })} placeholder="Jean"
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
                Last Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input {...register("lastName", { required: true })} placeholder="Habimana"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Email
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("email", { required: true, pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })}
                type="email" placeholder="staff@company.com"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Phone
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("phone", { required: true })} placeholder="+250788000000"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-0.5 text-xs font-semibold text-slate-600 mb-1.5">
              Temporary Password
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register("password", { required: true, minLength: { value: 8, message: "Min. 8 characters" } })}
                type={showPass ? "text" : "password"} placeholder="Min. 8 characters"
                className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="button" onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            <p className="text-xs text-slate-400 mt-1">Share this with the staff member — they must change it on first login.</p>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" disabled={isSubmitting || !isValid} onClick={handleSubmit(onSubmit)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm">
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Confirm remove dialog ────────────────────────────────────────────────────

function ConfirmRemoveDialog({ staff, onConfirm, onCancel }: {
  staff: StaffMember; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">Remove Staff Member?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <span className="font-medium text-slate-700">{staff.firstName} {staff.lastName}</span> will lose
          access immediately. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<StaffRole, string> = {
  OPERATOR_ADMIN: "bg-purple-100 text-purple-700",
  DISPATCHER:     "bg-blue-100 text-blue-700",
  CONDUCTOR:      "bg-violet-100 text-violet-700",
  ACCOUNTANT:     "bg-amber-100 text-amber-700",
};

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toRemove, setToRemove] = useState<StaffMember | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<StaffRole | "ALL">("ALL");
  const currentUserRole = getStoredUser()?.role;
  const isSuperAdmin = currentUserRole === "OPERATOR_SUPER_ADMIN";

  useEffect(() => {
    operatorApi.staff()
      .then((r) => setStaff(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterRole === "ALL" ? staff : staff.filter((s) => s.role === filterRole);

  const handleToggle = async (member: StaffMember) => {
    setToggling(member.id);
    try {
      await operatorApi.toggleStaff(member.id, !member.enabled);
      setStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, enabled: !s.enabled } : s));
      toast.success(`${member.firstName} ${member.enabled ? "disabled" : "enabled"}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const handleRemove = async () => {
    if (!toRemove) return;
    try {
      await operatorApi.removeStaff(toRemove.id);
      setStaff((prev) => prev.filter((s) => s.id !== toRemove.id));
      toast.success(`${toRemove.firstName} removed`);
    } catch {
      toast.error("Failed to remove staff member");
    } finally {
      setToRemove(null);
    }
  };

  const visibleRoles = isSuperAdmin ? ALL_ROLES : BASE_ROLES;

  const counts = {
    ALL:            staff.length,
    OPERATOR_ADMIN: staff.filter((s) => s.role === "OPERATOR_ADMIN").length,
    DISPATCHER:     staff.filter((s) => s.role === "DISPATCHER").length,
    CONDUCTOR:      staff.filter((s) => s.role === "CONDUCTOR").length,
    ACCOUNTANT:     staff.filter((s) => s.role === "ACCOUNTANT").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff accounts and their access levels</p>
        </div>
        <button type="button" onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm">
          <UserPlus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(["ALL", ...visibleRoles] as const).map((r) => (
          <button type="button" key={r} onClick={() => setFilterRole(r as StaffRole | "ALL")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterRole === r
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}>
            {r === "ALL" ? "All" : ROLE_CONFIG[r].label} ({counts[r]})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && staff.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No staff members yet</h3>
          <p className="text-sm text-slate-400 mb-6">Add dispatchers, conductors, and accountants to delegate work.</p>
          <button type="button" onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            <UserPlus className="h-4 w-4" />
            Add First Staff Member
          </button>
        </div>
      )}

      {/* Loading */}
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

      {/* Staff list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((member) => {
            const cfg = ROLE_CONFIG[member.role];
            return (
              <div key={member.id}
                className={`bg-white border rounded-xl p-4 sm:p-5 flex items-center gap-4 transition-colors ${
                  member.enabled ? "border-slate-200 hover:border-slate-300" : "border-slate-100 opacity-60"
                }`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0 ${AVATAR_COLORS[member.role]}`}>
                  {member.firstName[0]}{member.lastName[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{member.firstName} {member.lastName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {!member.enabled && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />{member.email}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />{member.phone}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Toggle with tooltip */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => handleToggle(member)}
                      disabled={toggling === member.id}
                      aria-label={member.enabled ? `Disable ${member.firstName}` : `Enable ${member.firstName}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50">
                      {member.enabled
                        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                        : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className={`text-xs text-white rounded-lg px-3 py-2 shadow-lg whitespace-nowrap ${member.enabled ? "bg-slate-700" : "bg-emerald-600"}`}>
                        {member.enabled
                          ? <>Disable access<br /><span className="text-slate-300 font-normal">{member.firstName} won&apos;t be able to log in</span></>
                          : <>Enable access<br /><span className="text-emerald-200 font-normal">{member.firstName} will regain full access</span></>}
                        <div className={`absolute top-full right-3 border-4 border-transparent ${member.enabled ? "border-t-slate-700" : "border-t-emerald-600"}`} />
                      </div>
                    </div>
                  </div>

                  {/* Remove with tooltip */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setToRemove(member)}
                      aria-label={`Remove ${member.firstName} ${member.lastName}`}
                      className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="text-xs text-white bg-red-600 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        Remove permanently<br />
                        <span className="text-red-200 font-normal">Deletes {member.firstName}&apos;s account</span>
                        <div className="absolute top-full right-3 border-4 border-transparent border-t-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && staff.length > 0 && (
        <p className="text-center text-sm text-slate-400 py-8">No {filterRole !== "ALL" ? ROLE_CONFIG[filterRole].label : ""} staff members.</p>
      )}

      {!loading && staff.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="h-3 w-3" />
          <span>{staff.length} staff member{staff.length !== 1 ? "s" : ""} — {isSuperAdmin ? "you are the account owner" : "manage your team"}</span>
        </div>
      )}

      {showAdd && <AddStaffPanel onClose={() => setShowAdd(false)} onCreated={(s) => setStaff((prev) => [s, ...prev])} isSuperAdmin={isSuperAdmin} />}
      {toRemove && <ConfirmRemoveDialog staff={toRemove} onConfirm={handleRemove} onCancel={() => setToRemove(null)} />}
    </div>
  );
}
