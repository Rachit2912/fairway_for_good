import { createClient } from '@/lib/supabase/server';
import { CharityDetailClient } from '@/components/CharityDetailClient';
import { notFound } from 'next/navigation';

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: charity } = await supabase
    .from('charities')
    .select('id, slug, name, tagline, description, category, featured')
    .eq('slug', slug)
    .single();

  if (!charity) {
    notFound();
  }

  const { data: events } = await supabase
    .from('charity_events')
    .select('id, title, description, event_date, location')
    .eq('charity_id', charity.id)
    .order('event_date', { ascending: true });

  return <CharityDetailClient charity={charity} events={events || []} />;
}
