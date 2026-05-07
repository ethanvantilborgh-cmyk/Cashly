"use client";
import Sidebar from "../components/Sidebar";
import { TrendingUp, TrendingDown, FileText, Receipt, AlertCircle, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useLang } from "../context/LangContext";

const RECENT_INVOICES = [
  { id: "INV-001", client: "Acme Corp",     amount: 2400, status: "paid",    date: "2025-04-28" },
  { id: "INV-002", client: "StartupXYZ",    amount: 1800, status: "pending", date: "2025-04-25" },
  { id: "INV-003", client: "Design Studio", amount: 950,  status: "overdue", date: "2025-04-10" },
  { id: "INV-004", client: "Tech Agency",   amount: 3200, status: "paid",    date: "2025-04-05" },
];

const RECENT_EXPENSES = [
  { label: "Adobe Creative Cloud",     amount: 54.99, category: "Logiciels / Software",  date: "2025-04-30" },
  { label: "Déplacement / Travel",     amount: 87.50, category: "Transport",              date: "2025-04-28" },
  { label: "Hébergement / Hosting",    amount: 29.00, category: "Infrastructure",         date: "2025-04-27" },
];

export default function DashboardPage() {
  const { tr } = useLang();

  const STATUS_MAP = {
    paid:    { label: tr("paid"),    className: "status-paid" },
    pending: { label: tr("pending"), className: "status-pending" },
    overdue: { label: tr("overdue"), className: "status-overdue" },
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tr("hello")}</h1>
            <p className="text-slate-500 text-sm mt-1">{tr("dashboardSub")}</p>
          </div>
          <Link href="/invoices" className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("newInvoice")}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: tr("revenue"),      value: "12 450 €", change: "+18%", up: true,  icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: tr("expensesLabel"),value: "3 280 €",  change: "+5%",  up: false, icon: TrendingDown, color: "text-red-500",     bg: "bg-red-50" },
            { label: tr("netProfit"),    value: "9 170 €",  change: "+24%", up: true,  icon: TrendingUp,   color: "text-sky-600",     bg: "bg-sky-50" },
            { label: tr("unpaid"),       value: "2 750 €",  change: "2",    up: false, icon: AlertCircle,  color: "text-amber-600",   bg: "bg-amber-50" },
          ].map(({ label, value, change, up, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-slate-500">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className={`text-xs mt-1 font-medium ${up ? "text-emerald-600" : "text-slate-400"}`}>{change}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
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
              {RECENT_INVOICES.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.client}</p>
                    <p className="text-xs text-slate-400">{inv.id} · {inv.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{inv.amount.toLocaleString()} €</span>
                    <span className={`badge ${STATUS_MAP[inv.status as keyof typeof STATUS_MAP].className}`}>
                      {STATUS_MAP[inv.status as keyof typeof STATUS_MAP].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              {RECENT_EXPENSES.map(exp => (
                <div key={exp.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
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
