import { AdminHeader } from '@/components/AdminHeader';

export default async function AdminDrawDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <AdminHeader activeTab="/admin/draws" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#0f4c46] capitalize">
              Draw Management: {id.replace(/-/g, ' ')}
            </h2>
            <p className="text-sm text-[#1a1d20]/70">
              Run dry-run simulations, execute atomic lock, generate 5 official numbers, and publish results.
            </p>
          </div>

          {/* Action Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <button className="p-4 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-left hover:border-[#0f4c46] transition-colors">
              <span className="text-xs font-bold uppercase text-[#0f4c46] block">Step 1: Simulation</span>
              <span className="text-sm font-semibold text-[#1a1d20] block mt-1">Run Dry-Run Preview</span>
              <span className="text-xs text-[#1a1d20]/60 block mt-1">
                Zero side-effects; previews potential winners and pool splits.
              </span>
            </button>

            <button className="p-4 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-left hover:border-[#0f4c46] transition-colors">
              <span className="text-xs font-bold uppercase text-[#0f4c46] block">Step 2: Lock</span>
              <span className="text-sm font-semibold text-[#1a1d20] block mt-1">Lock Entries & Pool</span>
              <span className="text-xs text-[#1a1d20]/60 block mt-1">
                Freezes score entries & funding allocations immutably.
              </span>
            </button>

            <button className="p-4 rounded-xl border border-[#0f4c46] bg-[#0f4c46] text-[#fdfbf7] text-left hover:bg-[#0a3834] transition-colors">
              <span className="text-xs font-bold uppercase text-[#84a98c] block">Step 3: Generate & Publish</span>
              <span className="text-sm font-semibold block mt-1">Publish Official Draw</span>
              <span className="text-xs text-[#fdfbf7]/80 block mt-1">
                Generates cryptographically secure numbers and reveals results.
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
