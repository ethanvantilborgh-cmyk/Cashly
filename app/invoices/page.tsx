"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Plus, Search, FileText, Download, Send, X, Check, Lock, Crown, ChevronDown } from "lucide-react";
import { useLang } from "../context/LangContext";
import { printInvoice } from "../lib/printInvoice";
import { isPro, FREE_INVOICE_LIMIT } from "../lib/pro";
import UpgradeButton from "../components/UpgradeButton";
import { getSavedClients, Client } from "../clients/page";

type Invoice = {
  id: string; client: string; email: string; amount: number;
  status: "paid" | "pending" | "overdue"; date: string; due: string;
  vatRate: number;
};

const INITIAL: Invoice[] = [
  { id: "INV-001", client: "Acme Corp",      email: "contact@acme.com",   amount: 2400, status: "paid",    date: "2025-04-28", due: "2025-05-28", vatRate: 21 },
  { id: "INV-002", client: "StartupXYZ",     email: "hello@startup.xyz",  amount: 1800, status: "pending", date: "2025-04-25", due: "2025-05-25", vatRate: 21 },
  { id: "INV-003", client: "Design Studio",  email: "info@design.fr",     amount: 950,  status: "overdue", date: "2025-04-10", due: "2025-04-25", vatRate: 21 },
  { id: "INV-004", client: "Tech Agency",    email: "billing@tech.io",    amount: 3200, status: "paid",    date: "2025-04-05", due: "2025-05-05", vatRate: 0 },
  { id: "INV-005", client: "Cloud Services", email: "finance@cloud.net",  amount: 780,  status: "pending", date: "2025-03-30", due: "2025-04-30", vatRate: 6 },
];

export default function InvoicesPage() {
  const { tr } = useLang();
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({ client: "", email: "", amount: "", due: "", vatRate: "21" });
  const [saved, setSaved] = useState(false);
  const [pro, setPro] = useState(false);
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [showClientDrop, setShowClientDrop] = useState(false);

  useEffect(() => { setPro(isPro()); setSavedClients(getSavedClients()); }, []);

  const STATUS_MAP = {
    paid:    { label: tr("paid"),    className: "status-paid" },
    pending: { label: tr("pending"), className: "status-pending" },
    overdue: { label: tr("overdue"), className: "status-overdue" },
  };

  const filtered = invoices.filter(inv =>
    inv.client.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase())
  );

  function handleNewInvoice() {
    if (!pro && invoices.length >= FREE_INVOICE_LIMIT) {
      setShowUpgrade(true);
    } else {
      setForm({ client: "", email: "", amount: "", due: "", vatRate: "21" });
      setShowModal(true);
    }
  }

  function selectClient(c: Client) {
    setForm(f => ({ ...f, client: c.name, email: c.email }));
    setShowClientDrop(false);
  }

  function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    const newInv: Invoice = {
      id: `INV-00${invoices.length + 1}`,
      client: form.client, email: form.email,
      amount: parseFloat(form.amount),
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      due: form.due,
      vatRate: parseFloat(form.vatRate),
    };
    setInvoices([newInv, ...invoices]);
    setShowModal(false);
    setForm({ client: "", email: "", amount: "", due: "", vatRate: "21" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const total   = invoices.reduce((s, i) => s + i.amount, 0);
  const paid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-500" /> {tr("invoicesTitle")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("invoicesSub")}</p>
          </div>
          <button onClick={handleNewInvoice} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("newInvoice")}
          </button>
        </div>

        {saved && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" /> {tr("invoiceCreated")}
          </div>
        )}

        {/* Free plan limit bar */}
        {!pro && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-amber-800">Plan Gratuit — {invoices.length}/{FREE_INVOICE_LIMIT} factures</p>
                {invoices.length >= FREE_INVOICE_LIMIT && <span className="text-xs text-red-500 font-semibold">Limite atteinte</span>}
              </div>
              <div className="h-2 bg-amber-100 rounded-full">
                <div className="h-2 bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min((invoices.length / FREE_INVOICE_LIMIT) * 100, 100)}%` }} />
              </div>
            </div>
            <UpgradeButton label="Passer Pro →" className="gradient-btn text-xs font-semibold px-4 py-2 rounded-lg text-white flex-shrink-0" />
          </div>
        )}

        {pro && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Cashly Pro · Factures illimitées ✓</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: tr("totalBilled"), value: total,   color: "text-slate-900" },
            { label: tr("collected"),   value: paid,    color: "text-emerald-600" },
            { label: tr("toCollect"),   value: pending, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value.toLocaleString()} €</p>
            </div>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tr("search")}
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
        </div>

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
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{inv.client}</p>
                    <p className="text-xs text-slate-400">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{inv.amount.toLocaleString()} €</td>
                  <td className="px-4 py-3 text-slate-500">{inv.vatRate}%</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{(inv.amount * (1 + inv.vatRate / 100)).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                  <td className="px-4 py-3 text-slate-500">{inv.due}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_MAP[inv.status].className}`}>{STATUS_MAP[inv.status].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title={tr("actions")}>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => printInvoice(inv)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Télécharger PDF">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-slate-400">{tr("noInvoice")}</div>}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{tr("newInvoiceTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createInvoice} className="space-y-4">
              {/* Client selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("clientName")} *</label>
                {savedClients.length > 0 && (
                  <div className="relative mb-2">
                    <button type="button" onClick={() => setShowClientDrop(d => !d)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between text-slate-500 hover:border-emerald-400 transition-all">
                      {form.client || tr("selectClient")}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showClientDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        {savedClients.map(c => (
                          <button key={c.id} type="button" onClick={() => selectClient(c)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0">
                            <p className="font-medium text-slate-900">{c.name}</p>
                            {c.company && <p className="text-xs text-slate-400">{c.company}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <input required value={form.client} onChange={e => setForm({...form, client: e.target.value})}
                  placeholder={savedClients.length > 0 ? tr("orTypeManually") : ""}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("clientEmail")}</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("amountHT")} (€) *</label>
                  <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("vatRate")} *</label>
                  <select value={form.vatRate} onChange={e => setForm({...form, vatRate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white">
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("dueDate")} *</label>
                <input required type="date" value={form.due} onChange={e => setForm({...form, due: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">{tr("cancel")}</button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">{tr("createInvoice")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-14 h-14 gradient-btn rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Limite atteinte</h2>
            <p className="text-slate-500 text-sm mb-6">
              Le plan gratuit est limité à <strong>{FREE_INVOICE_LIMIT} factures</strong>.<br/>
              Passez Pro pour des factures illimitées.
            </p>
            <ul className="text-left space-y-2 mb-6">
              {["Factures illimitées", "Export PDF professionnel", "Rapports avancés", "Support prioritaire"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <UpgradeButton label="Passer Pro — 19€/mois" className="gradient-btn w-full font-semibold py-3 rounded-xl text-white mb-3" />
            <button onClick={() => setShowUpgrade(false)} className="text-sm text-slate-400 hover:text-slate-600 w-full py-2">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
