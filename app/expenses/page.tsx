"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { getExpenses, saveExpenses } from "../lib/storage";
import { Plus, Search, Receipt, X, Check, Pencil, Trash2 } from "lucide-react";
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

const EMPTY_FORM = { label: "", amount: "", category: "", date: "", note: "" };

export default function ExpensesPage() {
  const { lang, tr } = useLang();
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  useEffect(() => { setExpenses(getExpenses()); }, []);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [toast, setToast]         = useState("");

  const CATEGORIES = lang === "nl" ? CATEGORIES_NL : lang === "en" ? CATEGORIES_EN : CATEGORIES_FR;

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, category: CATEGORIES[0] });
    setShowModal(true);
  }

  function openEdit(exp: Expense) {
    setEditId(exp.id);
    // Normalize category: if saved category doesn't exist in current language list, keep it as-is (it will still save correctly)
    const normalizedCategory = CATEGORIES.includes(exp.category) ? exp.category : CATEGORIES[0];
    setForm({ label: exp.label, amount: exp.amount.toString(), category: normalizedCategory, date: exp.date, note: exp.note });
    setShowModal(true);
  }

  const filtered = expenses.filter(e =>
    (filterCat === "all" || e.category === filterCat) &&
    e.label.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    let updated: Expense[];
    if (editId !== null) {
      updated = expenses.map(e => e.id === editId
        ? { ...e, label: form.label, amount: parseFloat(form.amount), category: form.category || CATEGORIES[0], date: form.date, note: form.note }
        : e
      );
      showToast("✓ " + tr("saveChanges"));
    } else {
      updated = [{ id: Date.now(), label: form.label, amount: parseFloat(form.amount), category: form.category || CATEGORIES[0], date: form.date, note: form.note }, ...expenses];
      showToast(tr("expenseAdded"));
    }
    setExpenses(updated); saveExpenses(updated);
    setShowModal(false); setForm(EMPTY_FORM);
  }

  function deleteExpense(id: number) {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated); saveExpenses(updated);
    showToast(tr("expenseDeleted"));
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
          <button onClick={openCreate} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("add")}
          </button>
        </div>

        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {toast}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="card p-4"><p className="text-xs text-slate-400 mb-1">Total dépenses</p><p className="text-xl font-bold text-slate-900">{expenses.length}</p></div>
          <div className="card p-4"><p className="text-xs text-slate-400 mb-1">Total montant</p><p className="text-xl font-bold text-red-500">-{expenses.reduce((s,e)=>s+e.amount,0).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</p></div>
          <div className="card p-4"><p className="text-xs text-slate-400 mb-1">Ce mois</p><p className="text-xl font-bold text-amber-600">-{expenses.filter(e=>e.date.startsWith(new Date().toISOString().slice(0,7))).reduce((s,e)=>s+e.amount,0).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</p></div>
        </div>

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
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
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
              <h2 className="text-lg font-bold text-slate-900">{editId !== null ? tr("editExpense") : tr("addExpenseTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">
                  {editId !== null ? tr("saveChanges") : tr("add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
