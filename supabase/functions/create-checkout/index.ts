import Stripe from 'npm:stripe';
import { createClient } from 'npm:@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { priceId, userId, successUrl, cancelUrl } = await req.json();

  // Look up or create Stripe customer
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('customer_id')
    .eq('user_id', userId)
    .single();

  let customerId = existing?.customer_id;
  if (!customerId) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    const customer = await stripe.customers.create({ email: user?.email, metadata: { supabase_uid: userId } });
    customerId = customer.id;
    await supabase.from('stripe_customers').insert({ user_id: userId, customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
