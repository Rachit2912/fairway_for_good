import Link from 'next/link';

export function AdminHeader({ activeTab }: { activeTab: string }) {
  const tabs = [
    { name: 'Overview', href: '/admin' },
    { name: 'Users & Subscriptions', href: '/admin/users' },
    { name: 'Draw Management', href: '/admin/draws' },
    { name: 'Charities & Events', href: '/admin/charities' },
    { name: 'Winner Approvals & Payouts', href: '/admin/winners' },
    { name: 'Financial & Impact Reports', href: '/admin/reports' },
  ];

  return (
    <div className="border-b border-[#e2ded4] bg-white mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#e06d53]">
              Administrative Portal
            </span>
            <h1 className="text-3xl font-serif font-bold text-[#0f4c46]">Admin Suite</h1>
          </div>
          <span className="text-xs bg-[#0f4c46] text-[#fdfbf7] font-semibold px-3 py-1 rounded-full">
            Admin Privileges Active
          </span>
        </div>

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
