import Stripe from "stripe";

export async function POST() {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return Response.json({ error: "Clé Stripe manquante" }, { status: 500 });
    }

    const stripe = new Stripe(key);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Cashly Pro",
              description: "Facturen onbeperkt · Uitgaven · Rapporten · FR/EN/NL",
            },
            unit_amount: 1900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[checkout]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
