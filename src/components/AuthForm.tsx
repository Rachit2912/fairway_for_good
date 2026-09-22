'use client';

import Link from 'next/link';
import { useState } from 'react';
import { loginAction, signupAction } from '@/app/actions/authActions';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const res = isSignup ? await signupAction(formData) : await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-3xl border border-[#e2ded4] shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-serif font-bold text-[#0f4c46]">
            {isSignup ? 'Join Fairway for Good' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-[#1a1d20]/70">
            {isSignup
              ? 'Create your account to manage scores and support causes.'
              : 'Sign in to access your dashboard and draw history.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="John Golfer"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="golfer@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[#1a1d20]/70 mb-1">
                Initial Charity Percentage (10% - 80%)
              </label>
              <input
                type="number"
                name="charity_percentage"
                min="10"
                max="80"
                defaultValue="10"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2ded4] focus:outline-none focus:ring-2 focus:ring-[#0f4c46]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0f4c46] text-[#fdfbf7] font-semibold hover:bg-[#0a3834] transition-colors shadow-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-[#1a1d20]/70 pt-2 border-t border-[#e2ded4]">
          {isSignup ? (
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#0f4c46] hover:underline">
                Sign in
              </Link>
            </p>
          ) : (
            <p>
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="font-semibold text-[#0f4c46] hover:underline">
                Create one now
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
