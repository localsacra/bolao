import type { Database } from '../lib/supabase';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];

export const calculatePoints = (match: Match, pred: Partial<Prediction> | undefined): number => {
  if (!pred || pred.predicted_score_a === undefined || pred.predicted_score_b === undefined) return 0;
  if (match.actual_score_a === null || match.actual_score_b === null) return 0;

  const a = match.actual_score_a;
  const b = match.actual_score_b;
  const pa = pred.predicted_score_a;
  const pb = pred.predicted_score_b;

  const actualResult = a > b ? 'A' : a < b ? 'B' : 'D';
  const predResult = pa > pb ? 'A' : pa < pb ? 'B' : 'D';

  const exactScore = a === pa && b === pb;
  const correctResult = actualResult === predResult;
  const correctTotalGoals = (a + b) === (pa + pb);

  let points = 0;
  const isKnockout = match.phase !== 'group';

  if (isKnockout) {
    if (exactScore && correctResult) points += 24;
    else if (correctResult) points += 12;

    if (!exactScore && correctTotalGoals) points += 3;
  } else {
    if (exactScore && correctResult) points += 12;
    else if (correctResult) points += 6;

    if (!exactScore && correctTotalGoals) points += 2;
  }

  return points;
};
