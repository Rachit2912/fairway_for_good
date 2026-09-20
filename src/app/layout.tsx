import type { Metadata } from 'next';
import './globals.css';
import { Navbar, Footer } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Fairway for Good | Turn Your Golf Round Into Charitable Impact',
  description: 'Join Fairway for Good: log your top golf scores, enter monthly prize draws, and direct funds to verified charities with every subscription.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fdfbf7] text-[#1a1d20] min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
