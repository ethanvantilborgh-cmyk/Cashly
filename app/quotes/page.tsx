"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Plus, Search, ClipboardList, X, Check, ChevronDown, ArrowRight, FileText } from "lucide-react";
import { useLang } from "../context/LangContext";
import { getQuotes, saveQuotes, getInvoices, saveInvoices, Quote, QuoteStatus } from "../lib/storage";
import { getSavedClients, Client } from "../clients/page";

const EMPTY_FORM = { client: "", email: "", amount: "", due: "", vatRate: "21", description: "" };

export default function QuotesPage() {
  const { tr } = useLang();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState("");
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => { setQuotes(getQuotes()); setSavedClients(getSavedClients()); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const filtered = quotes.filter(q =>
    q.client.toLowerCase().includes(search.toLowerCase()) ||
    q.id.toLowerCase().includes(search.toLowerCase())
  );

  function createQuote(e: React.FormEvent) {
    e.preventDefault();
    const newQ: Quote = {
      id: `DEV-${String(quotes.length + 1).padStart(3, "0")}`,
      client: form.client, email: form.email,
      amount: parseFloat(form.amount),
      status: "draft",
      date: new Date().toISOString().split("T")[0],
      due: form.due,
      vatRate: parseFloat(form.vatRate),
      description: form.description,
    };
    const updated = [newQ, ...quotes];
    setQuotes(updated); saveQuotes(updated);
    setShowModal(false); setForm(EMPTY_FORM);
    showToast(tr("quoteCreated"));
  }

  function updateStatus(id: string, status: QuoteStatus) {
    const updated = quotes.map(q => q.id === id ? { ...q, status } : q);
    setQuotes(updated); saveQuotes(updated);
  }

  function convertToInvoice(q: Quote) {
    const invoices = getInvoices();
    const newInv = {
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      client: q.client, email: q.email,
      lines: [{ id: Date.now().toString(), description: q.description || "Prestation de services", qty: 1, unitPrice: q.amount, vatRate: q.vatRate }],
      amount: q.amount, status: "pending" as const,
      date: new Date().toISOString().split("T")[0],
      due: q.due, vatRate: q.vatRate, recurring: "none" as const,
    };
    saveInvoices([newInv, ...invoices]);
    const updated = quotes.map(qx => qx.id === q.id ? { ...qx, status: "accepted" as const } : qx);
    setQuotes(updated); saveQuotes(updated);
    showToast(tr("quoteConverted"));
  }

  const STATUS_STYLE: Record<QuoteStatus, string> = {
    draft:    "bg-slate-100 text-slate-600",
    sent:     "bg-sky-100 text-sky-700",
    accepted: "bg-emerald-100 text-emerald-700",
    refused:  "bg-red-100 text-red-600",
  };

  const STATUS_LABEL: Record<QuoteStatus, string> = {
    draft:    tr("quoteDraft"),
    sent:     tr("quoteSent"),
    accepted: tr("quoteAccepted"),
    refused:  tr("quoteRefused"),
  };

  const totalAccepted = quotes.filter(q => q.status === "accepted").reduce((s, q) => s + q.amount, 0);
  const totalPending  = quotes.filter(q => q.status === "sent").reduce((s, q) => s + q.amount, 0);

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
              <ClipboardList className="w-6 h-6 text-violet-500" /> {tr("quotesTitle")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("quotesSub")}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("newQuote")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: tr("quotesTitle"), value: quotes.length, color: "text-slate-900" },
            { label: tr("quoteSent"),   value: quotes.filter(q => q.status === "sent").length, color: "text-sky-600" },
            { label: tr("quoteAccepted") + " (€)", value: totalAccepted.toLocaleString("fr-FR") + " €", color: "text-emerald-600" },
            { label: tr("quoteSent") + " (€)",     value: totalPending.toLocaleString("fr-FR") + " €",  color: "text-amber-600" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("search")}
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[tr("reference"), tr("client"), tr("amountHT"), tr("vatRate"), tr("amountTTC"), tr("dueDate"), tr("status"), tr("actions")].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(q => {
                const ttc = q.amount * (1 + q.vatRate / 100);
                return (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{q.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{q.client}</p>
                      <p className="text-xs text-slate-400">{q.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{q.amount.toLocaleString()} €</td>
                    <td className="px-4 py-3 text-slate-500">{q.vatRate}%</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{ttc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
                    <td className="px-4 py-3 text-slate-500">{q.due}</td>
                    <td className="px-4 py-3">
                      <select value={q.status} onChange={e => updateStatus(q.id, e.target.value as QuoteStatus)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${STATUS_STYLE[q.status]}`}>
                        <option value="draft">{tr("quoteDraft")}</option>
                        <option value="sent">{tr("quoteSent")}</option>
                        <option value="accepted">{tr("quoteAccepted")}</option>
                        <option value="refused">{tr("quoteRefused")}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {q.status !== "refused" && q.status !== "accepted" && (
                        <button onClick={() => convertToInvoice(q)} title={tr("convertToInvoice")}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                          <FileText className="w-3 h-3" /> <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {q.status === "accepted" && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Converti
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">{tr("noQuote")}</p>
              <button onClick={() => setShowModal(true)} className="mt-4 gradient-btn text-sm font-semibold px-5 py-2 rounded-xl text-white inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> {tr("newQuote")}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{tr("newQuoteTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createQuote} className="space-y-4">
              {/* Client dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("clientName")} *</label>
                {savedClients.length > 0 && (
                  <div className="relative mb-2">
                    <button type="button" onClick={() => setShowDrop(d => !d)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between text-slate-500 hover:border-emerald-400">
                      {form.client || tr("selectClient")} <ChevronDown className="w-4 h-4" />
                    </button>
                    {showDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                        {savedClients.map(c => (
                          <button key={c.id} type="button" onClick={() => { setForm(f => ({ ...f, client: c.name, email: c.email })); setShowDrop(false); }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 border-b border-slate-50 last:border-0">
                            <p className="font-medium text-slate-900">{c.name}</p>
                            {c.company && <p className="text-xs text-slate-400">{c.company}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <input required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("clientEmail")}</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("quoteDescription")}</label>
                <textarea value={form.description} rows={2} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Développement site web, design logo..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("amountHT")} (€) *</label>
                  <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("vatRate")} *</label>
                  <select value={form.vatRate} onChange={e => setForm({ ...form, vatRate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white">
                    <option value="0">{tr("vat0")}</option>
                    <option value="6">{tr("vat6")}</option>
                    <option value="21">{tr("vat21")}</option>
                  </select>
                </div>
              </div>
              {form.amount && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between"><span>HT</span><span>{parseFloat(form.amount || "0").toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
                  <div className="flex justify-between"><span>TVA {form.vatRate}%</span><span>{(parseFloat(form.amount || "0") * parseFloat(form.vatRate) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1"><span>TTC</span><span>{(parseFloat(form.amount || "0") * (1 + parseFloat(form.vatRate) / 100)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("dueDate")} (validité) *</label>
                <input required type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">{tr("cancel")}</button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">{tr("newQuote")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
