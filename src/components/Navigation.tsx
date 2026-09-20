import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-[#e2ded4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#0f4c46] text-[#fdfbf7] font-serif font-bold flex items-center justify-center text-lg">
            F
          </span>
          <span className="font-serif font-bold text-xl tracking-tight text-[#0f4c46]">
            Fairway for Good
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#1a1d20]/80">
          <Link href="/how-it-works" className="hover:text-[#0f4c46] transition-colors">
            How It Works
          </Link>
          <Link href="/charities" className="hover:text-[#0f4c46] transition-colors">
            Charities
          </Link>
          <Link href="/pricing" className="hover:text-[#0f4c46] transition-colors">
            Pricing
          </Link>
          <Link href="/draws" className="hover:text-[#0f4c46] transition-colors">
            Monthly Draws
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[#0f4c46] hover:text-[#0a3834] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-[#0f4c46] text-[#fdfbf7] px-4 py-2 rounded-lg hover:bg-[#0a3834] transition-colors shadow-sm"
          >
            Join Now
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#0f4c46] text-[#fdfbf7] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold">Fairway for Good</h3>
            <p className="text-xs text-[#fdfbf7]/70 leading-relaxed">
              Every round you play transforms into direct support for verified charitable causes while keeping you in the monthly reward draw.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[#84a98c]">Explore</h4>
            <ul className="space-y-2 text-sm text-[#fdfbf7]/80">
              <li><Link href="/how-it-works" className="hover:underline">How It Works</Link></li>
              <li><Link href="/charities" className="hover:underline">Partner Charities</Link></li>
              <li><Link href="/pricing" className="hover:underline">Subscription Plans</Link></li>
              <li><Link href="/draws" className="hover:underline">Monthly Draws</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[#84a98c]">Members</h4>
            <ul className="space-y-2 text-sm text-[#fdfbf7]/80">
              <li><Link href="/dashboard" className="hover:underline">Member Dashboard</Link></li>
              <li><Link href="/dashboard/scores" className="hover:underline">Manage Scores</Link></li>
              <li><Link href="/dashboard/winnings" className="hover:underline">My Winnings</Link></li>
              <li><Link href="/login" className="hover:underline">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[#84a98c]">Transparency</h4>
            <p className="text-xs text-[#fdfbf7]/70 leading-relaxed mb-2">
              Fixed 20% prize share pool. Minimum 10% direct charity donation (up to 80%). Fully audited multiset score matching.
            </p>
            <p className="text-xs text-[#fdfbf7]/50">
              © {new Date().getFullYear()} Fairway for Good. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
