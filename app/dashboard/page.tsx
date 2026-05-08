"use client";
import Sidebar from "../components/Sidebar";
import { TrendingUp, TrendingDown, FileText, Receipt, AlertCircle, ArrowUpRight, Plus, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useLang } from "../context/LangContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { activatePro } from "../lib/pro";
import { getDashboardStats, Invoice, Expense } from "../lib/storage";

function DashboardContent() {
  const { tr } = useLang();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";

  const [stats, setStats] = useState({ revenue: 0, totalExp: 0, netProfit: 0, unpaidAmt: 0, unpaidCount: 0, recentInvoices: [] as Invoice[], recentExpenses: [] as Expense[] });

  useEffect(() => {
    if (upgraded) activatePro();
    setStats(getDashboardStats());
  }, [upgraded]);

  const STATUS_MAP = {
    paid:    { label: tr("paid"),    className: "status-paid" },
    pending: { label: tr("pending"), className: "status-pending" },
    overdue: { label: tr("overdue"), className: "status-overdue" },
  };

  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {upgraded && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <PartyPopper className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">Bienvenue sur Cashly Pro ! Toutes les fonctionnalités sont débloquées. 🎉</p>
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

        {/* Real KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: tr("revenue"),       value: fmt(stats.revenue),    sub: `${stats.recentInvoices.filter(i=>i.status==="paid").length} factures payées`, up: true,  icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: tr("expensesLabel"), value: fmt(stats.totalExp),   sub: `${stats.recentExpenses.length} dépenses`,  up: false, icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50" },
            { label: tr("netProfit"),     value: fmt(stats.netProfit),  sub: stats.netProfit >= 0 ? "Bénéfice" : "Déficit", up: stats.netProfit >= 0, icon: TrendingUp, color: stats.netProfit >= 0 ? "text-sky-600" : "text-red-500", bg: stats.netProfit >= 0 ? "bg-sky-50" : "bg-red-50" },
            { label: tr("unpaid"),        value: fmt(stats.unpaidAmt),  sub: `${stats.unpaidCount} factures`, up: false, icon: AlertCircle,  color: "text-amber-600",   bg: "bg-amber-50" },
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent invoices — real data */}
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

          {/* Recent expenses — real data */}
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
