export function validateAndFormatScore(value: number, roundDate: string) {
  if (!Number.isInteger(value) || value < 1 || value > 45) {
    throw new Error('Score value must be an integer between 1 and 45');
  }

  const today = new Date().toISOString().split('T')[0];
  if (roundDate > today) {
    throw new Error('Round date cannot be in the future');
  }

  return { value, round_date: roundDate };
}

export function retainFiveGreatestScores(
  existingScores: { round_date: string; value: number }[],
  newScore: { round_date: string; value: number }
) {
  const existingIdx = existingScores.findIndex((s) => s.round_date === newScore.round_date);
  if (existingIdx !== -1) {
    const updated = [...existingScores];
    updated[existingIdx] = newScore;
    return updated.sort((a, b) => b.round_date.localeCompare(a.round_date));
  }

  if (existingScores.length >= 5) {
    const oldestDate = [...existingScores].sort((a, b) => a.round_date.localeCompare(b.round_date))[0].round_date;
    if (newScore.round_date < oldestDate) {
      throw new Error(`Cannot add backdated score older than current oldest round date (${oldestDate})`);
    }
  }

  const combined = [...existingScores, newScore];
  combined.sort((a, b) => b.round_date.localeCompare(a.round_date));
  return combined.slice(0, 5);
}
