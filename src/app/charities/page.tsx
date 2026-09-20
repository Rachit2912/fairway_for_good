import Link from 'next/link';

export default function CharitiesPage() {
  const charities = [
    {
      slug: 'green-grassroots-foundation',
      name: 'Green Grassroots Foundation',
      tagline: 'Preserving natural ecosystems around community courses.',
      category: 'Environment',
      image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    },
    {
      slug: 'youth-golf-and-education-initiative',
      name: 'Youth Golf & Education Initiative',
      tagline: 'Empowering young minds through sportsmanship and mentorship.',
      category: 'Education',
      image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
    },
    {
      slug: 'veterans-care-alliance',
      name: 'Veterans Care Alliance',
      tagline: 'Support and rehabilitation for military veterans.',
      category: 'Healthcare',
      image_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-[#0f4c46]">
          Partner Non-Profits & Causes
        </h1>
        <p className="text-sm text-[#1a1d20]/70">
          Browse our verified partner organizations. Every subscriber directs at least 10% (up to 80%) of their subscription towards these impactful projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {charities.map((c) => (
          <div
            key={c.slug}
            className="bg-white rounded-2xl border border-[#e2ded4] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-4 p-6">
              <span className="text-xs uppercase font-semibold text-[#84a98c] tracking-wider">
                {c.category}
              </span>
              <h2 className="text-xl font-serif font-bold text-[#1a1d20]">{c.name}</h2>
              <p className="text-sm text-[#1a1d20]/70 leading-relaxed">{c.tagline}</p>
            </div>
            <div className="p-6 pt-0">
              <Link
                href={`/charities/${c.slug}`}
                className="inline-block w-full text-center py-2.5 rounded-xl bg-[#f4f1ea] border border-[#e2ded4] text-sm font-semibold text-[#0f4c46] hover:bg-[#0f4c46] hover:text-white transition-colors"
              >
                View Profile & Events
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
