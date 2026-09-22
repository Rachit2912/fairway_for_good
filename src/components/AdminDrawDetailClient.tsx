'use client';

import { useState } from 'react';
import {
  adminSimulateDrawAction,
  adminLockDrawAction,
  adminGenerateDrawAction,
  adminPublishDrawAction,
} from '@/app/actions/adminActions';

export function AdminDrawDetailClient({
  draw,
}: {
  draw: {
    id: string;
    year: number;
    month: number;
    status: string;
    mode: string;
    official_numbers: number[] | null;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<{
    previewNumbers: number[];
    projectedWinners: { fiveMatch: number; fourMatch: number; threeMatch: number };
  } | null>(null);

  async function handleSimulate() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await adminSimulateDrawAction(draw.id);
    if (res?.error) {
      setError(res.error);
    } else if (res?.simulation) {
      setSimulation(res.simulation);
      setSuccess('Dry-run simulation completed! Results are preview-only.');
    }
    setLoading(false);
  }

  async function handleLock() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await adminLockDrawAction(draw.id);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Monthly draw locked successfully! Entries snapshot frozen.');
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await adminGenerateDrawAction(draw.id);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(`Official draw numbers generated server-side: ${res.numbers?.join(', ')}`);
    }
    setLoading(false);
  }

  async function handlePublish() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await adminPublishDrawAction(draw.id);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Draw published! Official numbers and calculated awards released to public results.');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Dry-Run Simulation Preview Banner */}
      {simulation && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200 px-3 py-1 rounded-full">
              Dry-Run Simulation Preview (Non-Persistent)
            </span>
            <span className="text-xs text-amber-800 font-semibold">Preview Only — Zero Financial Side Effects</span>
          </div>
          <p className="text-sm font-semibold text-amber-900">
            Simulated Numbers: {simulation.previewNumbers.join(', ')}
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2 text-xs text-amber-900">
            <div>5-Match Winners: <strong>{simulation.projectedWinners.fiveMatch}</strong></div>
            <div>4-Match Winners: <strong>{simulation.projectedWinners.fourMatch}</strong></div>
            <div>3-Match Winners: <strong>{simulation.projectedWinners.threeMatch}</strong></div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-[#e2ded4] space-y-6 shadow-sm">
        <div className="space-y-2">
          <span className="text-xs uppercase font-semibold text-[#84a98c]">
            Status: {draw.status}
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f4c46]">
            Draw {draw.month}/{draw.year} Control
          </h2>
          <p className="text-xs text-[#1a1d20]/70">Mode: {draw.mode}</p>
          {draw.official_numbers && (
            <p className="text-sm font-semibold text-[#0f4c46]">
              Official Winning Numbers: {draw.official_numbers.join(', ')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="p-4 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-left hover:border-[#0f4c46] transition-colors disabled:opacity-50"
          >
            <span className="text-xs font-bold uppercase text-[#0f4c46] block">Simulation</span>
            <span className="text-sm font-semibold text-[#1a1d20] block mt-1">Run Dry-Run Preview</span>
          </button>

          <button
            onClick={handleLock}
            disabled={loading || draw.status !== 'draft'}
            className="p-4 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-left hover:border-[#0f4c46] transition-colors disabled:opacity-50"
          >
            <span className="text-xs font-bold uppercase text-[#0f4c46] block">Step 1: Lock</span>
            <span className="text-sm font-semibold text-[#1a1d20] block mt-1">Lock Entries & Pool</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading || draw.status !== 'locked'}
            className="p-4 rounded-xl border border-[#e2ded4] bg-[#f4f1ea] text-left hover:border-[#0f4c46] transition-colors disabled:opacity-50"
          >
            <span className="text-xs font-bold uppercase text-[#0f4c46] block">Step 2: Generate</span>
            <span className="text-sm font-semibold text-[#1a1d20] block mt-1">Generate Numbers Server-Side</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={loading || draw.status !== 'generated'}
            className="p-4 rounded-xl border border-[#0f4c46] bg-[#0f4c46] text-[#fdfbf7] text-left hover:bg-[#0a3834] transition-colors disabled:opacity-50"
          >
            <span className="text-xs font-bold uppercase text-[#84a98c] block">Step 3: Publish</span>
            <span className="text-sm font-semibold block mt-1">Publish & Calculate Awards</span>
          </button>
        </div>
      </div>
    </div>
  );
}
