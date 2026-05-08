import { getCompanySettings } from "../settings/page";

export type InvoiceData = {
  id: string;
  client: string;
  email: string;
  amount: number;
  status: string;
  date: string;
  due: string;
};

export function printInvoice(invoice: InvoiceData) {
  const company = getCompanySettings();

  const companyBlock = company.name
    ? `<div class="company">
        <div class="company-name">${company.name}</div>
        ${company.address ? `<div>${company.address}</div>` : ""}
        ${company.city ? `<div>${company.city}${company.country ? `, ${company.country}` : ""}</div>` : ""}
        ${company.vat ? `<div>TVA: ${company.vat}</div>` : ""}
        ${company.phone ? `<div>${company.phone}</div>` : ""}
        ${company.email ? `<div>${company.email}</div>` : ""}
      </div>`
    : `<div class="company"><div class="company-name">Votre Entreprise</div></div>`;

  const ibanBlock = company.iban
    ? `<div class="payment-info">
        <strong>Paiement par virement</strong><br/>
        IBAN : ${company.iban}
      </div>`
    : "";

  const notesBlock = company.invoiceNotes
    ? `<div class="notes">${company.invoiceNotes}</div>`
    : "";

  const dueDays = company.paymentDays || "30";

  const statusLabel = invoice.status === "paid" ? "Payée" : invoice.status === "pending" ? "En attente" : "En retard";
  const statusColor = invoice.status === "paid" ? "#10b981" : invoice.status === "pending" ? "#f59e0b" : "#ef4444";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture ${invoice.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; padding: 40px; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #10b981, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .invoice-label { text-align: right; }
    .invoice-number { font-size: 22px; font-weight: 700; color: #1e293b; }
    .invoice-date { color: #64748b; font-size: 13px; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: white; background: ${statusColor}; margin-top: 8px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { line-height: 1.7; color: #475569; }
    .company-name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .from-label, .to-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
    .divider { height: 2px; background: linear-gradient(90deg, #10b981, #0ea5e9); border-radius: 1px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { text-align: left; padding: 12px 16px; background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    td { padding: 16px; border-bottom: 1px solid #f1f5f9; }
    .service-name { font-weight: 600; color: #1e293b; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .totals-final { display: flex; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 12px; margin-top: 8px; font-weight: 700; font-size: 16px; color: #1e293b; }
    .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; line-height: 1.8; font-size: 13px; color: #166534; }
    .notes { color: #64748b; font-size: 13px; padding-top: 16px; border-top: 1px solid #f1f5f9; line-height: 1.7; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Cashly</div>
    <div class="invoice-label">
      <div class="invoice-number">FACTURE ${invoice.id}</div>
      <div class="invoice-date">Émise le ${invoice.date}</div>
      <div class="invoice-date">Échéance : ${invoice.due}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="parties">
    <div>
      <div class="from-label">De</div>
      ${companyBlock}
    </div>
    <div>
      <div class="to-label">Facturer à</div>
      <div class="company">
        <div class="company-name">${invoice.client}</div>
        ${invoice.email ? `<div>${invoice.email}</div>` : ""}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:60%">Description</th>
        <th style="width:15%;text-align:right">Qté</th>
        <th style="width:25%;text-align:right">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><div class="service-name">Prestation de services</div><div style="color:#64748b;font-size:13px;margin-top:2px">Réf. ${invoice.id}</div></td>
        <td style="text-align:right;color:#475569">1</td>
        <td style="text-align:right;font-weight:600">${invoice.amount.toLocaleString("fr-FR")} €</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Sous-total HT</span><span>${invoice.amount.toLocaleString("fr-FR")} €</span></div>
      <div class="totals-row"><span>TVA (0%)</span><span>0,00 €</span></div>
      <div class="totals-final"><span>Total TTC</span><span>${invoice.amount.toLocaleString("fr-FR")} €</span></div>
    </div>
  </div>

  ${ibanBlock}
  ${notesBlock}

  <div class="footer">Généré par Cashly · cashly.app · Délai de paiement : ${dueDays} jours</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 300);
}
