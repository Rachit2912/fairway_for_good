import { createClient } from '@/lib/supabase/server';
import { MemberHeader } from '@/components/MemberHeader';

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, charities(*)')
    .eq('id', user?.id || '')
    .maybeSingle();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user?.id || '')
    .maybeSingle();

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user?.id || '')
    .order('round_date', { ascending: false })
    .limit(5);

  const isActive = sub?.status === 'active' || sub?.status === 'trialing';

  return (
    <div>
      <MemberHeader activeTab="/dashboard" userEmail={user?.email} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-[#f4f1ea] border border-[#e2ded4] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-amber-600'}`}
              />
              <span className="font-semibold text-sm text-[#0f4c46]">
                {isActive ? 'Active Subscription' : 'Subscription Inactive / Pending Payment'}
              </span>
            </div>
            <p className="text-xs text-[#1a1d20]/70">
              Plan: {sub?.plan_type || 'None'} • Status: {sub?.status || 'Inactive'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-[#1a1d20]">My Saved Scores</h2>
            </div>
            <p className="text-xs text-[#1a1d20]/70">
              Your recent five Stableford scores participating in the upcoming monthly draw:
            </p>

            {scores && scores.length > 0 ? (
              <div className="grid grid-cols-5 gap-2 pt-2">
                {scores.map((score) => (
                  <div key={score.id} className="bg-[#f4f1ea] border border-[#e2ded4] p-3 rounded-xl text-center">
                    <span className="text-xs font-medium text-[#1a1d20]/60 block">{score.round_date.slice(5)}</span>
                    <span className="text-lg font-bold text-[#0f4c46]">{score.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#1a1d20]/60 italic pt-2">No scores logged yet.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e2ded4] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-[#1a1d20]">Selected Charity</h2>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-[#0f4c46]">
                {profile?.charities?.name || 'No Charity Selected'}
              </h3>
              <p className="text-xs text-[#1a1d20]/70">
                Current Contribution Share:{' '}
                <span className="font-bold text-[#0f4c46]">{profile?.charity_percentage || 10}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
