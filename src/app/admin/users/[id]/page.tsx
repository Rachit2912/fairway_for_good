import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminUserDetailClient } from '@/components/AdminUserDetailClient';
import { notFound } from 'next/navigation';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, charity_percentage')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: scores } = await supabase
    .from('scores')
    .select('id, round_date, value')
    .eq('user_id', id)
    .order('round_date', { ascending: false });

  return (
    <div>
      <AdminHeader activeTab="/admin/users" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <AdminUserDetailClient profile={profile} scores={scores || []} />
      </div>
    </div>
  );
}
