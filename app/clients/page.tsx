"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import {
  Users, Plus, Search, X, Check, Building2, Mail, Phone,
  MapPin, Hash, Pencil, Trash2, FileText, ChevronRight, TrendingUp,
} from "lucide-react";
import { useLang } from "../context/LangContext";
import { getClients, upsertClient, deleteClient as dbDeleteClient, getInvoices } from "../lib/db";
import type { Invoice } from "../lib/storage";
import { invoiceTotalTTC } from "../lib/storage";

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  vat: string;
};

const EMPTY_FORM = { name: "", company: "", email: "", phone: "", address: "", vat: "" };

export default function ClientsPage() {
  const { lang, tr } = useLang();
  const locale = lang === "nl" ? "nl-NL" : lang === "en" ? "en-GB" : "fr-FR";

  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saved, setSaved]           = useState(false);

  // Detail panel
  const [selected, setSelected]     = useState<Client | null>(null);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);

  useEffect(() => {
    getClients()
      .then(data => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function openDetail(c: Client) {
    setSelected(c);
    setLoadingInv(true);
    try {
      const all = await getInvoices();
      setClientInvoices(all.filter(i => i.client === c.name));
    } catch { setClientInvoices([]); }
    setLoadingInv(false);
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); }

  function openEdit(c: Client, e: React.MouseEvent) {
    e.stopPropagation();
    setEditId(c.id);
    setForm({ name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, vat: c.vat });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      const updated: Client = { id: editId, ...form };
      await upsertClient(updated);
      setClients(prev => prev.map(c => c.id === editId ? updated : c));
      if (selected?.id === editId) setSelected(updated);
    } else {
      const newClient: Client = { id: crypto.randomUUID(), ...form };
      await upsertClient(newClient);
      setClients(prev => [newClient, ...prev]);
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await dbDeleteClient(id);
    setClients(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function inp(key: keyof typeof EMPTY_FORM, label: string, type = "text", placeholder = "") {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <input
          type={type}
          value={form[key]}
          placeholder={placeholder}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
      </div>
    );
  }

  const STATUS_MAP = {
    paid:    { label: tr("paid"),    cls: "status-paid" },
    pending: { label: tr("pending"), cls: "status-pending" },
    overdue: { label: tr("overdue"), cls: "status-overdue" },
  };

  const totalRevenue = clientInvoices
    .filter(i => i.status === "paid")
    .reduce((s, i) => s + invoiceTotalTTC(i.lines), 0);
  const totalUnpaid = clientInvoices
    .filter(i => i.status !== "paid")
    .reduce((s, i) => s + invoiceTotalTTC(i.lines), 0);

  if (loading) return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {saved && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {tr("clientCreated")}
          </div>
        )}

        <div className="flex h-full">
          {/* ── Left: list ── */}
          <div className={`flex-1 min-w-0 p-6 md:p-8 ${selected ? "hidden md:block" : ""}`}>
            <div className="flex items-center justify-between mb-6 mt-8 md:mt-0">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Users className="w-6 h-6 text-emerald-500" /> {tr("clientsTitle")}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{tr("clientsSub")}</p>
              </div>
              <button
                onClick={openCreate}
                className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white"
              >
                <Plus className="w-4 h-4" /> {tr("newClient")}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: tr("totalClients"),    value: clients.length,                          color: "text-slate-900" },
                { label: tr("clientsWithVAT"),  value: clients.filter(c => c.vat).length,       color: "text-emerald-600" },
                { label: tr("clientsCompanies"),value: clients.filter(c => c.company).length,   color: "text-sky-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr("search")}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">{tr("noClient")}</p>
                <button
                  onClick={openCreate}
                  className="mt-4 gradient-btn text-sm font-semibold px-5 py-2 rounded-xl text-white inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {tr("newClient")}
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map(c => (
                  <div
                    key={c.id}
                    onClick={() => openDetail(c)}
                    className={`card p-5 hover:shadow-md transition-all cursor-pointer ${selected?.id === c.id ? "ring-2 ring-emerald-400 border-emerald-300" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 gradient-btn rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={e => openEdit(c, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleDelete(c.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{c.name}</h3>
                    {c.company && (
                      <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {c.company}
                      </p>
                    )}
                    <div className="space-y-1">
                      {c.email   && <p className="text-xs text-slate-500 flex items-center gap-2"><Mail  className="w-3 h-3 text-slate-300" /> {c.email}</p>}
                      {c.phone   && <p className="text-xs text-slate-500 flex items-center gap-2"><Phone className="w-3 h-3 text-slate-300" /> {c.phone}</p>}
                      {c.address && <p className="text-xs text-slate-500 flex items-center gap-2"><MapPin className="w-3 h-3 text-slate-300" /> {c.address}</p>}
                      {c.vat     && <p className="text-xs text-emerald-600 flex items-center gap-2 font-medium"><Hash className="w-3 h-3" /> {c.vat}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: detail panel ── */}
          {selected && (
            <div className="w-full md:w-96 border-l flex flex-col" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 gradient-btn rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{selected.name}</p>
                    {selected.company && <p className="text-xs text-slate-400">{selected.company}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contact info */}
              <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--card-border)" }}>
                <div className="space-y-2">
                  {selected.email   && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail  className="w-4 h-4 text-slate-300 flex-shrink-0" /> {selected.email}</p>}
                  {selected.phone   && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-300 flex-shrink-0" /> {selected.phone}</p>}
                  {selected.address && <p className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-300 flex-shrink-0" /> {selected.address}</p>}
                  {selected.vat     && <p className="text-sm text-emerald-600 flex items-center gap-2 font-medium"><Hash className="w-4 h-4 flex-shrink-0" /> {selected.vat}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">{tr("clientTotalRevenue")}</p>
                    <p className="font-bold text-emerald-600 text-sm">{totalRevenue.toLocaleString(locale, { minimumFractionDigits: 2 })} €</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">{tr("clientUnpaid")}</p>
                    <p className="font-bold text-amber-600 text-sm">{totalUnpaid.toLocaleString(locale, { minimumFractionDigits: 2 })} €</p>
                  </div>
                </div>
              </div>

              {/* Invoice history */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--card-border)" }}>
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {tr("invoiceHistory")} ({clientInvoices.length})
                  </p>
                </div>
                {loadingInv ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : clientInvoices.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">{tr("noClientInvoices")}</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                    {clientInvoices.map(inv => (
                      <div key={inv.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <p className="text-xs font-mono text-slate-500">{inv.id}</p>
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {invoiceTotalTTC(inv.lines).toLocaleString(locale, { minimumFractionDigits: 2 })} €
                          </p>
                          <p className="text-xs text-slate-400">{inv.date}</p>
                        </div>
                        <span className={`badge ${STATUS_MAP[inv.status].cls}`}>
                          {STATUS_MAP[inv.status].label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {editId ? tr("editClient") : tr("newClientTitle")}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {inp("name",    tr("clientName")    + " *", "text",  tr("placeholderClientName"))}
              {inp("company", tr("clientCompany"),         "text",  tr("placeholderClientCompany"))}
              {inp("email",   tr("clientEmail"),           "email", tr("placeholderClientEmail"))}
              {inp("phone",   tr("clientPhone"),           "tel",   "+32 2 123 45 67")}
              {inp("address", tr("clientAddress"),         "text",  tr("placeholderClientAddress"))}
              {inp("vat",     tr("clientVat"),             "text",  "BE0123456789")}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  {tr("cancel")}
                </button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">
                  {editId ? tr("saveChanges") : tr("addClient")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
