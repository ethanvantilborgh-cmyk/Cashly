"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Package, Plus, X, Check, Pencil, Trash2, Tag } from "lucide-react";
import { useLang } from "../context/LangContext";
import { getServices, saveServices, Service } from "../lib/storage";

const UNITS_FR = ["heure", "jour", "forfait", "unité", "mois"];
const UNITS_EN = ["hour", "day", "package", "unit", "month"];
const UNITS_NL = ["uur", "dag", "forfait", "eenheid", "maand"];

const EMPTY: Omit<Service, "id"> = { name: "", description: "", unitPrice: 0, vatRate: 21, unit: "forfait" };

export default function ServicesPage() {
  const { lang, tr } = useLang();
  const locale = lang === "nl" ? "nl-NL" : lang === "en" ? "en-GB" : "fr-FR";
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState("");

  const UNITS = lang === "nl" ? UNITS_NL : lang === "en" ? UNITS_EN : UNITS_FR;

  useEffect(() => { setServices(getServices()); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function openCreate() { setEditId(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(s: Service) { setEditId(s.id); setForm({ name: s.name, description: s.description, unitPrice: s.unitPrice, vatRate: s.vatRate, unit: s.unit }); setShowModal(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let updated: Service[];
    if (editId) {
      updated = services.map(s => s.id === editId ? { ...s, ...form } : s);
    } else {
      updated = [{ id: Date.now().toString(), ...form }, ...services];
    }
    setServices(updated); saveServices(updated);
    setShowModal(false); setForm(EMPTY);
    showToast(editId ? "✓ " + tr("saveChanges") : "✓ " + tr("addService"));
  }

  function handleDelete(id: string) {
    const updated = services.filter(s => s.id !== id);
    setServices(updated); saveServices(updated);
  }

  const VAT_COLORS: Record<number, string> = { 0: "bg-slate-100 text-slate-600", 6: "bg-sky-100 text-sky-700", 21: "bg-violet-100 text-violet-700" };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-sky-500" /> {tr("services")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("servicesSubtitle")}</p>
          </div>
          <button onClick={openCreate} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("addService")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4"><p className="text-xs text-slate-400 mb-1">{tr("servicesTotal")}</p><p className="text-xl font-bold text-slate-900">{services.length}</p></div>
          <div className="card p-4"><p className="text-xs text-slate-400 mb-1">{tr("servicesAvgPrice")}</p><p className="text-xl font-bold text-emerald-600">{services.length ? Math.round(services.reduce((s, x) => s + x.unitPrice, 0) / services.length).toLocaleString(locale) + " €" : "—"}</p></div>
          <div className="card p-4"><p className="text-xs text-slate-400 mb-1">{tr("servicesHighestPrice")}</p><p className="text-xl font-bold text-sky-600">{services.length ? Math.max(...services.map(s => s.unitPrice)).toLocaleString(locale) + " €" : "—"}</p></div>
        </div>

        {/* Cards */}
        {services.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">{tr("noServices")}</p>
            <button onClick={openCreate} className="mt-4 gradient-btn text-sm font-semibold px-5 py-2 rounded-xl text-white inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> {tr("addService")}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{s.name}</h3>
                {s.description && <p className="text-xs text-slate-400 mb-3">{s.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{s.unitPrice.toLocaleString(locale)} €</p>
                    <p className="text-xs text-slate-400">{tr("unitPer")} {s.unit}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${VAT_COLORS[s.vatRate] || "bg-slate-100 text-slate-600"}`}>
                    {tr("vatAmount")} {s.vatRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editId ? tr("editService") : tr("services")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("serviceName")} *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={tr("exampleServiceName")}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("description")}</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={tr("exampleServiceDescription")}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("amountEur")} *</label>
                  <input required type="number" min="0" step="0.01" value={form.unitPrice || ""} onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("unit")}</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("vatRate")}</label>
                <select value={form.vatRate} onChange={e => setForm({ ...form, vatRate: parseFloat(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white">
                  <option value={0}>{tr("vat0")}</option>
                  <option value={6}>{tr("vat6")}</option>
                  <option value={21}>{tr("vat21")}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">{tr("cancel")}</button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">
                  {editId ? tr("saveChanges") : tr("addService")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
