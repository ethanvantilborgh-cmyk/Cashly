"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Plus, Search, ClipboardList, X, Check, ChevronDown, ArrowRight, FileText, Download, Pencil, Trash2 } from "lucide-react";
import { useLang } from "../context/LangContext";
import { getQuotes, saveQuotes, getInvoices, saveInvoices, Quote, QuoteStatus } from "../lib/storage";
import { getSavedClients, Client } from "../clients/page";
import { getCompanySettings } from "../settings/page";

function printQuote(q: Quote) {
  const company = getCompanySettings();
  const vatAmt = q.amount * q.vatRate / 100;
  const ttc = q.amount + vatAmt;
  const STATUS: Record<QuoteStatus, string> = { draft: "Brouillon", sent: "Envoyé", accepted: "Accepté", refused: "Refusé" };
  const STATUS_COLOR: Record<QuoteStatus, string> = { draft: "#94a3b8", sent: "#0ea5e9", accepted: "#10b981", refused: "#ef4444" };

  const companyBlock = company.name
    ? `<div class="company"><div class="company-name">${company.name}</div>${company.address ? `<div>${company.address}</div>` : ""}${company.city ? `<div>${company.city}</div>` : ""}${company.vat ? `<div>TVA: ${company.vat}</div>` : ""}${company.email ? `<div>${company.email}</div>` : ""}</div>`
    : `<div class="company"><div class="company-name">Votre Entreprise</div></div>`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Devis ${q.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;background:white;padding:40px;font-size:14px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
    .logo{font-size:24px;font-weight:800;background:linear-gradient(135deg,#10b981,#0ea5e9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .ref{text-align:right}.ref-num{font-size:22px;font-weight:700;color:#1e293b}.ref-date{color:#64748b;font-size:13px;margin-top:4px}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;color:white;background:${STATUS_COLOR[q.status]};margin-top:8px}
    .divider{height:2px;background:linear-gradient(90deg,#10b981,#0ea5e9);border-radius:1px;margin-bottom:32px}
    .parties{display:flex;justify-content:space-between;margin-bottom:40px}
    .company{line-height:1.7;color:#475569}.company-name{font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px}
    .label{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:600;margin-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-bottom:32px}
    th{text-align:left;padding:12px 16px;background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
    td{padding:16px;border-bottom:1px solid #f1f5f9;font-size:13px}
    .totals{display:flex;justify-content:flex-end;margin-bottom:24px}
    .totals-table{width:280px}.totals-row{display:flex;justify-content:space-between;padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9}
    .totals-final{display:flex;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-radius:12px;margin-top:8px;font-weight:700;font-size:16px}
    .validity{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#166534;line-height:1.8}
    .footer{margin-top:40px;text-align:center;font-size:12px;color:#94a3b8}
    @media print{body{padding:0}}
  </style></head><body>
  <div class="header">
    <div class="logo">Cashly</div>
    <div class="ref">
      <div class="ref-num">DEVIS ${q.id}</div>
      <div class="ref-date">Émis le ${q.date}</div>
      <div class="ref-date">Valable jusqu'au : ${q.due}</div>
      <div class="badge">${STATUS[q.status]}</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="parties">
    <div><div class="label">De</div>${companyBlock}</div>
    <div><div class="label">Destinataire</div>
      <div class="company"><div class="company-name">${q.client}</div>${q.email ? `<div>${q.email}</div>` : ""}</div>
    </div>
  </div>
  <table>
    <thead><tr><th style="width:60%">Description</th><th style="text-align:right">Montant HT</th><th style="text-align:right">TVA</th><th style="text-align:right">Total TTC</th></tr></thead>
    <tbody><tr>
      <td><div style="font-weight:600;color:#1e293b">${q.description || "Prestation de services"}</div></td>
      <td style="text-align:right">${q.amount.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td>
      <td style="text-align:right;color:#64748b">${q.vatRate}%</td>
      <td style="text-align:right;font-weight:600">${ttc.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td>
    </tr></tbody>
  </table>
  <div class="totals"><div class="totals-table">
    <div class="totals-row"><span>Sous-total HT</span><span>${q.amount.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span></div>
    <div class="totals-row"><span>TVA (${q.vatRate}%)</span><span>${vatAmt.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span></div>
    <div class="totals-final"><span>Total TTC</span><span>${ttc.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</span></div>
  </div></div>
  <div class="validity"><strong>Conditions</strong><br/>Ce devis est valable jusqu'au ${q.due}. Merci de nous retourner ce document signé pour acceptation.</div>
  <div class="footer">Généré par Cashly · cashly.app</div>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 300);
}

const EMPTY_FORM = { client: "", email: "", amount: "", due: "", vatRate: "21", description: "" };

export default function QuotesPage() {
  const { tr } = useLang();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
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

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(q: Quote) {
    setEditId(q.id);
    setForm({ client: q.client, email: q.email, amount: q.amount.toString(), due: q.due, vatRate: q.vatRate.toString(), description: q.description });
    setShowModal(true);
  }

  function nextQuoteId(list: Quote[]) {
    const nums = list.map(q => parseInt(q.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `DEV-${String(max + 1).padStart(3, "0")}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      const updated = quotes.map(q => q.id === editId ? { ...q, client: form.client, email: form.email, amount: parseFloat(form.amount), due: form.due, vatRate: parseFloat(form.vatRate), description: form.description } : q);
      setQuotes(updated); saveQuotes(updated);
      showToast("✓ " + tr("saveChanges"));
    } else {
      const newQ: Quote = {
        id: nextQuoteId(quotes),
        client: form.client, email: form.email,
        amount: parseFloat(form.amount),
        status: "draft",
        date: new Date().toISOString().split("T")[0],
        due: form.due, vatRate: parseFloat(form.vatRate), description: form.description,
      };
      const updated = [newQ, ...quotes];
      setQuotes(updated); saveQuotes(updated);
      showToast(tr("quoteCreated"));
    }
    setShowModal(false); setForm(EMPTY_FORM);
  }

  function updateStatus(id: string, status: QuoteStatus) {
    const updated = quotes.map(q => q.id === id ? { ...q, status } : q);
    setQuotes(updated); saveQuotes(updated);
  }

  function deleteQuote(id: string) {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated); saveQuotes(updated);
    showToast(tr("quoteDeleted"));
  }

  function convertToInvoice(q: Quote) {
    const invoices = getInvoices();
    const nums = invoices.map(i => parseInt(i.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
    const maxId = nums.length ? Math.max(...nums) : 0;
    const newInv = {
      id: `INV-${String(maxId + 1).padStart(3, "0")}`,
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
          <button onClick={openCreate} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
            <Plus className="w-4 h-4" /> {tr("newQuote")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: tr("quotesTitle"), value: quotes.length, color: "text-slate-900" },
            { label: tr("quoteSent"),   value: quotes.filter(q => q.status === "sent").length, color: "text-sky-600" },
            { label: tr("quoteSentValue"),    value: totalAccepted.toLocaleString("fr-FR") + " €", color: "text-emerald-600" },
            { label: tr("quoteAwaitingValue"), value: totalPending.toLocaleString("fr-FR") + " €",  color: "text-amber-600" },
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
                      <div className="flex items-center gap-1">
                        {q.status !== "refused" && q.status !== "accepted" && (
                          <button onClick={() => convertToInvoice(q)} title={tr("convertToInvoice")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => openEdit(q)} title="Modifier" className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => printQuote(q)} title="PDF" className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteQuote(q.id)} title="Supprimer" className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        {q.status === "accepted" && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 ml-1">
                            <Check className="w-3 h-3" /> {tr("quoteConverted2")}
                          </span>
                        )}
                      </div>
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
              <button onClick={openCreate} className="mt-4 gradient-btn text-sm font-semibold px-5 py-2 rounded-xl text-white inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> {tr("newQuote")}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal create / edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editId ? tr("editQuote") : tr("newQuoteTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">
                  {editId ? tr("saveChanges") : tr("newQuote")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
