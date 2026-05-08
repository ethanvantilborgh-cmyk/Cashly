import Stripe from "stripe";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return Response.json({ error: "Clé Stripe manquante" }, { status: 500 });

    const { amount, invoiceId, clientName, vatRate = 0 } = await req.json();
    if (!amount || !invoiceId) return Response.json({ error: "Paramètres manquants" }, { status: 400 });

    const stripe = new Stripe(key);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const amountTTC = Math.round(amount * (1 + vatRate / 100) * 100); // centimes

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Facture ${invoiceId}`,
            description: clientName ? `Client : ${clientName}` : undefined,
          },
          unit_amount: amountTTC,
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/invoices?paid=${invoiceId}`,
      cancel_url: `${appUrl}/invoices`,
      metadata: { invoiceId },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return Response.json({ error: msg }, { status: 500 });
  }
}
