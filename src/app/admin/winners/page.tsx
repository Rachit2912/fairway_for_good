import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminWinnersClient } from '@/components/AdminWinnersClient';

export default async function AdminWinnersPage() {
  const supabase = await createClient();

  const { data: submissions } = await supabase.from('winner_submissions').select(`
      id,
      award_id,
      review_status,
      storage_path,
      rejection_reason,
      draw_awards (
        tier,
        amount_minor,
        profiles (
          full_name,
          email
        ),
        payouts (
          status
        )
      )
    `);

  return (
    <div>
      <AdminHeader activeTab="/admin/winners" />
      <AdminWinnersClient submissions={(submissions as any) || []} />
    </div>
  );
}
