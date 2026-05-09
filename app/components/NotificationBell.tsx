"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, AlertCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLang } from "../context/LangContext";
import { getInvoices } from "../lib/db";
import type { Invoice } from "../lib/storage";

interface NotifItem {
  id: string;
  type: "overdue" | "due_soon";
  invoice: Invoice;
}

export default function NotificationBell() {
  const { tr } = useLang();
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const invoices = await getInvoices();
        const today = new Date();
        const soon  = new Date(today); soon.setDate(soon.getDate() + 7);
        const todayStr = today.toISOString().split("T")[0];
        const soonStr  = soon.toISOString().split("T")[0];

        const notifs: NotifItem[] = [];
        for (const inv of invoices) {
          if (inv.status === "overdue") {
            notifs.push({ id: inv.id + "_ov", type: "overdue", invoice: inv });
          } else if (inv.status === "pending" && inv.due >= todayStr && inv.due <= soonStr) {
            notifs.push({ id: inv.id + "_soon", type: "due_soon", invoice: inv });
          }
        }
        // Sort: overdue first, then by due date
        notifs.sort((a, b) => {
          if (a.type !== b.type) return a.type === "overdue" ? -1 : 1;
          return a.invoice.due.localeCompare(b.invoice.due);
        });
        setItems(notifs.slice(0, 10));
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!loaded) return null;

  const overdueCount = items.filter(i => i.type === "overdue").length;
  const totalCount   = items.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title={tr("notifications")}
      >
        <Bell className="w-4 h-4" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5 leading-none">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tr("notifications")}</span>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-red-500">{totalCount} {tr("active")}</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-slate-400">{tr("noNotifications")}</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
              {items.map(item => (
                <Link
                  key={item.id}
                  href="/invoices"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.type === "overdue" ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-500"
                  }`}>
                    {item.type === "overdue"
                      ? <AlertCircle className="w-3.5 h-3.5" />
                      : <Clock className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{item.invoice.client}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.invoice.id} · {item.invoice.amount.toLocaleString()} €
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      item.type === "overdue" ? "text-red-500" : "text-amber-500"
                    }`}>
                      {item.type === "overdue"
                        ? tr("overdueLabel") + " " + item.invoice.due
                        : tr("dueSoonLabel") + " " + item.invoice.due
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}

          {overdueCount > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-red-50 dark:bg-red-900/20">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                ⚠️ {overdueCount} {tr("overdueInvoicesAlert")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
