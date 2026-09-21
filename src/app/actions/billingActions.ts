'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { redirect } from 'next/navigation';

export async function createCheckoutSessionAction(planType: 'monthly' | 'annual') {
  if (planType !== 'monthly' && planType !== 'annual') {
    return { error: 'Invalid plan selection' };
  }

  const priceId =
    planType === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;

  if (!priceId) {
    return { error: 'Missing Stripe Price ID configuration' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Prevent duplicate active subscriptions
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('status, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingSub?.status === 'active' || existingSub?.status === 'trialing') {
    return { error: 'User already has an active subscription. Manage billing in the portal.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single();

  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || profile?.email,
      name: profile?.full_name || undefined,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${origin}/dashboard/billing?success=true`,
    cancel_url: `${origin}/dashboard/billing?canceled=true`,
    metadata: {
      userId: user.id,
      planType,
    },
  });

  if (session.url) {
    redirect(session.url);
  }

  return { error: 'Failed to create checkout session' };
}

export async function createPortalSessionAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    redirect('/pricing');
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/dashboard/billing`,
  });

  if (portalSession.url) {
    redirect(portalSession.url);
  }

  return { error: 'Failed to create billing portal session' };
}
