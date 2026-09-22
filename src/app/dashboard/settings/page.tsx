import { createClient } from '@/lib/supabase/server';
import { MemberHeader } from '@/components/MemberHeader';

export default async function MemberSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user?.id || '')
    .maybeSingle();

  return (
    <div>
      <MemberHeader activeTab="/dashboard/settings" userEmail={user?.email} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                disabled
                defaultValue={profile?.full_name || 'Member'}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-[#1a1d20]/80"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                defaultValue={user?.email || profile?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-[#1a1d20]/60 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
