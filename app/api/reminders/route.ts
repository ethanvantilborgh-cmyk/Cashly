import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { invoiceTotalTTC } from "../../lib/storage";

// Admin client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/reminders
 * Sends email reminders to all clients with overdue invoices.
 * Must be called with { secret: SHARE_SECRET } to prevent abuse.
 * Can be triggered by a cron job or manually from settings.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.secret !== process.env.SHARE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY || RESEND_KEY.startsWith("re_your_")) {
      return NextResponse.json({ message: "Resend not configured", sent: 0 }, { status: 200 });
    }

    // Fetch all overdue invoices + their user's profile
    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select(`
        id, client, email, lines, amount, due, status,
        profiles ( company_name, company_iban, invoice_notes, payment_days )
      `)
      .eq("status", "overdue")
      .not("email", "is", null)
      .neq("email", "");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let sent = 0;
    const errors: string[] = [];

    for (const inv of (invoices ?? [])) {
      try {
        const ttc = invoiceTotalTTC(inv.lines ?? []);
        const fmt = (n: number) =>
          n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profile = (inv as any).profiles ?? {};
        const companyName = profile.company_name || "Cashly";
        const iban        = profile.company_iban  || "";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "noreply@cashly.app",
            to:   inv.email,
            subject: `Rappel paiement — Facture ${inv.id}`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b">
                <h2 style="color:#059669;margin-bottom:8px">Rappel de paiement</h2>
                <p>Bonjour <strong>${inv.client}</strong>,</p>
                <p>
                  Nous vous contactons car la facture
                  <strong> ${inv.id}</strong>
                  d'un montant de <strong>${fmt(ttc)} €</strong>
                  est arrivée à échéance le <strong>${inv.due}</strong>
                  et reste impayée à ce jour.
                </p>
                ${iban ? `<p><strong>IBAN :</strong> ${iban}</p>` : ""}
                <p>Merci de procéder au règlement dans les meilleurs délais.</p>
                <p>
                  Cordialement,<br/>
                  <strong>${companyName}</strong>
                </p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
                <p style="font-size:12px;color:#94a3b8">Généré par Cashly · cashly.app</p>
              </div>
            `,
          }),
        });

        if (res.ok) sent++;
        else {
          const err = await res.json();
          errors.push(`${inv.id}: ${err.message || res.status}`);
        }
      } catch (e: unknown) {
        errors.push(`${inv.id}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    return NextResponse.json({
      message: `${sent}/${(invoices ?? []).length} reminder(s) sent`,
      sent,
      total: (invoices ?? []).length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/reminders
 * Returns count of overdue invoices (for the dashboard/settings badge).
 */
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "overdue")
      .not("email", "is", null)
      .neq("email", "");

    if (error) return NextResponse.json({ count: 0 });
    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
