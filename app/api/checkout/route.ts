import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
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
          unit_amount: 1900, // 19€ in cents
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/dashboard`,
  });

  return Response.json({ url: session.url });
}
