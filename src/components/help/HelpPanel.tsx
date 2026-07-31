"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "cmdk";
import { FAQ_CATEGORIES, ALL_FAQ_ITEMS, type FaqItem } from "@/lib/faq-content";

const PAGE_CATEGORY_MAP: Record<string, string> = {
  "/operator/routes":   "routes-stops",
  "/operator/trips":    "trips-scheduling",
  "/operator/payouts":  "payouts-revenue",
  "/operator/refunds":  "refunds",
  "/operator/settings": "account-settings",
  "/operator/team":     "getting-started",
  "/operator/buses":    "getting-started",
  "/operator/dashboard": "getting-started",
  "/operator/conductors": "conductors-boarding",
};

function categoryForPath(pathname: string): string {
  for (const [path, cat] of Object.entries(PAGE_CATEGORY_MAP)) {
    if (pathname.startsWith(path)) return cat;
  }
  return FAQ_CATEGORIES[0].id;
}

export default function HelpPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState(() => categoryForPath(pathname));
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync category when pathname changes (e.g. user navigates while panel open)
  useEffect(() => {
    setActiveCategory(categoryForPath(pathname));
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectSearchResult = (item: FaqItem) => {
    setSearchQuery("");
    setActiveCategory(item.category);
    setOpenItems((prev) => new Set([...prev, item.id]));
    // scroll after state update
    setTimeout(() => {
      itemRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const searchResults = searchQuery.trim().length > 0
    ? ALL_FAQ_ITEMS.filter((item) => {
        const q = searchQuery.toLowerCase();
        return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  const activeCategoryData = FAQ_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Help and guides"
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-slate-800 text-base">Help &amp; Guides</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help panel"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
          <Command shouldFilter={false} className="relative">
            <div className="flex items-center border border-slate-200 rounded-xl px-3 gap-2 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white transition-colors">
              <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <CommandInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                placeholder="Search help topics…"
                className="flex-1 py-2.5 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                <CommandList>
                  <CommandEmpty>
                    <p className="text-sm text-slate-400 text-center py-6">No results for &ldquo;{searchQuery}&rdquo;</p>
                  </CommandEmpty>
                  {searchResults.map((item) => {
                    const cat = FAQ_CATEGORIES.find((c) => c.id === item.category);
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => selectSearchResult(item)}
                        className="flex flex-col items-start px-4 py-3 cursor-pointer hover:bg-blue-50 aria-selected:bg-blue-50 border-b border-slate-50 last:border-0"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                          {cat?.label}
                        </span>
                        <span className="text-sm text-slate-700 font-medium leading-snug">{item.question}</span>
                      </CommandItem>
                    );
                  })}
                </CommandList>
              </div>
            )}
          </Command>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-slate-200 flex-shrink-0 scrollbar-hide">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {activeCategoryData.items.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors gap-3"
                >
                  <span className="font-medium text-sm text-slate-800 leading-snug pr-2">
                    {item.question}
                  </span>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      {item.answer}
                    </p>

                    {item.steps && item.steps.length > 0 && (
                      <ol className="mt-3 space-y-2">
                        {item.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-semibold mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-slate-700 leading-snug">{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {item.tip && (
                      <div className="mt-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 leading-relaxed">
                          💡 {item.tip}
                        </p>
                      </div>
                    )}

                    {item.learnMoreUrl && (
                      <a
                        href={item.learnMoreUrl}
                        onClick={onClose}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Go to this page
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <p className="text-xs text-slate-500 text-center">
            Still need help?{" "}
            <a
              href="mailto:support@vayo.rw"
              className="text-blue-600 hover:underline font-medium"
            >
              support@vayo.rw
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
