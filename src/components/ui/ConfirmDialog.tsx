"use client";
import React from "react";
import { Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: "primary" | "warning" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<Props["confirmVariant"], string> = {
  primary: "bg-emerald-600 hover:bg-emerald-700",
  warning: "bg-amber-500 hover:bg-amber-600",
  danger:  "bg-red-600 hover:bg-red-700",
};

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel, confirmVariant,
  onConfirm, onCancel, isLoading, children,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-slate-800 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center mb-4">{message}</p>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 ${VARIANT_STYLES[confirmVariant]}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
