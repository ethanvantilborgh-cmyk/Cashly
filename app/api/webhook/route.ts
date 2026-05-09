import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function sendOwnerPaymentEmail(
  invoiceId: string,
  clientName: string,
  amount: number,
  userId: string
) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY || RESEND_KEY.startsWith("re_your_")) return;

  try {
    // Get company email from profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_email, company_name")
      .eq("id", userId)
      .single();

    // Fallback: auth email
    let ownerEmail = profile?.company_email;
    if (!ownerEmail) {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      ownerEmail = user?.email;
    }

    if (!ownerEmail) return;

    const companyName = profile?.company_name || "Cashly";
    const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "noreply@cashly.app",
        to: ownerEmail,
        subject: `💳 Paiement reçu — ${invoiceId} (${fmt(amount)} €)`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b">
            <div style="background:linear-gradient(135deg,#059669,#0284c7);border-radius:12px;padding:24px;color:#fff;margin-bottom:24px">
              <div style="font-size:32px;margin-bottom:4px">💳</div>
              <h2 style="margin:0;font-size:20px">Paiement reçu !</h2>
              <p style="margin:8px 0 0;opacity:0.85;font-size:14px">${clientName} a payé la facture ${invoiceId}</p>
            </div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px">
              <p style="margin:0;font-size:28px;font-weight:700;color:#059669">${fmt(amount)} €</p>
              <p style="margin:4px 0 0;font-size:13px;color:#16a34a">Encaissé avec succès</p>
            </div>

            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px">
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:8px 0;color:#64748b">Facture</td>
                <td style="padding:8px 0;font-weight:600;text-align:right">${invoiceId}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:8px 0;color:#64748b">Client</td>
                <td style="padding:8px 0;font-weight:600;text-align:right">${clientName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b">Montant</td>
                <td style="padding:8px 0;font-weight:700;color:#059669;text-align:right">${fmt(amount)} €</td>
              </tr>
            </table>

            <p style="margin-top:24px">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoices"
                 style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                Voir mes factures →
              </a>
            </p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="font-size:12px;color:#94a3b8">
              ${companyName} · Cashly · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#94a3b8">cashly.app</a>
            </p>
          </div>`,
      }),
    });
  } catch (err) {
    console.error("[webhook] Failed to send owner payment email:", err);
  }
}

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key) return NextResponse.json({ error: "No Stripe key" }, { status: 500 });

  const stripe = new Stripe(key);
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    if (webhookSecret && webhookSecret !== "whsec_your_webhook_secret_here") {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId && session.payment_status === "paid") {
      // Mark invoice as paid and retrieve it to get owner info
      const { data: updatedInv, error } = await supabaseAdmin
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId)
        .select("client, amount, user_id")
        .single();

      if (error) {
        console.error("[webhook] Failed to mark invoice paid:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[webhook] Invoice ${invoiceId} marked as paid`);

      // Notify the invoice owner by email
      if (updatedInv?.user_id) {
        const amountPaid = session.amount_total ? session.amount_total / 100 : updatedInv.amount;
        await sendOwnerPaymentEmail(invoiceId, updatedInv.client, amountPaid, updatedInv.user_id);
      }
    }

    // Handle Pro subscription activation
    const customerId = session.customer as string;
    if (session.mode === "subscription" && customerId) {
      console.log(`[webhook] New Pro subscription for customer ${customerId}`);
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const inv = event.data.object as Stripe.Invoice;
    console.log(`[webhook] Subscription payment succeeded: ${inv.id}`);
  }

  return NextResponse.json({ received: true });
}
