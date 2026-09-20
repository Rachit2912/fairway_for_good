import Link from 'next/link';

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-4">
        <Link href="/charities" className="text-xs font-semibold text-[#0f4c46] hover:underline">
          ← Back to Charities Directory
        </Link>
        <h1 className="text-4xl font-serif font-bold text-[#0f4c46] capitalize">
          {slug.replace(/-/g, ' ')}
        </h1>
        <div className="inline-block px-3 py-1 bg-[#84a98c]/20 text-[#0f4c46] text-xs font-semibold rounded-full uppercase">
          Verified Non-Profit Partner
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#e2ded4] space-y-6">
        <h2 className="text-2xl font-serif font-bold text-[#1a1d20]">About the Cause</h2>
        <p className="text-sm text-[#1a1d20]/80 leading-relaxed">
          This non-profit works tirelessly to deliver measurable impact within local communities. Subscriptions from Fairway for Good members provide recurring, direct funding to help advance their core mission.
        </p>

        <div className="pt-6 border-t border-[#e2ded4] space-y-4">
          <h3 className="text-lg font-serif font-bold text-[#1a1d20]">Upcoming Community Events</h3>
          <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] space-y-2">
            <h4 className="font-semibold text-sm text-[#0f4c46]">Annual Charity Scramble & Dinner</h4>
            <p className="text-xs text-[#1a1d20]/70">
              Location: Pine Valley Golf Club • Date: Next Month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
