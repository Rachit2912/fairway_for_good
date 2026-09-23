import { createClient } from '@/lib/supabase/server';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminCharitiesClient } from '@/components/AdminCharitiesClient';

export default async function AdminCharitiesPage() {
  const supabase = await createClient();

  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <AdminHeader activeTab="/admin/charities" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <AdminCharitiesClient charities={charities || []} />
      </div>
    </div>
  );
}
