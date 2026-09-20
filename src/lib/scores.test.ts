import { describe, it, expect } from 'vitest';
import { validateAndFormatScore, retainFiveGreatestScores } from './scores';

describe('Score Retention Rules', () => {
  it('validates score range (1-45)', () => {
    expect(() => validateAndFormatScore(0, '2026-03-01')).toThrow();
    expect(() => validateAndFormatScore(46, '2026-03-01')).toThrow();
    expect(() => validateAndFormatScore(25, '2026-03-01')).not.toThrow();
  });

  it('rejects future round dates', () => {
    const futureDate = '2099-01-01';
    expect(() => validateAndFormatScore(30, futureDate)).toThrow('Round date cannot be in the future');
  });

  it('rejects backdated scores older than the oldest stored score when full', () => {
    const existing = [
      { round_date: '2026-03-05', value: 30 },
      { round_date: '2026-03-04', value: 32 },
      { round_date: '2026-03-03', value: 28 },
      { round_date: '2026-03-02', value: 35 },
      { round_date: '2026-03-01', value: 40 },
    ];

    expect(() => retainFiveGreatestScores(existing, { round_date: '2026-02-28', value: 38 })).toThrow(
      'Cannot add backdated score older than current oldest round date (2026-03-01)'
    );
  });

  it('retains 5 greatest round dates when adding newer score', () => {
    const existing = [
      { round_date: '2026-03-05', value: 30 },
      { round_date: '2026-03-04', value: 32 },
      { round_date: '2026-03-03', value: 28 },
      { round_date: '2026-03-02', value: 35 },
      { round_date: '2026-03-01', value: 40 },
    ];

    const result = retainFiveGreatestScores(existing, { round_date: '2026-03-06', value: 38 });
    expect(result).toHaveLength(5);
    expect(result[0].round_date).toBe('2026-03-06');
    expect(result.some((s) => s.round_date === '2026-03-01')).toBe(false);
  });

  it('allows editing existing round date regardless of age', () => {
    const existing = [
      { round_date: '2026-03-05', value: 30 },
      { round_date: '2026-03-04', value: 32 },
      { round_date: '2026-03-03', value: 28 },
      { round_date: '2026-03-02', value: 35 },
      { round_date: '2026-03-01', value: 40 },
    ];

    const result = retainFiveGreatestScores(existing, { round_date: '2026-03-01', value: 42 });
    expect(result).toHaveLength(5);
    expect(result.find((s) => s.round_date === '2026-03-01')?.value).toBe(42);
  });
});
