import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Invoice, InvoiceLine, lineHT, lineTVA, lineTTC, invoiceTotalHT, invoiceTotalTVA, invoiceTotalTTC } from "../../lib/storage";
import type { CompanySettings } from "../../settings/page";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildHtml(invoice: Invoice, company: CompanySettings, paymentUrl?: string): string {
  const totalHT  = invoiceTotalHT(invoice.lines);
  const totalTVA = invoiceTotalTVA(invoice.lines);
  const totalTTC = invoiceTotalTTC(invoice.lines);
  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  const vatGroups: Record<number, number> = {};
  invoice.lines.forEach((l: InvoiceLine) => { vatGroups[l.vatRate] = (vatGroups[l.vatRate] || 0) + lineTVA(l); });

  const vatRows = Object.entries(vatGroups)
    .map(([rate, amt]) => `<tr><td style="padding:4px 0;color:#64748b">TVA (${rate}%)</td><td style="text-align:right;color:#64748b">${fmt(amt)} €</td></tr>`)
    .join("");

  const lineRows = invoice.lines.map((l: InvoiceLine) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px">${l.description || "—"}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;font-size:13px">${l.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px">${fmt(l.unitPrice)} €</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;font-size:13px">${l.vatRate}%</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;font-size:13px">${fmt(lineTTC(l))} €</td>
    </tr>`).join("");

  const payBtn = paymentUrl ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${paymentUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#0ea5e9);color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;">
        💳 Payer maintenant — ${fmt(totalTTC)} €
      </a>
    </div>` : "";

  const ibanBlock = company.iban ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#166534;line-height:1.8;">
      <strong>Paiement par virement</strong><br/>IBAN : ${company.iban}
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981,#0ea5e9);padding:32px 40px;color:white;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;">Cashly</div>
          ${company.name ? `<div style="font-size:14px;opacity:0.9;margin-top:4px;">${company.name}</div>` : ""}
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px;opacity:0.8;text-transform:uppercase;letter-spacing:0.08em;">Facture</div>
          <div style="font-size:22px;font-weight:700;">${invoice.id}</div>
          <div style="font-size:13px;opacity:0.8;margin-top:2px;">Échéance : ${invoice.due}</div>
        </div>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:40px;">
      <!-- Parties -->
      <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:600;margin-bottom:8px;">De</div>
          <div style="font-weight:700;color:#1e293b;">${company.name || "Votre Entreprise"}</div>
          ${company.address ? `<div style="color:#475569;font-size:13px;">${company.address}</div>` : ""}
          ${company.city ? `<div style="color:#475569;font-size:13px;">${company.city}</div>` : ""}
          ${company.vat ? `<div style="color:#475569;font-size:13px;">TVA: ${company.vat}</div>` : ""}
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:600;margin-bottom:8px;">Facturer à</div>
          <div style="font-weight:700;color:#1e293b;">${invoice.client}</div>
          ${invoice.email ? `<div style="color:#475569;font-size:13px;">${invoice.email}</div>` : ""}
        </div>
      </div>
      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:1px solid #e2e8f0;">Description</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:1px solid #e2e8f0;">Qté</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:1px solid #e2e8f0;">Prix unit.</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:1px solid #e2e8f0;">TVA</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:1px solid #e2e8f0;">Total TTC</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <!-- Totals -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
        <table style="width:260px;">
          <tr><td style="padding:4px 0;color:#64748b">Sous-total HT</td><td style="text-align:right;color:#64748b">${fmt(totalHT)} €</td></tr>
          ${vatRows}
          <tr><td colspan="2"><div style="height:1px;background:#e2e8f0;margin:8px 0;"></div></td></tr>
          <tr><td style="font-weight:700;font-size:16px;">Total TTC</td><td style="text-align:right;font-weight:700;font-size:16px;color:#10b981;">${fmt(totalTTC)} €</td></tr>
        </table>
      </div>
      ${payBtn}
      ${ibanBlock}
      ${company.invoiceNotes ? `<div style="color:#64748b;font-size:13px;border-top:1px solid #f1f5f9;padding-top:16px;line-height:1.7;">${company.invoiceNotes}</div>` : ""}
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;">
      Généré par Cashly · cashly.app · Délai de paiement : ${company.paymentDays || "30"} jours
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { invoice, company, paymentUrl } = await req.json() as {
      invoice: Invoice;
      company: CompanySettings;
      paymentUrl?: string;
    };

    if (!invoice.email) {
      return NextResponse.json({ error: "No email address" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const html = buildHtml(invoice, company, paymentUrl);
    const fromName = company.name || "Cashly";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@cashly.app";

    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: invoice.email,
      subject: `Facture ${invoice.id} — ${fromName}`,
      html,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
