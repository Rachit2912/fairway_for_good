import Link from 'next/link';

export function MemberHeader({ activeTab }: { activeTab: string }) {
  const tabs = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'My Scores', href: '/dashboard/scores' },
    { name: 'Charity Settings', href: '/dashboard/charity' },
    { name: 'Billing', href: '/dashboard/billing' },
    { name: 'Draw History', href: '/dashboard/draws' },
    { name: 'My Winnings', href: '/dashboard/winnings' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="border-b border-[#e2ded4] bg-white mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-serif font-bold text-[#0f4c46]">Member Dashboard</h1>
        <p className="text-sm text-[#1a1d20]/70 mt-1">
          Manage your scores, subscription entitlement, charity contributions, and prize winnings.
        </p>

        <nav className="flex space-x-8 mt-6 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.href === activeTab;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`text-sm font-semibold whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0f4c46] text-[#0f4c46]'
                    : 'border-transparent text-[#1a1d20]/60 hover:text-[#0f4c46]'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
