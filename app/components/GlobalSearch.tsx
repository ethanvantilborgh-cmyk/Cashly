"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileText, Users, Receipt, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLang } from "../context/LangContext";

interface SearchResult {
  type: "invoice" | "client" | "expense";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function GlobalSearch() {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();
  const { tr }   = useLang();

  // Open / close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const lq = q.toLowerCase();
    setLoading(true);
    try {
      const { getInvoices, getClients, getExpenses } = await import("../lib/db");
      const [invoices, clients, expenses] = await Promise.all([
        getInvoices(), getClients(), getExpenses(),
      ]);

      const out: SearchResult[] = [];

      invoices
        .filter(i => i.client.toLowerCase().includes(lq) || i.id.toLowerCase().includes(lq))
        .slice(0, 3)
        .forEach(i => out.push({
          type: "invoice", id: i.id,
          title: `${i.id} — ${i.client}`,
          subtitle: `${i.amount.toLocaleString()} € · ${i.status}`,
          href: "/invoices",
        }));

      clients
        .filter(c =>
          c.name.toLowerCase().includes(lq) ||
          c.email?.toLowerCase().includes(lq) ||
          c.company?.toLowerCase().includes(lq)
        )
        .slice(0, 3)
        .forEach(c => out.push({
          type: "client", id: c.id,
          title: c.name,
          subtitle: [c.company, c.email].filter(Boolean).join(" · "),
          href: "/clients",
        }));

      expenses
        .filter(e =>
          e.label.toLowerCase().includes(lq) ||
          e.category.toLowerCase().includes(lq)
        )
        .slice(0, 3)
        .forEach(e => out.push({
          type: "expense", id: e.id,
          title: e.label,
          subtitle: `${e.amount.toFixed(2)} € · ${e.date}`,
          href: "/expenses",
        }));

      setResults(out);
      setSelected(0);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  function navigate(r: SearchResult) {
    router.push(r.href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected]);
  }

  const ICON  = { invoice: FileText, client: Users, expense: Receipt } as const;
  const COLOR = {
    invoice: "bg-emerald-100 text-emerald-600",
    client:  "bg-sky-100 text-sky-600",
    expense: "bg-violet-100 text-violet-600",
  } as const;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={tr("searchPlaceholder")}
            className="flex-1 py-4 text-sm outline-none bg-transparent"
            style={{ color: "var(--foreground)" }}
          />
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-400">Esc</kbd>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="py-1 max-h-72 overflow-y-auto">
            {results.map((r, i) => {
              const Icon = ICON[r.type];
              return (
                <button
                  key={r.id + r.type}
                  onClick={() => navigate(r)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    i === selected ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${COLOR[r.type]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{r.title}</p>
                    <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        ) : loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">…</div>
        ) : query ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            {tr("searchNoResults")} «{query}»
          </div>
        ) : (
          <div className="py-8 px-4 text-center">
            <p className="text-sm text-slate-400 mb-4">{tr("searchHint")}</p>
            <div className="flex items-center justify-center gap-5 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 font-mono">↑↓</kbd> naviguer
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 font-mono">↵</kbd> ouvrir
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 font-mono">Esc</kbd> fermer
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
