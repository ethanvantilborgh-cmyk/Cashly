"use client";
import Sidebar from "../components/Sidebar";
import { TrendingUp, TrendingDown, FileText, Receipt, AlertCircle, ArrowUpRight, Plus, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useLang } from "../context/LangContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { activatePro, isPro as dbIsPro } from "../lib/db";
import { getInvoices, getExpenses } from "../lib/db";
import { computeDashboardStats } from "../lib/storage";
import type { Invoice, Expense } from "../lib/storage";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function buildTopClients(invoices: Invoice[]) {
  const map: Record<string, number> = {};
  invoices.filter(i => i.status === "paid").forEach(i => {
    map[i.client] = (map[i.client] || 0) + i.amount;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }));
}

function buildMonthly(invoices: Invoice[], expenses: Expense[], lang: string) {
  const locale = lang === "nl" ? "nl-NL" : lang === "en" ? "en-GB" : "fr-FR";
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(locale, { month: "short" });
    const revenus  = invoices.filter(inv => inv.status === "paid" && inv.date.startsWith(key)).reduce((s, inv) => s + inv.amount, 0);
    const depenses = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    return { month: label.charAt(0).toUpperCase() + label.slice(1, 3), revenus, depenses };
  });
}

function DashboardContent() {
  const { lang, tr } = useLang();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";

  const [stats, setStats]   = useState({ revenue: 0, totalExp: 0, netProfit: 0, unpaidAmt: 0, unpaidCount: 0, recentInvoices: [] as Invoice[], recentExpenses: [] as Expense[] });
  const [monthly, setMonthly]       = useState<{ month: string; revenus: number; depenses: number }[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (upgraded) await activatePro();
      const [invoices, expenses] = await Promise.all([getInvoices(), getExpenses()]);
      setStats(computeDashboardStats(invoices, expenses));
      setMonthly(buildMonthly(invoices, expenses, lang));
      setTopClients(buildTopClients(invoices));
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgraded, lang]);

  const [pro, setPro] = useState(false);
  useEffect(() => { dbIsPro().then(setPro).catch(() => {}); }, []);

  const STATUS_MAP = {
    paid:    { label: tr("paid"),    className: "status-paid" },
    pending: { label: tr("pending"), className: "status-pending" },
    overdue: { label: tr("overdue"), className: "status-overdue" },
  };

  const locale = lang === "nl" ? "nl-NL" : lang === "en" ? "en-GB" : "fr-FR";
  const fmt = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 0 }) + " €";

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 pt-16 md:pt-8 overflow-auto">
        {upgraded && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <PartyPopper className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">{tr("proBannerMessage")}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tr("hello")}</h1>
            <p className="text-slate-500 text-sm mt-1">{tr("dashboardSub")}</p>
          </div>
          <Link href="/invoices" className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("newInvoice")}
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: tr("revenue"),       value: fmt(stats.revenue),   sub: `${stats.recentInvoices.filter(i=>i.status==="paid").length} ${tr("paidInvoicesLabel")}`, up: true,  icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: tr("expensesLabel"), value: fmt(stats.totalExp),  sub: `${stats.recentExpenses.length} ${tr("expensesCountLabel")}`,  up: false, icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50" },
            { label: tr("netProfit"),     value: fmt(stats.netProfit), sub: stats.netProfit >= 0 ? tr("profit") : tr("deficit"), up: stats.netProfit >= 0, icon: TrendingUp, color: stats.netProfit >= 0 ? "text-sky-600" : "text-red-500", bg: stats.netProfit >= 0 ? "bg-sky-50" : "bg-red-50" },
            { label: tr("unpaid"),        value: fmt(stats.unpaidAmt), sub: `${stats.unpaidCount} ${tr("invoices").toLowerCase()}`, up: false, icon: AlertCircle,  color: "text-amber-600",   bg: "bg-amber-50" },
          ].map(({ label, value, sub, up, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-slate-500">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className={`text-xs mt-1 font-medium ${up ? "text-emerald-600" : "text-slate-400"}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">{tr("revenueVsExpenses")}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{tr("reportsSub")}</p>
            </div>
            <Link href="/reports" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              {tr("seeReports")} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}k€` : "0"} width={36} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString(locale)} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Area type="monotone" dataKey="revenus"  name={tr("revenue")}       stroke="#10b981" strokeWidth={2} fill="url(#gRev)" dot={{ fill: "#10b981", r: 3 }} />
              <Area type="monotone" dataKey="depenses" name={tr("expensesLabel")} stroke="#f87171" strokeWidth={2} fill="url(#gDep)" dot={{ fill: "#f87171", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent invoices */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> {tr("recentInvoices")}
              </h2>
              <Link href="/invoices" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                {tr("seeAll")} <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentInvoices.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">{tr("noInvoice")}</p>
              )}
              {stats.recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.client}</p>
                    <p className="text-xs text-slate-400">{inv.id} · {inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{inv.amount.toLocaleString()} €</span>
                    <span className={`badge ${STATUS_MAP[inv.status].className}`}>{STATUS_MAP[inv.status].label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent expenses */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-sky-500" /> {tr("recentExpenses")}
              </h2>
              <Link href="/expenses" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                {tr("seeAll")} <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentExpenses.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">{tr("noExpense")}</p>
              )}
              {stats.recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{exp.label}</p>
                    <p className="text-xs text-slate-400">{exp.category} · {exp.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">-{exp.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <Link href="/expenses" className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors border border-dashed border-slate-200 rounded-xl py-3 hover:border-emerald-300">
              <Plus className="w-4 h-4" /> {tr("addExpense")}
            </Link>
          </div>
        </div>

        {/* Top clients */}
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">{tr("topClients")}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{tr("topClientsSub")}</p>
            </div>
            <Link href="/clients" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              {tr("seeAll")} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {topClients.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">{tr("noTopClients")}</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => {
                const max = topClients[0].revenue;
                const pct = max > 0 ? Math.round((c.revenue / max) * 100) : 0;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800 truncate">{c.name}</span>
                        <span className="text-sm font-semibold text-emerald-600 ml-2">{fmt(c.revenue)} €</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div className="h-1.5 bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pro banner (unused but kept) */}
        {pro && false && <div />}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
