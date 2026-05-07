"use client";
import Sidebar from "../components/Sidebar";
import { BarChart2, TrendingUp, Download, FileText } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const MONTHLY = [
  { month: "Nov", revenus: 8200,  depenses: 2100 },
  { month: "Déc", revenus: 9500,  depenses: 2800 },
  { month: "Jan", revenus: 7800,  depenses: 1900 },
  { month: "Fév", revenus: 10200, depenses: 2500 },
  { month: "Mar", revenus: 11400, depenses: 3100 },
  { month: "Avr", revenus: 12450, depenses: 3280 },
];

const PROFIT = MONTHLY.map(m => ({ ...m, benefice: m.revenus - m.depenses }));

const EXPENSES_BY_CAT = [
  { name: "Logiciels",      value: 320, color: "#8b5cf6" },
  { name: "Transport",      value: 210, color: "#0ea5e9" },
  { name: "Infrastructure", value: 145, color: "#64748b" },
  { name: "Marketing",      value: 450, color: "#f97316" },
  { name: "Formation",      value: 299, color: "#10b981" },
  { name: "Autre",          value: 180, color: "#f43f5e" },
];

const INVOICE_STATUS = [
  { name: "Payées",      value: 8950,  color: "#10b981" },
  { name: "En attente",  value: 2580,  color: "#f59e0b" },
  { name: "En retard",   value: 950,   color: "#ef4444" },
];

export default function ReportsPage() {
  const totalRev = MONTHLY.reduce((s, m) => s + m.revenus, 0);
  const totalDep = MONTHLY.reduce((s, m) => s + m.depenses, 0);
  const totalBen = totalRev - totalDep;
  const margin = Math.round((totalBen / totalRev) * 100);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-violet-500" /> Rapports financiers
            </h1>
            <p className="text-slate-500 text-sm mt-1">6 derniers mois · Nov 2024 — Avr 2025</p>
          </div>
          <button className="flex items-center gap-2 border border-slate-200 text-sm font-semibold px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Revenus totaux",  value: `${totalRev.toLocaleString("fr-FR")} €`, color: "text-emerald-600", icon: TrendingUp },
            { label: "Dépenses totales", value: `${totalDep.toLocaleString("fr-FR")} €`, color: "text-red-500",     icon: TrendingUp },
            { label: "Bénéfice net",     value: `${totalBen.toLocaleString("fr-FR")} €`, color: "text-sky-600",     icon: TrendingUp },
            { label: "Marge nette",      value: `${margin} %`,                           color: "text-violet-600",  icon: BarChart2 },
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
          <h2 className="font-semibold text-slate-900 mb-1">Revenus vs Dépenses</h2>
          <p className="text-xs text-slate-400 mb-5">Comparaison mensuelle</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MONTHLY} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k€`} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="revenus"  name="Revenus"  fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="#f87171" radius={[6,6,0,0]} />
              <Legend formatter={v => <span style={{ fontSize: 12, color: "#64748b" }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Bénéfice */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Évolution du bénéfice</h2>
            <p className="text-xs text-slate-400 mb-5">Bénéfice mensuel net</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={PROFIT}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k€`} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="benefice" name="Bénéfice" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: "#0ea5e9", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dépenses par catégorie */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Dépenses par catégorie</h2>
            <p className="text-xs text-slate-400 mb-5">Répartition ce mois-ci</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={EXPENSES_BY_CAT} cx="40%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {EXPENSES_BY_CAT.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toFixed(2)} €`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(v, e) => (
                  <span style={{ fontSize: 11, color: "#64748b" }}>{v} — {(e.payload as {value:number}).value} €</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statut factures */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Statut des factures
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {INVOICE_STATUS.map(({ name, value, color }) => (
              <div key={name} className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}20`, border: `3px solid ${color}` }}>
                  <span className="text-lg font-bold" style={{ color }}>{Math.round(value / 12482 * 100)}%</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{value.toLocaleString("fr-FR")} €</p>
                <p className="text-xs text-slate-400">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
