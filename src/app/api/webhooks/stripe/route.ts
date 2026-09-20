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
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.userId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (userId && subscriptionId) {
          const subDetails = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
          const planType =
            subDetails.items.data[0]?.price?.id === process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
              ? 'annual'
              : 'monthly';

          await supabase.from('subscriptions').upsert(
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
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('user_id, plan_type')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle();

          if (subData) {
            // Idempotent invoice check
            const { data: existingInvoice } = await supabase
              .from('invoices')
              .select('id')
              .eq('stripe_invoice_id', invoice.id)
              .maybeSingle();

            let invoiceDbId = existingInvoice?.id;

            if (!existingInvoice) {
              const { data: insertedInvoice, error: invErr } = await supabase
                .from('invoices')
                .insert({
                  user_id: subData.user_id,
                  stripe_invoice_id: invoice.id,
                  amount_paid: invoice.amount_paid,
                  currency: invoice.currency,
                  plan_type: subData.plan_type || 'monthly',
                  paid_at: new Date((invoice.status_transitions?.paid_at || Date.now() / 1000) * 1000).toISOString(),
                })
                .select()
                .single();

              if (invErr) {
                console.error('Invoice insert error:', invErr);
                throw invErr;
              }
              invoiceDbId = insertedInvoice.id;
            }

            if (invoiceDbId) {
              // Base coverage dates on paid billing period timestamps from invoice
              const periodStart = new Date((invoice.period_start || Date.now() / 1000) * 1000);
              const startYear = periodStart.getUTCFullYear();
              const startMonth = periodStart.getUTCMonth() + 1;

              const { data: profile } = await supabase
                .from('profiles')
                .select('selected_charity_id, charity_percentage')
                .eq('id', subData.user_id)
                .single();

              const charityPct = profile?.charity_percentage || 10;
              const totalAmount = invoice.amount_paid;

              if (subData.plan_type === 'annual') {
                const monthlyBaseShare = Math.floor(totalAmount / 12);
                const remainder = totalAmount - monthlyBaseShare * 12;

                for (let i = 0; i < 12; i++) {
                  const covDate = new Date(Date.UTC(startYear, startMonth - 1 + i, 1));
                  const covYear = covDate.getUTCFullYear();
                  const covMonth = covDate.getUTCMonth() + 1;

                  // Protect funds already linked to published draws
                  const { data: existingAlloc } = await supabase
                    .from('funding_allocations')
                    .select('draw_id')
                    .eq('user_id', subData.user_id)
                    .eq('coverage_year', covYear)
                    .eq('coverage_month', covMonth)
                    .maybeSingle();

                  if (existingAlloc?.draw_id) {
                    const { data: linkedDraw } = await supabase
                      .from('draws')
                      .select('status')
                      .eq('id', existingAlloc.draw_id)
                      .maybeSingle();

                    if (linkedDraw?.status === 'published') {
                      continue; // Do not overwrite allocation consumed by published draw
                    }
                  }

                  const monthTotal = i === 0 ? monthlyBaseShare + remainder : monthlyBaseShare;
                  const prizeShare = Math.floor(monthTotal * 0.20);
                  const charityShare = Math.floor(monthTotal * (charityPct / 100));
                  const platformShare = monthTotal - prizeShare - charityShare;

                  await supabase.from('funding_allocations').upsert(
                    {
                      invoice_id: invoiceDbId,
                      user_id: subData.user_id,
                      coverage_year: covYear,
                      coverage_month: covMonth,
                      total_allocated_minor: monthTotal,
                      prize_share_minor: prizeShare,
                      charity_share_minor: charityShare,
                      platform_share_minor: platformShare,
                      charity_id: profile?.selected_charity_id,
                      charity_percentage_snapshot: charityPct,
                    },
                    { onConflict: 'user_id,coverage_year,coverage_month' }
                  );
                }
              } else {
                // Protect funds linked to published draw
                const { data: existingAlloc } = await supabase
                  .from('funding_allocations')
                  .select('draw_id')
                  .eq('user_id', subData.user_id)
                  .eq('coverage_year', startYear)
                  .eq('coverage_month', startMonth)
                  .maybeSingle();

                let skipAllocation = false;
                if (existingAlloc?.draw_id) {
                  const { data: linkedDraw } = await supabase
                    .from('draws')
                    .select('status')
                    .eq('id', existingAlloc.draw_id)
                    .maybeSingle();

                  if (linkedDraw?.status === 'published') {
                    skipAllocation = true;
                  }
                }

                if (!skipAllocation) {
                  const prizeShare = Math.floor(totalAmount * 0.20);
                  const charityShare = Math.floor(totalAmount * (charityPct / 100));
                  const platformShare = totalAmount - prizeShare - charityShare;

                  await supabase.from('funding_allocations').upsert(
                    {
                      invoice_id: invoiceDbId,
                      user_id: subData.user_id,
                      coverage_year: startYear,
                      coverage_month: startMonth,
                      total_allocated_minor: totalAmount,
                      prize_share_minor: prizeShare,
                      charity_share_minor: charityShare,
                      platform_share_minor: platformShare,
                      charity_id: profile?.selected_charity_id,
                      charity_percentage_snapshot: charityPct,
                    },
                    { onConflict: 'user_id,coverage_year,coverage_month' }
                  );
                }
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            last_reconciled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error handling Stripe webhook event:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
