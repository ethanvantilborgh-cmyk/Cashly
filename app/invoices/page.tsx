"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { Plus, Search, FileText, Download, X, Check, Lock, Crown, ChevronDown, CheckCircle2, Link2, Mail, FileDown, RefreshCw, Trash2, Package, Pencil, Copy } from "lucide-react";
import { useLang } from "../context/LangContext";
import { printInvoice } from "../lib/printInvoice";
import { isPro, FREE_INVOICE_LIMIT } from "../lib/pro";
import UpgradeButton from "../components/UpgradeButton";
import { getSavedClients, Client } from "../clients/page";
import {
  getInvoices, saveInvoices, getServices,
  Invoice, InvoiceLine, RecurringFreq, Service,
  newLine, lineHT, lineTVA, invoiceTotalHT, invoiceTotalTVA, invoiceTotalTTC,
  generateNextInvoice, nextRecurringDate,
} from "../lib/storage";

type StatusFilter = "all" | "paid" | "pending" | "overdue";

export default function InvoicesPage() {
  const { lang, tr } = useLang();
  const locale = lang === "nl" ? "nl-NL" : lang === "en" ? "en-GB" : "fr-FR";

  const RECURRING_LABELS: Record<RecurringFreq, string> = {
    none: "", monthly: "🔁 " + tr("recurringMonthly"), quarterly: "🔁 " + tr("recurringQuarterly"), yearly: "🔁 " + tr("recurringYearly"),
  };
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [client, setClient] = useState({ name: "", email: "" });
  const [lines, setLines] = useState<InvoiceLine[]>([newLine()]);
  const [due, setDue] = useState("");
  const [recurring, setRecurring] = useState<RecurringFreq>("none");
  const [pro, setPro] = useState(false);
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [toast, setToast] = useState("");
  const [payLoading, setPayLoading] = useState<string | null>(null);

  useEffect(() => {
    setPro(isPro()); setSavedClients(getSavedClients());
    setInvoices(getInvoices()); setServices(getServices());
  }, []);

  function persist(updated: Invoice[]) { setInvoices(updated); saveInvoices(updated); }
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function nextInvId(list: Invoice[]) {
    const nums = list.map(i => parseInt(i.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `INV-${String(max + 1).padStart(3, "0")}`;
  }

  function markAsPaid(id: string) {
    persist(invoices.map(i => i.id === id ? { ...i, status: "paid" as const } : i));
    showToast("✓ " + tr("invoiceMarkedPaid"));
  }

  function deleteInvoice(id: string) {
    persist(invoices.filter(i => i.id !== id));
    showToast(tr("invoiceDeleted"));
  }

  function duplicateInvoice(inv: Invoice) {
    const dup: Invoice = {
      ...inv,
      id: nextInvId(invoices),
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      lines: inv.lines.map(l => ({ ...l, id: Date.now().toString() + Math.random() })),
    };
    persist([dup, ...invoices]);
    showToast("✓ " + dup.id + " — " + tr("invoiceDuplicated"));
  }

  function openEdit(inv: Invoice) {
    setEditId(inv.id);
    setClient({ name: inv.client, email: inv.email });
    setLines(inv.lines.map(l => ({ ...l })));
    setDue(inv.due);
    setRecurring(inv.recurring);
    setShowModal(true);
  }

  function sendReminder(inv: Invoice) {
    const ttc = invoiceTotalTTC(inv.lines).toLocaleString(locale, { minimumFractionDigits: 2 });
    const subject = encodeURIComponent(tr("reminderEmailSubject").replace("{id}", inv.id).replace("{amount}", ttc));
    const body = encodeURIComponent(tr("reminderEmailBody").replace("{id}", inv.id).replace("{amount}", ttc).replace("{due}", inv.due));
    window.open(`mailto:${inv.email}?subject=${subject}&body=${body}`);
  }

  async function copyPaymentLink(inv: Invoice) {
    setPayLoading(inv.id);
    try {
      const ttc = invoiceTotalTTC(inv.lines);
      const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: ttc, invoiceId: inv.id, clientName: inv.client, vatRate: 0 }),
      });
      const data = await res.json();
      if (data.url) { await navigator.clipboard.writeText(data.url); showToast(tr("paymentLinkCopied")); }
      else showToast("⚠️ " + (data.error || tr("connectionError")));
    } catch { showToast(tr("connectionError")); }
    setPayLoading(null);
  }

  function doGenerateNext(inv: Invoice) {
    const next = generateNextInvoice(inv, invoices);
    persist([next, ...invoices]);
    showToast("✓ " + next.id + " " + tr("invoiceGeneratedFor") + " " + next.due);
  }

  function exportCSV() {
    const rows = [
      [tr("reference"), tr("client"), tr("email"), tr("amountHT"), tr("vatAmount"), tr("totalTTC"), tr("status"), tr("date"), tr("dueDate"), tr("recurring")],
      ...invoices.map(i => {
        const ttc = invoiceTotalTTC(i.lines);
        const tva = invoiceTotalTVA(i.lines);
        return [i.id, i.client, i.email, i.amount.toFixed(2), tva.toFixed(2), ttc.toFixed(2), i.status, i.date, i.due, i.recurring];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `cashly-factures-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function handleNewInvoice() {
    if (!pro && invoices.length >= FREE_INVOICE_LIMIT) setShowUpgrade(true);
    else { setEditId(null); setClient({ name: "", email: "" }); setLines([newLine()]); setDue(""); setRecurring("none"); setShowModal(true); }
  }

  // Line helpers
  function updateLine(id: string, key: keyof InvoiceLine, val: string | number) {
    setLines(ls => ls.map(l => l.id === id ? { ...l, [key]: typeof val === "string" && key !== "description" ? parseFloat(val) || 0 : val } : l));
  }
  function removeLine(id: string) { if (lines.length > 1) setLines(ls => ls.filter(l => l.id !== id)); }
  function addLineFromService(s: Service) {
    setLines(ls => [...ls.filter(l => l.description || l.unitPrice), { id: Date.now().toString(), description: s.name, qty: 1, unitPrice: s.unitPrice, vatRate: s.vatRate }]);
    setShowCatalog(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const totalHT = invoiceTotalHT(lines);
    if (editId) {
      // Update existing invoice
      const updated = invoices.map(i => i.id === editId ? {
        ...i,
        client: client.name, email: client.email,
        lines, amount: totalHT,
        due, vatRate: lines[0]?.vatRate ?? 21, recurring,
      } : i);
      persist(updated);
      showToast("✓ " + tr("saveChanges"));
    } else {
      // Create new invoice
      const newInv: Invoice = {
        id: nextInvId(invoices),
        client: client.name, email: client.email,
        lines, amount: totalHT, status: "pending",
        date: new Date().toISOString().split("T")[0],
        due, vatRate: lines[0]?.vatRate ?? 21, recurring,
      };
      persist([newInv, ...invoices]);
      showToast(tr("invoiceCreated"));
    }
    setShowModal(false);
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.client.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total   = invoices.reduce((s, i) => s + i.amount, 0);
  const paid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  const STATUS_MAP = {
    paid:    { label: tr("paid"),    className: "status-paid" },
    pending: { label: tr("pending"), className: "status-pending" },
    overdue: { label: tr("overdue"), className: "status-overdue" },
  };

  const FILTERS: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all",     label: tr("all"),     count: invoices.length },
    { key: "pending", label: tr("pending"), count: invoices.filter(i => i.status === "pending").length },
    { key: "overdue", label: tr("overdue"), count: invoices.filter(i => i.status === "overdue").length },
    { key: "paid",    label: tr("paid"),    count: invoices.filter(i => i.status === "paid").length },
  ];

  const totalHT  = invoiceTotalHT(lines);
  const totalTVA = invoiceTotalTVA(lines);
  const totalTTC = invoiceTotalTTC(lines);

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
              <FileText className="w-6 h-6 text-emerald-500" /> {tr("invoicesTitle")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{tr("invoicesSub")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 border border-slate-200 text-sm font-semibold px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
              <FileDown className="w-4 h-4" /> {tr("exportCsv")}
            </button>
            <button onClick={handleNewInvoice} className="gradient-btn flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white">
              <Plus className="w-4 h-4" /> {tr("newInvoice")}
            </button>
          </div>
        </div>

        {!pro && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-amber-800">{tr("freePlan")} — {invoices.length}/{FREE_INVOICE_LIMIT} {tr("invoices").toLowerCase()}</p>
                {invoices.length >= FREE_INVOICE_LIMIT && <span className="text-xs text-red-500 font-semibold">{tr("limitReached")}</span>}
              </div>
              <div className="h-2 bg-amber-100 rounded-full">
                <div className="h-2 bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min((invoices.length / FREE_INVOICE_LIMIT) * 100, 100)}%` }} />
              </div>
            </div>
            <UpgradeButton label={tr("upgradePro") + " →"} className="gradient-btn text-xs font-semibold px-4 py-2 rounded-lg text-white flex-shrink-0" />
          </div>
        )}
        {pro && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">{tr("proPlan")} · {tr("unlimitedInvoices")}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-5">
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

        {/* Filters + Search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === f.key ? "gradient-btn text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === f.key ? "bg-white/30 text-white" : "bg-slate-100 text-slate-500"}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("search")}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[tr("reference"), tr("client"), tr("lines"), tr("amountHT"), tr("amountTTC"), tr("dueDate"), tr("status"), tr("actions")].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-500">{inv.id}</p>
                    {inv.recurring !== "none" && <p className="text-xs text-emerald-600 font-medium mt-0.5">{RECURRING_LABELS[inv.recurring]}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{inv.client}</p>
                    <p className="text-xs text-slate-400">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{inv.lines.length} {tr("lines").toLowerCase()}</td>
                  <td className="px-4 py-3 text-slate-700">{invoiceTotalHT(inv.lines).toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{invoiceTotalTTC(inv.lines).toLocaleString(locale, { minimumFractionDigits: 2 })} €</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-500">{inv.due}</p>
                    {inv.recurring !== "none" && nextRecurringDate(inv) && (
                      <p className="text-xs text-emerald-600 mt-0.5">{tr("nextInvoice")}: {nextRecurringDate(inv)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_MAP[inv.status].className}`}>{STATUS_MAP[inv.status].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {inv.status !== "paid" && (
                        <button onClick={() => markAsPaid(inv.id)} title={tr("markAsPaid")} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => openEdit(inv)} title={tr("editLabel")} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => duplicateInvoice(inv)} title={tr("duplicate")} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                      {inv.email && inv.status !== "paid" && (
                        <button onClick={() => sendReminder(inv)} title={tr("sendReminder")} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"><Mail className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => copyPaymentLink(inv)} title={tr("copyPaymentLink")} disabled={payLoading === inv.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"><Link2 className="w-3.5 h-3.5" /></button>
                      {inv.recurring !== "none" && (
                        <button onClick={() => doGenerateNext(inv)} title={tr("generateNext")} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => printInvoice(inv)} title={tr("pdf")} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteInvoice(inv.id)} title={tr("deleteLabel")} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-slate-400">{tr("noInvoice")}</div>}
        </div>
      </main>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm p-6 text-center shadow-2xl">
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">{tr("limitReached")}</h2>
            <p className="text-sm text-slate-500 mb-5">{tr("upgradeDesc")}</p>
            <UpgradeButton label={tr("upgradeProFull")} className="gradient-btn w-full font-semibold py-3 rounded-xl text-white flex items-center justify-center gap-2" />
            <button onClick={() => setShowUpgrade(false)} className="mt-3 text-sm text-slate-400 hover:text-slate-600">{tr("cancel")}</button>
          </div>
        </div>
      )}

      {/* Create / Edit invoice modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editId ? tr("editInvoice") : tr("newInvoiceTitle")}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("clientName")} *</label>
                  {savedClients.length > 0 && (
                    <div className="relative mb-2">
                      <button type="button" onClick={() => setShowClientDrop(d => !d)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-left flex items-center justify-between text-slate-500 hover:border-emerald-400">
                        {client.name || tr("selectClient")} <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      </button>
                      {showClientDrop && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                          {savedClients.map(c => (
                            <button key={c.id} type="button" onClick={() => { setClient({ name: c.name, email: c.email }); setShowClientDrop(false); }}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-emerald-50 border-b border-slate-50 last:border-0">
                              <p className="font-medium text-slate-900">{c.name}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <input required value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("clientEmail")}</label>
                  <input type="email" value={client.email} onChange={e => setClient(c => ({ ...c, email: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 mt-[calc(2rem+2px)]" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">{tr("invoiceLines")}</label>
                  <button type="button" onClick={() => setShowCatalog(s => !s)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors">
                    <Package className="w-3.5 h-3.5" /> {tr("catalog")}
                  </button>
                </div>

                {showCatalog && services.length > 0 && (
                  <div className="mb-3 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {services.map(s => (
                      <button key={s.id} type="button" onClick={() => addLineFromService(s)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.unitPrice} €/{s.unit} · TVA {s.vatRate}%</p>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-slate-400 uppercase px-1">
                    <span className="col-span-5">{tr("description")}</span>
                    <span className="col-span-2 text-center">{tr("qty")}</span>
                    <span className="col-span-2 text-right">{tr("unitPriceLabel")}</span>
                    <span className="col-span-2 text-right">{tr("vatAmount")}</span>
                    <span className="col-span-1"></span>
                  </div>
                  {lines.map(line => (
                    <div key={line.id} className="grid grid-cols-12 gap-1 items-center">
                      <input value={line.description} onChange={e => updateLine(line.id, "description", e.target.value)}
                        placeholder={tr("description") + "..."} required
                        className="col-span-5 border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-emerald-400" />
                      <input type="number" min="0.01" step="0.01" value={line.qty || ""} onChange={e => updateLine(line.id, "qty", e.target.value)}
                        className="col-span-2 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-emerald-400 text-center" />
                      <input type="number" min="0" step="0.01" value={line.unitPrice || ""} onChange={e => updateLine(line.id, "unitPrice", e.target.value)}
                        className="col-span-2 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-emerald-400 text-right" />
                      <select value={line.vatRate} onChange={e => updateLine(line.id, "vatRate", e.target.value)}
                        className="col-span-2 border border-slate-200 rounded-lg px-1 py-2 text-sm outline-none focus:border-emerald-400 bg-white">
                        <option value={0}>0%</option><option value={6}>6%</option><option value={21}>21%</option>
                      </select>
                      <button type="button" onClick={() => removeLine(line.id)} className="col-span-1 p-1.5 text-slate-300 hover:text-red-400 transition-colors flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => setLines(ls => [...ls, newLine(lines[lines.length - 1]?.vatRate ?? 21)])}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> {tr("addLine")}
                </button>

                <div className="mt-3 bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600"><span>{tr("subtotalHT")}</span><span>{totalHT.toLocaleString(locale, { minimumFractionDigits: 2 })} €</span></div>
                  <div className="flex justify-between text-slate-600"><span>{tr("vatAmount")}</span><span>{totalTVA.toLocaleString(locale, { minimumFractionDigits: 2 })} €</span></div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1"><span>{tr("totalTTC")}</span><span>{totalTTC.toLocaleString(locale, { minimumFractionDigits: 2 })} €</span></div>
                </div>
              </div>

              {/* Due date + recurring */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("dueDate")} *</label>
                  <input required type="date" value={due} onChange={e => setDue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{tr("recurring")}</label>
                  <select value={recurring} onChange={e => setRecurring(e.target.value as RecurringFreq)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white">
                    <option value="none">{tr("recurringNone")}</option>
                    <option value="monthly">{tr("recurringMonthly")}</option>
                    <option value="quarterly">{tr("recurringQuarterly")}</option>
                    <option value="yearly">{tr("recurringYearly")}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl text-slate-600 hover:bg-slate-50">{tr("cancel")}</button>
                <button type="submit" className="flex-1 gradient-btn font-semibold py-2.5 rounded-xl text-white">
                  {editId ? tr("saveChanges") : tr("createInvoice")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
