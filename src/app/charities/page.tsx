import { createClient } from '@/lib/supabase/server';
import { CharitiesClient } from '@/components/CharitiesClient';

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ donation_success?: string; donation_canceled?: string }>;
}) {
  const { donation_success, donation_canceled } = await searchParams;
  const supabase = await createClient();

  const { data: charities } = await supabase
    .from('charities')
    .select('id, slug, name, tagline, category, featured')
    .eq('active', true)
    .order('featured', { ascending: false });

  return (
    <CharitiesClient
      charities={charities || []}
      donationSuccess={donation_success === 'true'}
      donationCanceled={donation_canceled === 'true'}
    />
  );
}
