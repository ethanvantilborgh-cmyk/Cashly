import { NextRequest, NextResponse } from "next/server";
import { Invoice, InvoiceLine, lineHT, lineTVA, lineTTC, invoiceTotalHT, invoiceTotalTVA, invoiceTotalTTC } from "../../lib/storage";
import type { CompanySettings } from "../../settings/page";

export const dynamic = "force-dynamic";

function buildHtml(invoice: Invoice, company: CompanySettings): string {
  const totalHT  = invoiceTotalHT(invoice.lines);
  const totalTVA = invoiceTotalTVA(invoice.lines);
  const totalTTC = invoiceTotalTTC(invoice.lines);
  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  const statusLabel = invoice.status === "paid" ? "Payée" : invoice.status === "pending" ? "En attente" : "En retard";
  const statusColor = invoice.status === "paid" ? "#10b981" : invoice.status === "pending" ? "#f59e0b" : "#ef4444";

  const vatGroups: Record<number, number> = {};
  invoice.lines.forEach((l: InvoiceLine) => { vatGroups[l.vatRate] = (vatGroups[l.vatRate] || 0) + lineTVA(l); });

  const vatRows = Object.entries(vatGroups)
    .map(([rate, amt]) => `<div class="totals-row"><span>TVA (${rate}%)</span><span>${fmt(amt)} €</span></div>`)
    .join("");

  const lineRows = invoice.lines.map((l: InvoiceLine) => `
    <tr>
      <td><div class="service-name">${l.description || "—"}</div></td>
      <td style="text-align:right;color:#475569">${l.qty}</td>
      <td style="text-align:right">${fmt(l.unitPrice)} €</td>
      <td style="text-align:right;color:#64748b">${l.vatRate}%</td>
      <td style="text-align:right">${fmt(lineHT(l))} €</td>
      <td style="text-align:right;font-weight:600">${fmt(lineTTC(l))} €</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1e293b; background:white; padding:40px; font-size:14px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:48px; }
    .logo { font-size:24px; font-weight:800; color:#10b981; }
    .invoice-number { font-size:22px; font-weight:700; color:#1e293b; text-align:right; }
    .invoice-date { color:#64748b; font-size:13px; margin-top:4px; text-align:right; }
    .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; color:white; background:${statusColor}; margin-top:8px; }
    .divider { height:2px; background:linear-gradient(90deg,#10b981,#0ea5e9); border-radius:1px; margin-bottom:32px; }
    .parties { display:flex; justify-content:space-between; margin-bottom:40px; }
    .label { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#94a3b8; font-weight:600; margin-bottom:8px; }
    .company-name { font-size:16px; font-weight:700; color:#1e293b; margin-bottom:4px; }
    .company { line-height:1.7; color:#475569; }
    table { width:100%; border-collapse:collapse; margin-bottom:32px; }
    th { text-align:left; padding:10px 14px; background:#f8fafc; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; font-weight:600; border-bottom:1px solid #e2e8f0; }
    td { padding:13px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; }
    .service-name { font-weight:600; color:#1e293b; }
    .totals { display:flex; justify-content:flex-end; margin-bottom:24px; }
    .totals-table { width:300px; }
    .totals-row { display:flex; justify-content:space-between; padding:8px 0; color:#64748b; font-size:14px; border-bottom:1px solid #f1f5f9; }
    .totals-final { display:flex; justify-content:space-between; padding:12px 16px; background:#f8fafc; border-radius:12px; margin-top:8px; font-weight:700; font-size:16px; color:#1e293b; }
    .payment-info { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px 20px; margin-bottom:24px; line-height:1.8; font-size:13px; color:#166534; }
    .notes { color:#64748b; font-size:13px; padding-top:16px; border-top:1px solid #f1f5f9; line-height:1.7; }
    .footer { margin-top:40px; text-align:center; font-size:12px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Cashly</div>
    <div>
      <div class="invoice-number">FACTURE ${invoice.id}</div>
      <div class="invoice-date">Émise le ${invoice.date}</div>
      <div class="invoice-date">Échéance : ${invoice.due}</div>
      <div style="text-align:right;margin-top:8px"><span class="status-badge">${statusLabel}</span></div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="parties">
    <div>
      <div class="label">De</div>
      <div class="company">
        <div class="company-name">${company.name || "Votre Entreprise"}</div>
        ${company.address ? `<div>${company.address}</div>` : ""}
        ${company.city ? `<div>${company.city}${company.country ? `, ${company.country}` : ""}</div>` : ""}
        ${company.vat ? `<div>TVA: ${company.vat}</div>` : ""}
        ${company.phone ? `<div>${company.phone}</div>` : ""}
        ${company.email ? `<div>${company.email}</div>` : ""}
      </div>
    </div>
    <div>
      <div class="label">Facturer à</div>
      <div class="company">
        <div class="company-name">${invoice.client}</div>
        ${invoice.email ? `<div>${invoice.email}</div>` : ""}
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:38%">Description</th>
        <th style="width:8%;text-align:right">Qté</th>
        <th style="width:16%;text-align:right">Prix unit. HT</th>
        <th style="width:8%;text-align:right">TVA</th>
        <th style="width:15%;text-align:right">Total HT</th>
        <th style="width:15%;text-align:right">Total TTC</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Sous-total HT</span><span>${fmt(totalHT)} €</span></div>
      ${vatRows}
      <div class="totals-final"><span>Total TTC</span><span>${fmt(totalTTC)} €</span></div>
    </div>
  </div>
  ${company.iban ? `<div class="payment-info"><strong>Paiement par virement</strong><br/>IBAN : ${company.iban}</div>` : ""}
  ${company.invoiceNotes ? `<div class="notes">${company.invoiceNotes}</div>` : ""}
  <div class="footer">Généré par Cashly · cashly.app · Délai de paiement : ${company.paymentDays || "30"} jours</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { invoice, company } = await req.json() as { invoice: Invoice; company: CompanySettings };
    const html = buildHtml(invoice, company);

    let pdfBuffer: Buffer;

    // Try puppeteer-core (local dev) then fall back to a lighter approach
    try {
      // Dynamic import to avoid build errors if not installed
      const puppeteer = await import("puppeteer-core");
      // Try to find a local Chrome installation
      const executablePath =
        process.env.CHROME_EXECUTABLE_PATH ||
        (process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : "/usr/bin/google-chrome");

      const browser = await puppeteer.default.launch({
        executablePath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
      await browser.close();
      pdfBuffer = Buffer.from(pdf);
    } catch {
      // Fallback: return HTML as blob (client will print-to-PDF)
      return NextResponse.json({ html }, { status: 200 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoice.id}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
