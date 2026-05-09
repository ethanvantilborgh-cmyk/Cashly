"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Invoice, InvoiceLine, lineHT, lineTVA, lineTTC, invoiceTotalHT, invoiceTotalTVA, invoiceTotalTTC } from "../../lib/storage";
import type { CompanySettings } from "../../settings/page";

type PageData = {
  invoice: Invoice & { lines: InvoiceLine[] };
  company: CompanySettings;
};

function fmt(n: number) { return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }); }

export default function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData]         = useState<PageData | null>(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public-invoice?token=${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.error) { setError(res.error); return; }
        const p = res.profile;
        const company: CompanySettings = {
          name: p?.company_name ?? "", address: p?.company_address ?? "",
          city: p?.company_city ?? "", country: p?.company_country ?? "",
          vat: p?.company_vat ?? "", phone: p?.company_phone ?? "",
          email: p?.company_email ?? "", iban: p?.company_iban ?? "",
          invoicePrefix: p?.invoice_prefix ?? "INV",
          paymentDays: String(p?.payment_days ?? 30), invoiceNotes: p?.invoice_notes ?? "",
        };
        const raw = res.invoice;
        const invoice: Invoice = {
          id: raw.id, client: raw.client, email: raw.email ?? "",
          lines: raw.lines ?? [], amount: Number(raw.amount),
          status: raw.status, date: raw.date, due: raw.due,
          vatRate: Number(raw.vat_rate), recurring: raw.recurring,
        };
        setData({ invoice, company });
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handlePay() {
    if (!data) return;
    setPayLoading(true);
    try {
      const ttc = invoiceTotalTTC(data.invoice.lines);
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: ttc,
          invoiceId: data.invoice.id,
          clientName: data.invoice.client,
          vatRate: 0,
        }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch { /* silent */ }
    setPayLoading(false);
  }

  async function handleDownloadPdf() {
    if (!data) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/pdf-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice: data.invoice, company: data.company }),
      });
      if (res.headers.get("Content-Type")?.includes("application/pdf")) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = `facture-${data.invoice.id}.pdf`; a.click();
        URL.revokeObjectURL(url);
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
    setPdfLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-slate-800">Facture introuvable</h1>
        <p className="text-slate-500 mt-2">Ce lien est invalide ou a expiré.</p>
      </div>
    </div>
  );

  if (!data) return null;
  const { invoice, company } = data;

  const totalHT  = invoiceTotalHT(invoice.lines);
  const totalTVA = invoiceTotalTVA(invoice.lines);
  const totalTTC = invoiceTotalTTC(invoice.lines);

  const vatGroups: Record<number, number> = {};
  invoice.lines.forEach(l => { vatGroups[l.vatRate] = (vatGroups[l.vatRate] || 0) + lineTVA(l); });

  const statusLabel = invoice.status === "paid" ? "Payée" : invoice.status === "pending" ? "En attente" : "En retard";
  const statusColor = invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : invoice.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl p-8 text-white mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-black">Cashly</div>
              {company.name && <div className="text-white/80 text-sm mt-1">{company.name}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-white/70 mb-1">Facture</div>
              <div className="text-2xl font-bold">{invoice.id}</div>
              <div className="text-sm text-white/80 mt-1">Échéance : {invoice.due}</div>
            </div>
          </div>
        </div>

        {/* Pay now banner (if unpaid) */}
        {!isPaid && (
          <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">Montant à régler</p>
              <p className="text-3xl font-black text-emerald-600 mt-0.5">{fmt(totalTTC)} €</p>
              <p className="text-sm text-slate-400 mt-0.5">Échéance : {invoice.due}</p>
            </div>
            <button
              onClick={handlePay}
              disabled={payLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {payLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "💳"}
              {payLoading ? "Redirection..." : "Payer en ligne"}
            </button>
          </div>
        )}

        {isPaid && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="font-semibold text-emerald-800">Facture payée</p>
              <p className="text-sm text-emerald-600">Cette facture a bien été réglée. Merci !</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Parties */}
          <div className="p-8 flex justify-between border-b border-slate-100">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">De</div>
              <div className="font-bold text-slate-900">{company.name || "—"}</div>
              {company.address && <div className="text-sm text-slate-500">{company.address}</div>}
              {company.city && <div className="text-sm text-slate-500">{company.city}{company.country ? `, ${company.country}` : ""}</div>}
              {company.vat && <div className="text-sm text-slate-500">TVA: {company.vat}</div>}
              {company.email && <div className="text-sm text-slate-500">{company.email}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Facturer à</div>
              <div className="font-bold text-slate-900">{invoice.client}</div>
              {invoice.email && <div className="text-sm text-slate-500">{invoice.email}</div>}
              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
            </div>
          </div>

          {/* Lines */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-right">Qté</th>
                  <th className="px-6 py-3 text-right">Prix unit. HT</th>
                  <th className="px-6 py-3 text-right">TVA</th>
                  <th className="px-6 py-3 text-right">Total HT</th>
                  <th className="px-6 py-3 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{l.description || "—"}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{l.qty}</td>
                    <td className="px-6 py-4 text-right">{fmt(l.unitPrice)} €</td>
                    <td className="px-6 py-4 text-right text-slate-500">{l.vatRate}%</td>
                    <td className="px-6 py-4 text-right">{fmt(lineHT(l))} €</td>
                    <td className="px-6 py-4 text-right font-semibold">{fmt(lineTTC(l))} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end p-8 border-t border-slate-100">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total HT</span><span>{fmt(totalHT)} €</span>
              </div>
              {Object.entries(vatGroups).map(([rate, amt]) => (
                <div key={rate} className="flex justify-between text-sm text-slate-500">
                  <span>TVA ({rate}%)</span><span>{fmt(amt)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                <span>Total TTC</span><span className="text-emerald-600">{fmt(totalTTC)} €</span>
              </div>
            </div>
          </div>

          {/* IBAN */}
          {company.iban && (
            <div className="mx-8 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
              <strong>Paiement par virement</strong><br/>IBAN : {company.iban}
            </div>
          )}

          {/* Notes */}
          {company.invoiceNotes && (
            <div className="mx-8 mb-6 text-sm text-slate-500 border-t border-slate-100 pt-4">{company.invoiceNotes}</div>
          )}

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-400 border-t border-slate-100">
            Généré par Cashly · cashly.app · Délai de paiement : {company.paymentDays || "30"} jours
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center print:hidden">
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : "📄"}
            {pdfLoading ? "Génération..." : "Télécharger PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            🖨️ Imprimer
          </button>
          {!isPaid && (
            <button
              onClick={handlePay}
              disabled={payLoading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold px-8 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              💳 {payLoading ? "Redirection..." : "Payer en ligne"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
