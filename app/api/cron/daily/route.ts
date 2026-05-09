import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { invoiceTotalTTC } from "../../../lib/storage";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/cron/daily
 * Called every morning at 07:00 UTC by Vercel Cron.
 * 1. Marks pending invoices past due date as "overdue"
 * 2. Sends one reminder email per newly-overdue invoice (with client email)
 * 3. Notifies the invoice owner by email when their invoice becomes overdue
 *
 * Secured by Vercel's built-in cron secret (Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(req: NextRequest) {
  // Vercel injects Authorization: Bearer {CRON_SECRET} automatically
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getAdmin();
  const today = new Date().toISOString().split("T")[0];
  const report: Record<string, unknown> = { date: today };

  // ── 1. Mark overdue ──────────────────────────────────────────────────────
  const { data: nowOverdue, error: overdueErr } = await supabaseAdmin
    .from("invoices")
    .update({ status: "overdue" })
    .eq("status", "pending")
    .lt("due", today)
    .select("id, client, email, lines, due, user_id");

  if (overdueErr) {
    report.overdueError = overdueErr.message;
  }
  report.markedOverdue = nowOverdue?.length ?? 0;

  // ── 2. Send reminder to client + notify owner for each newly-overdue inv ──
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM_EMAIL || "noreply@cashly.app";

  if (RESEND_KEY && !RESEND_KEY.startsWith("re_your_") && nowOverdue?.length) {
    // Collect unique user_ids to batch-fetch profiles
    const userIds = [...new Set(nowOverdue.map((i) => i.user_id).filter(Boolean))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, company_name, company_iban, company_email")
      .in("id", userIds);

    const profileMap: Record<string, { company_name: string; company_iban: string; company_email: string }> = {};
    for (const p of profiles ?? []) profileMap[p.id] = p;

    // Also fetch auth emails for owners who have no company_email
    let ownerEmails: Record<string, string> = {};
    try {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      for (const u of users?.users ?? []) {
        if (u.email) ownerEmails[u.id] = u.email;
      }
    } catch { /* ignore */ }

    let clientsSent = 0;
    let ownersSent = 0;

    for (const inv of nowOverdue) {
      const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
      const ttc = invoiceTotalTTC(inv.lines ?? []);
      const profile = profileMap[inv.user_id] ?? {};
      const companyName = profile.company_name || "Cashly";
      const iban = profile.company_iban || "";

      // --- Email to client ---
      if (inv.email) {
        const clientRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({
            from: FROM,
            to: inv.email,
            subject: `Rappel de paiement — Facture ${inv.id}`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b">
                <h2 style="color:#059669;margin-bottom:8px">Rappel de paiement</h2>
                <p>Bonjour <strong>${inv.client}</strong>,</p>
                <p>La facture <strong>${inv.id}</strong> d'un montant de <strong>${fmt(ttc)} €</strong>
                   est arrivée à échéance le <strong>${inv.due}</strong> et reste impayée.</p>
                ${iban ? `<p><strong>IBAN :</strong> ${iban}</p>` : ""}
                <p>Merci de procéder au règlement dans les meilleurs délais.</p>
                <p>Cordialement,<br/><strong>${companyName}</strong></p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
                <p style="font-size:12px;color:#94a3b8">Généré par Cashly · cashly.app</p>
              </div>`,
          }),
        });
        if (clientRes.ok) clientsSent++;
      }

      // --- Email to invoice owner ---
      const ownerEmail = profile.company_email || ownerEmails[inv.user_id];
      if (ownerEmail) {
        const ownerRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({
            from: FROM,
            to: ownerEmail,
            subject: `⚠️ Facture en retard — ${inv.id} (${inv.client})`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b">
                <h2 style="color:#f59e0b;margin-bottom:8px">Facture en retard de paiement</h2>
                <p>La facture <strong>${inv.id}</strong> adressée à <strong>${inv.client}</strong>
                   pour un montant de <strong>${fmt(ttc)} €</strong> est arrivée à échéance
                   le <strong>${inv.due}</strong> et n'a pas encore été réglée.</p>
                <p>Un rappel automatique a été envoyé à votre client.</p>
                <p style="margin-top:16px">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoices"
                     style="background:#059669;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                    Voir mes factures →
                  </a>
                </p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
                <p style="font-size:12px;color:#94a3b8">Cashly · cashly.app</p>
              </div>`,
          }),
        });
        if (ownerRes.ok) ownersSent++;
      }
    }

    report.clientRemindersSent = clientsSent;
    report.ownerNotificationsSent = ownersSent;
  }

  return NextResponse.json({ ok: true, ...report });
}
