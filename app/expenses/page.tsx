"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { getExpenses, saveExpenses } from "../lib/storage";
import { Plus, Search, Receipt, X, Check } from "lucide-react";
import { useLang } from "../context/LangContext";

type Expense = { id: number; label: string; amount: number; category: string; date: string; note: string; };

const CATEGORIES_FR = ["Logiciels", "Transport", "Infrastructure", "Marketing", "Fournitures", "Formation", "Repas", "Autre"];
const CATEGORIES_EN = ["Software", "Transport", "Infrastructure", "Marketing", "Supplies", "Training", "Meals", "Other"];
const CATEGORIES_NL = ["Software", "Transport", "Infrastructuur", "Marketing", "Benodigdheden", "Opleiding", "Maaltijden", "Overig"];

const CAT_COLORS: Record<string, string> = {
  Logiciels: "bg-violet-50 text-violet-700", Software: "bg-violet-50 text-violet-700",
  Transport: "bg-sky-50 text-sky-700",
  Infrastructure: "bg-slate-100 text-slate-700", Infrastructuur: "bg-slate-100 text-slate-700",
  Marketing: "bg-orange-50 text-orange-700",
  Fournitures: "bg-amber-50 text-amber-700", Supplies: "bg-amber-50 text-amber-700", Benodigdheden: "bg-amber-50 text-amber-700",
  Formation: "bg-emerald-50 text-emerald-700", Training: "bg-emerald-50 text-emerald-700", Opleiding: "bg-emerald-50 text-emerald-700",
  Repas: "bg-rose-50 text-rose-700", Meals: "bg-rose-50 text-rose-700", Maaltijden: "bg-rose-50 text-rose-700",
  Autre: "bg-gray-100 text-gray-700", Other: "bg-gray-100 text-gray-700", Overig: "bg-gray-100 text-gray-700",
};

const INITIAL: Expense[] = [
  { id: 1, label: "Adobe Creative Cloud",     amount: 54.99,  category: "Logiciels",      date: "2025-04-30", note: "" },
  { id: 2, label: "Déplacement client Paris", amount: 87.50,  category: "Transport",       date: "2025-04-28", note: "TGV A/R" },
  { id: 3, label: "Hébergement serveur",       amount: 29.00,  category: "Infrastructure", date: "2025-04-27", note: "Vercel Pro" },
  { id: 4, label: "Google Ads",               amount: 150.00, category: "Marketing",       date: "2025-04-25", note: "" },
  { id: 5, label: "Imprimante cartouches",    amount: 34.90,  category: "Fournitures",     date: "2025-04-20", note: "" },
  { id: 6, label: "Formation UX Design",      amount: 299.00, category: "Formation",       date: "2025-04-15", note: "Udemy" },
];

export default function ExpensesPage() {
  const { lang, tr } = useLang();
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  useEffect(() => { setExpenses(getExpenses()); }, []);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ label: "", amount: "", category: "", date: "", note: "" });
  const [saved, setSaved]         = useState(false);

  const CATEGORIES = lang === "nl" ? CATEGORIES_NL : lang === "en" ? CATEGORIES_EN : CATEGORIES_FR;

  const filtered = expenses.filter(e =>
    (filterCat === "all" || e.category === filterCat) &&
    e.label.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  function addExpense(ev: React.FormEvent) {
    ev.preventDefault();
    const updated = [{ id: Date.now(), label: form.label, amount: parseFloat(form.amount), category: form.category || CATEGORIES[0], date: form.date, note: form.note }, ...expenses];
    setExpenses(updated); saveExpenses(updated);
    setShowModal(false);
    setForm({ label: "", amount: "", category: "", date: "", note: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-sky-500" /> {tr("expensesTitle")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("expensesSub")}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("add")}
          </button>
        </div>

        {saved && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {tr("expenseAdded")}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("search")}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterCat("all")}
              className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${filterCat === "all" ? "gradient-btn text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
              {tr("all")}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${filterCat === cat ? "gradient-btn text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{filtered.length} {tr("expensesTitle").toLowerCase()}</span>
            <span className="text-sm font-bold text-red-500">{tr("total")} : -{total.toFixed(2)} €</span>
          </div>
          <div className="divide-y divide-slate-50">
            {filtered.map(exp => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{exp.label}</p>
                  {exp.note && <p className="text-xs text-slate-400">{exp.note}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{exp.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${CAT_COLORS[exp.category] || "bg-gray-100 text-gray-700"}`}>{exp.category}</span>
                  <span className="text-sm font-semibold text-red-500 min-w-20 text-right">-{exp.amount.toFixed(2)} €</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-slate-400">{tr("noExpense")}</div>}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{tr("addExpenseTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("description")} *</label>
                <input required value={form.label} onChange={e => setForm({...form, label: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("amountEur")} *</label>
                  <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("date")} *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("category")}</label>
                <select value={form.category || CATEGORIES[0]} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("note")}</label>
                <input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder={tr("details")}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">{tr("cancel")}</button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">{tr("add")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
