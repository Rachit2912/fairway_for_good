import { createClient } from '@/lib/supabase/server';
import { MemberHeader } from '@/components/MemberHeader';
import { MemberWinningsClient } from '@/components/MemberWinningsClient';

export default async function MemberWinningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: awards } = await supabase
    .from('draw_awards')
    .select('*, draws(year, month), winner_submissions(review_status, rejection_reason)')
    .eq('user_id', user?.id || '');

  return (
    <div>
      <MemberHeader activeTab="/dashboard/winnings" userEmail={user?.email} />
      <MemberWinningsClient awards={(awards as any) || []} />
    </div>
  );
}
