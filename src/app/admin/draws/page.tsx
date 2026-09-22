import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminDrawsClient } from '@/components/AdminDrawsClient';

export default async function AdminDrawsPage() {
  const supabase = await createClient();

  const { data: draws } = await supabase
    .from('draws')
    .select('id, year, month, status, mode, locked_at, published_at')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  return (
    <div>
      <AdminHeader activeTab="/admin/draws" />
      <AdminDrawsClient draws={draws || []} />
    </div>
  );
}
