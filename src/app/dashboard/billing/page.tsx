import { createClient } from '@/lib/supabase/server';
import { MemberHeader } from '@/components/MemberHeader';
import { MemberBillingClient } from '@/components/MemberBillingClient';

export default async function MemberBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user?.id || '')
    .maybeSingle();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user?.id || '')
    .order('paid_at', { ascending: false });

  return (
    <div>
      <MemberHeader activeTab="/dashboard/billing" userEmail={user?.email} />
      <MemberBillingClient sub={sub} invoices={invoices || []} />
    </div>
  );
}
