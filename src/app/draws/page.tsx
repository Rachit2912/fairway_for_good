import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DrawsPage() {
  const supabase = await createClient();

  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-[#0f4c46]">
          Monthly Draws & Published Results
        </h1>
        <p className="text-sm text-[#1a1d20]/70">
          Transparent 5-number draw history, multiset matching breakdowns, and verified prize distributions.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#e2ded4] space-y-6">
        <h2 className="text-xl font-serif font-bold text-[#1a1d20]">Published Draws</h2>

        {draws && draws.length > 0 ? (
          <div className="space-y-4">
            {draws.map((d) => (
              <div
                key={d.id}
                className="p-6 rounded-2xl bg-[#f4f1ea] border border-[#e2ded4] flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div>
                  <span className="text-xs font-semibold text-[#84a98c] uppercase">Official Draw</span>
                  <h3 className="text-2xl font-serif font-bold text-[#0f4c46]">
                    Draw {d.month}/{d.year}
                  </h3>
                  <p className="text-xs text-[#1a1d20]/70">Mode: {d.mode}</p>
                </div>

                {d.official_numbers && (
                  <div className="flex gap-3">
                    {d.official_numbers.map((num: number, i: number) => (
                      <span
                        key={i}
                        className="w-12 h-12 rounded-full bg-[#0f4c46] text-[#fdfbf7] font-bold text-lg flex items-center justify-center shadow-sm"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href={`/draws/${d.id}`}
                  className="px-4 py-2.5 rounded-xl bg-[#0f4c46] text-[#fdfbf7] text-sm font-semibold hover:bg-[#0a3834] transition-colors"
                >
                  View Award Breakdown
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#f4f1ea] text-center space-y-2">
            <p className="text-sm font-semibold text-[#0f4c46]">No Published Draws Yet</p>
            <p className="text-xs text-[#1a1d20]/70">
              Check back soon for upcoming monthly draw results!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
