import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminDrawDetailClient } from '@/components/AdminDrawDetailClient';

export default async function AdminDrawDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: draw } = await supabase
    .from('draws')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const fallbackDraw = draw || {
    id,
    year: 2026,
    month: 3,
    status: 'draft',
    mode: 'weighted',
    official_numbers: null,
  };

  return (
    <div>
      <AdminHeader activeTab="/admin/draws" />
      <AdminDrawDetailClient draw={fallbackDraw} />
    </div>
  );
}
