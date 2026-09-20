import { createClient } from '@/lib/supabase/server';
import { MemberHeader } from '@/components/MemberHeader';
import { MemberScoresClient } from '@/components/MemberScoresClient';

export default async function MemberScoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scores } = await supabase
    .from('scores')
    .select('id, round_date, value')
    .eq('user_id', user?.id || '')
    .order('round_date', { ascending: false })
    .limit(5);

  return (
    <div>
      <MemberHeader activeTab="/dashboard/scores" userEmail={user?.email} />
      <MemberScoresClient initialScores={scores || []} />
    </div>
  );
}
