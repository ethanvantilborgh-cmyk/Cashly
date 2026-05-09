import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key) return NextResponse.json({ error: "No Stripe key" }, { status: 500 });

  const stripe = new Stripe(key);
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
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
      // Mark invoice as paid in Supabase (update all matching rows regardless of user)
      const { error } = await supabaseAdmin
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);

      if (error) {
        console.error("[webhook] Failed to mark invoice paid:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log(`[webhook] Invoice ${invoiceId} marked as paid`);
    }

    // Handle Pro subscription activation
    const customerId = session.customer as string;
    if (session.mode === "subscription" && customerId) {
      // Find user by Stripe customer — for now just log
      console.log(`[webhook] New Pro subscription for customer ${customerId}`);
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const inv = event.data.object as Stripe.Invoice;
    console.log(`[webhook] Subscription payment succeeded: ${inv.id}`);
  }

  return NextResponse.json({ received: true });
}
