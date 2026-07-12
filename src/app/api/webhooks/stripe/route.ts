import { NextRequest, NextResponse } from 'next/server';
import { prisma, PRICES } from '@/lib/utils';

/**
 * Real payment-gateway integration point.
 *
 * This is inactive by default — the app ships with the manual
 * payment-link flow (admin pastes a link, confirms once paid) because
 * no gateway credentials were provided. To turn on real card payments:
 *
 * 1. `npm install stripe`
 * 2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your env.
 * 3. On the payment page, create a Checkout Session server-side keyed
 *    to the application's invoiceNo and amount, and redirect the user
 *    to session.url instead of showing "Pay Now" against the manual link.
 * 4. Point your Stripe webhook at this route. On a verified
 *    checkout.session.completed event, look up the Application by
 *    invoiceNo and run the same logic as confirmPayment() in
 *    src/actions/actions.ts (ledger entry + createJobOrdersForApplication).
 *
 * The same pattern works for Telr (UAE-first, see the go-live guide) —
 * Telr posts to a webhook URL you register with them instead of Stripe's
 * signed event format, but the confirmation logic below is identical.
 */
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe integration not configured — using manual payment-link flow.' }, { status: 501 });
  }

  // Example shape once wired up (left inert without the `stripe` package installed):
  //
  // const sig = req.headers.get('stripe-signature')!;
  // const body = await req.text();
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  // if (event.type === 'checkout.session.completed') {
  //   const invoiceNo = event.data.object.client_reference_id;
  //   const app = await prisma.application.update({ where: { invoiceNo }, data: { status: 'paid' } });
  //   await prisma.ledgerEntry.create({ data: { type: 'payment', label: `${app.type} payment`, ref: app.invoiceNo, amount: app.amount } });
  //   // ...create job orders, same as confirmPayment() in actions.ts
  // }

  return NextResponse.json({ received: true });
}
