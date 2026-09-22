import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          mode?: string;
          client_reference_id?: string;
          metadata?: { userId?: string; charityId?: string; donationType?: string };
          subscription?: string;
          customer?: string;
          payment_intent?: string;
          amount_total?: number;
          currency?: string;
          customer_details?: { email?: string; name?: string };
        };

        if (session.mode === 'payment' && session.metadata?.donationType === 'independent') {
          // Independent One-Time Charity Donation
          const charityId = session.metadata.charityId;
          if (charityId) {
            const { error: donErr } = await supabase.from('donations').upsert(
              {
                user_id: session.metadata.userId || session.client_reference_id || null,
                charity_id: charityId,
                stripe_payment_intent_id: (session.payment_intent as string) || null,
                amount_minor: session.amount_total || 0,
                currency: session.currency || 'inr',
                donor_email: session.customer_details?.email || null,
                donor_name: session.customer_details?.name || null,
                status: 'succeeded',
              },
              { onConflict: 'stripe_payment_intent_id' }
            );

            if (donErr) {
              console.error('Donation record insertion error:', donErr);
              return NextResponse.json({ error: donErr.message }, { status: 500 });
            }
          }
        } else {
          // Recurring Subscription Checkout
          const userId = session.client_reference_id || session.metadata?.userId;
          const subscriptionId = session.subscription;
          const customerId = session.customer;

          if (userId && subscriptionId) {
            const subDetails = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as { items: { data: Array<{ price?: { id?: string } }> }; status: string; current_period_start: number; current_period_end: number; cancel_at_period_end: boolean };
            const planType =
              subDetails.items.data[0]?.price?.id === process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
                ? 'annual'
                : 'monthly';

            const { error: subErr } = await supabase.from('subscriptions').upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan_type: planType,
                status: subDetails.status,
                current_period_start: new Date(subDetails.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subDetails.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subDetails.cancel_at_period_end,
                last_reconciled_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

            if (subErr) {
              console.error('Subscription upsert database error:', subErr);
              return NextResponse.json({ error: subErr.message }, { status: 500 });
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as { subscription?: string; customer?: string; id: string; amount_paid: number; currency: string; period_start?: number; status_transitions?: { paid_at?: number } };
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        let userId: string | null = null;
        let planType: 'monthly' | 'annual' = 'monthly';

        if (subscriptionId) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('user_id, plan_type')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle();

          if (subData) {
            userId = subData.user_id;
            planType = (subData.plan_type as 'monthly' | 'annual') || 'monthly';
          } else {
            const stripeSub = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as { metadata?: { userId?: string }; items?: { data: Array<{ price?: { id?: string } }> }; status: string; current_period_start: number; current_period_end: number; cancel_at_period_end: boolean };
            userId = stripeSub.metadata?.userId || null;
            planType =
              stripeSub.items?.data[0]?.price?.id === process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
                ? 'annual'
                : 'monthly';

            if (userId) {
              const { error: subErr } = await supabase.from('subscriptions').upsert(
                {
                  user_id: userId,
                  stripe_customer_id: customerId,
                  stripe_subscription_id: subscriptionId,
                  plan_type: planType,
                  status: stripeSub.status,
                  current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                  cancel_at_period_end: stripeSub.cancel_at_period_end,
                  last_reconciled_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
              );

              if (subErr) {
                console.error('Subscription fallback upsert error:', subErr);
                return NextResponse.json({ error: subErr.message }, { status: 500 });
              }
            }
          }
        }

        if (userId) {
          const paidAt = new Date((invoice.status_transitions?.paid_at || Date.now() / 1000) * 1000).toISOString();
          const periodStart = new Date((invoice.period_start || Date.now() / 1000) * 1000).toISOString();

          const { error: rpcErr } = await supabase.rpc('process_invoice_funding_allocation', {
            p_user_id: userId,
            p_stripe_invoice_id: invoice.id,
            p_amount_paid: invoice.amount_paid,
            p_currency: invoice.currency,
            p_plan_type: planType,
            p_paid_at: paidAt,
            p_period_start: periodStart,
          });

          if (rpcErr) {
            console.error('Atomic process_invoice_funding_allocation RPC error:', rpcErr);
            return NextResponse.json({ error: rpcErr.message }, { status: 500 });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string; status: string; current_period_start: number; current_period_end: number; cancel_at_period_end: boolean };
        const { error: updateErr } = await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            last_reconciled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        if (updateErr) {
          console.error('Subscription update error:', updateErr);
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Error handling Stripe webhook event:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
