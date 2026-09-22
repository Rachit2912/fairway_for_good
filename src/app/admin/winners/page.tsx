import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminWinnersClient } from '@/components/AdminWinnersClient';

export default async function AdminWinnersPage() {
  const supabase = await createClient();

  const { data: submissions, error: err } = await supabase.from('winner_submissions').select(`
      id,
      award_id,
      review_status,
      storage_path,
      rejection_reason,
      draw_awards!fk_winner_submissions_award (
        tier,
        amount_minor,
        profiles!fk_draw_awards_profile (
          full_name,
          email
        ),
        payouts!fk_payouts_award (
          status
        )
      )
    `);

  if (err) {
    console.error('Database query error in /admin/winners:', err.message);
  }

  return (
    <div>
      <AdminHeader activeTab="/admin/winners" />
      {err && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            Database Error: {err.message}
          </div>
        </div>
      )}
      <AdminWinnersClient submissions={(submissions as unknown as Parameters<typeof AdminWinnersClient>[0]['submissions']) || []} />
    </div>
  );
}
