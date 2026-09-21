import { createClient } from '@/lib/supabase/server';
import { MemberHeader } from '@/components/MemberHeader';
import { MemberCharityClient } from '@/components/MemberCharityClient';

export default async function MemberCharityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_charity_id, charity_percentage')
    .eq('id', user?.id || '')
    .maybeSingle();

  const { data: charities } = await supabase
    .from('charities')
    .select('id, name, category')
    .eq('active', true);

  return (
    <div>
      <MemberHeader activeTab="/dashboard/charity" userEmail={user?.email} />
      <MemberCharityClient
        charities={charities || []}
        selectedCharityId={profile?.selected_charity_id}
        charityPercentage={profile?.charity_percentage || 10}
      />
    </div>
  );
}
