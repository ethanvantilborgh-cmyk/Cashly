"use client";
import Sidebar from "../components/Sidebar";
import { BarChart2, TrendingUp, Download, FileText, Receipt } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useLang } from "../context/LangContext";
import { useState, useEffect } from "react";
import { getInvoices, getExpenses, getVatReport, VatQuarter } from "../lib/storage";

export default function ReportsPage() {
  const { lang, tr } = useLang();
  const locale = lang === "nl" ? "nl-NL" : lang === "en" ? "en-GB" : "fr-FR";

  const [monthly, setMonthly]   = useState<{ month: string; revenus: number; depenses: number }[]>([]);
  const [expByCat, setExpByCat] = useState<{ name: string; value: number; color: string }[]>([]);
  const [invStatus, setInvStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [vatReport, setVatReport] = useState<VatQuarter[]>([]);

  useEffect(() => {
    const invoices = getInvoices();
    const expenses = getExpenses();

    // ── Monthly revenue vs expenses (last 6 months) ─────────────────────────
    const now = new Date();
    const months: { month: string; revenus: number; depenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(locale, { month: "short" });
      const revenus  = invoices.filter(inv => inv.status === "paid" && inv.date.startsWith(key)).reduce((s, inv) => s + inv.amount, 0);
      const depenses = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      months.push({ month: label.charAt(0).toUpperCase() + label.slice(1, 3), revenus, depenses });
    }
    setMonthly(months);

    // ── Expenses by category ─────────────────────────────────────────────────
    const COLORS: Record<string, string> = {
      Logiciels: "#8b5cf6", Software: "#8b5cf6",
      Transport: "#0ea5e9",
      Infrastructure: "#64748b", Infrastructuur: "#64748b",
      Marketing: "#f97316",
      Fournitures: "#f59e0b", Supplies: "#f59e0b", Benodigdheden: "#f59e0b",
      Formation: "#10b981", Training: "#10b981", Opleiding: "#10b981",
      Repas: "#f43f5e", Meals: "#f43f5e", Maaltijden: "#f43f5e",
      Autre: "#94a3b8", Other: "#94a3b8", Overig: "#94a3b8",
    };
    const catMap: Record<string, number> = {};
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    setExpByCat(Object.entries(catMap).map(([name, value]) => ({ name, value, color: COLORS[name] || "#94a3b8" })));

    // ── Invoice status breakdown ─────────────────────────────────────────────
    const paid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
    const overdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    setInvStatus([
      { name: tr("paid"),    value: paid,    color: "#10b981" },
      { name: tr("pending"), value: pending, color: "#f59e0b" },
      { name: tr("overdue"), value: overdue, color: "#ef4444" },
    ]);

    // ── VAT report ───────────────────────────────────────────────────────────
    setVatReport(getVatReport());
  }, [lang]);

  const totalRev = monthly.reduce((s, m) => s + m.revenus, 0);
  const totalDep = monthly.reduce((s, m) => s + m.depenses, 0);
  const totalBen = totalRev - totalDep;
  const margin   = totalRev > 0 ? Math.round((totalBen / totalRev) * 100) : 0;
  const grandTotal = invStatus.reduce((s, x) => s + x.value, 0);

  const profit = monthly.map(m => ({ ...m, benefice: m.revenus - m.depenses }));

  function exportCSV() {
    const rows = [
      [tr("monthLabel"), tr("revenue") + " (€)", tr("expensesLabel") + " (€)", tr("netProfit") + " (€)"],
      ...monthly.map(m => [m.month, m.revenus.toString(), m.depenses.toString(), (m.revenus - m.depenses).toString()]),
      ["TOTAL", totalRev.toString(), totalDep.toString(), totalBen.toString()],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cashly-rapport-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-violet-500" /> {tr("reportsTitle")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("reportsSub")} · {tr("realData")}</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 border border-slate-200 text-sm font-semibold px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> {tr("exportCsv")}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: tr("totalRevenue"),  value: `${totalRev.toLocaleString(locale)} €`, color: "text-emerald-600", icon: TrendingUp },
            { label: tr("totalExpenses"), value: `${totalDep.toLocaleString(locale)} €`, color: "text-red-500",     icon: Receipt },
            { label: tr("netProfit"),     value: `${totalBen.toLocaleString(locale)} €`, color: "text-sky-600",     icon: TrendingUp },
            { label: tr("netMargin"),     value: `${margin} %`,                           color: "text-violet-600",  icon: BarChart2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Revenus vs Dépenses */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-1">{tr("revenueVsExpenses")}</h2>
          <p className="text-xs text-slate-400 mb-5">{tr("monthlyComparison")}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString(locale)} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="revenus"  name={tr("revenue")}       fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="depenses" name={tr("expensesLabel")} fill="#f87171" radius={[6,6,0,0]} />
              <Legend formatter={v => <span style={{ fontSize: 12, color: "#64748b" }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Bénéfice */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-1">{tr("profitEvolution")}</h2>
            <p className="text-xs text-slate-400 mb-5">{tr("monthlyProfit")}</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={profit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString(locale)} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="benefice" name={tr("netProfit")} stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dépenses par catégorie */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-1">{tr("expensesByCategory")}</h2>
            <p className="text-xs text-slate-400 mb-5">{tr("thisMonth")}</p>
            {expByCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expByCat} cx="40%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {expByCat.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(v, e) => (
                    <span style={{ fontSize: 11, color: "#64748b" }}>{v} — {(e.payload as {value:number}).value.toFixed(0)} €</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-300 text-sm">{tr("noExpense")}</div>
            )}
          </div>
        </div>

        {/* Statut factures */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> {tr("invoiceStatus")}
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {invStatus.map(({ name, value, color }) => (
              <div key={name} className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}20`, border: `3px solid ${color}` }}>
                  <span className="text-lg font-bold" style={{ color }}>{grandTotal > 0 ? Math.round(value / grandTotal * 100) : 0}%</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{value.toLocaleString(locale)} €</p>
                <p className="text-xs text-slate-400">{name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TVA trimestrielle */}
        {vatReport.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-violet-500" /> {tr("vatReportTitle")}
            </h2>
            <p className="text-xs text-slate-400 mb-5">{tr("vatCollectedLabel")} vs {tr("vatDeductibleLabel")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{tr("quarterLabel")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{tr("revenueHTLabel")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">{tr("vatCollectedLabel")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-sky-600 uppercase tracking-wide">{tr("vatDeductibleLabel")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">{tr("vatDueLabel")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vatReport.map(q => (
                    <tr key={q.label} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{q.label}</td>
                      <td className="py-3 px-3 text-right text-slate-700">{q.revenueHT.toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-medium">{q.vatCollected.toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                      <td className="py-3 px-3 text-right text-sky-600 font-medium">-{q.vatDeductible.toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold px-2.5 py-1 rounded-lg text-sm ${q.vatDue > 0 ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                          {q.vatDue.toLocaleString(locale, { minimumFractionDigits: 2 })} €
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{tr("totalRow")}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-700">{vatReport.reduce((s, q) => s + q.revenueHT, 0).toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">{vatReport.reduce((s, q) => s + q.vatCollected, 0).toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                    <td className="py-3 px-3 text-right font-bold text-sky-600">-{vatReport.reduce((s, q) => s + q.vatDeductible, 0).toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                    <td className="py-3 px-3 text-right font-bold text-violet-700">{vatReport.reduce((s, q) => s + q.vatDue, 0).toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
