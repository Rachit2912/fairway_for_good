import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function DrawDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: draw } = await supabase
    .from('draws')
    .select('*, draw_financials(*)')
    .eq('id', id)
    .maybeSingle();

  if (!draw) {
    notFound();
  }

  const financials = draw.draw_financials;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-4">
        <Link href="/draws" className="text-xs font-semibold text-[#0f4c46] hover:underline">
          ← Back to Monthly Draws
        </Link>
        <h1 className="text-4xl font-serif font-bold text-[#0f4c46]">
          Draw {draw.month}/{draw.year} Details
        </h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#e2ded4] space-y-6">
        <div className="flex items-center justify-between border-b border-[#e2ded4] pb-6">
          <div>
            <span className="text-xs uppercase font-semibold text-[#84a98c]">
              Status: {draw.status}
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">Winning Numbers</h2>
          </div>
          {draw.official_numbers && (
            <div className="flex gap-3">
              {draw.official_numbers.map((num: number, i: number) => (
                <span
                  key={i}
                  className="w-12 h-12 rounded-full bg-[#0f4c46] text-[#fdfbf7] font-bold text-lg flex items-center justify-center shadow-sm"
                >
                  {num}
                </span>
              ))}
            </div>
          )}
        </div>

        {financials && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <h3 className="text-xs uppercase font-semibold text-[#1a1d20]/70">5-Match Pool (40%)</h3>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">
                ₹{(financials.five_match_pool_minor / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#1a1d20]/60 mt-1">
                {financials.five_match_winners_count} Winners (
                {financials.five_match_winners_count > 0
                  ? `₹${(financials.five_match_payout_per_winner_minor / 100).toFixed(2)} each`
                  : `Rolled over ₹${(financials.five_match_rollover_minor / 100).toFixed(2)}`}
                )
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <h3 className="text-xs uppercase font-semibold text-[#1a1d20]/70">4-Match Pool (35%)</h3>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">
                ₹{(financials.four_match_pool_minor / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#1a1d20]/60 mt-1">
                {financials.four_match_winners_count} Winners (
                {financials.four_match_winners_count > 0
                  ? `₹${(financials.four_match_payout_per_winner_minor / 100).toFixed(2)} each`
                  : 'Unawarded'}
                )
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4]">
              <h3 className="text-xs uppercase font-semibold text-[#1a1d20]/70">3-Match Pool (25%)</h3>
              <p className="text-xl font-bold text-[#0f4c46] mt-1">
                ₹{(financials.three_match_pool_minor / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#1a1d20]/60 mt-1">
                {financials.three_match_winners_count} Winners (
                {financials.three_match_winners_count > 0
                  ? `₹${(financials.three_match_payout_per_winner_minor / 100).toFixed(2)} each`
                  : 'Unawarded'}
                )
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
