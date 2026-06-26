"use client";
import { useState } from "react";
import { Loader2, Plus, Trash2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

interface Props {
  operatorId: string;
  companyName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function RequestInformationModal({ operatorId, companyName, onSuccess, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => setItems((prev) => [...prev, ""]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, val: string) =>
    setItems((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    const requiredItems = items.map((s) => s.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      await adminApi.sendRfa(operatorId, message.trim(), requiredItems);
      toast.success(`RFA sent to ${companyName}`);
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to send RFA");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Request Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">{companyName}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Message to operator <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain what additional information is needed and why..."
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Required items <span className="text-slate-400 font-normal">(optional checklist)</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(i, e.target.value)}
                    placeholder={`Item ${i + 1}…`}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => removeItem(i)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !message.trim()}
            onClick={handleSubmit}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
