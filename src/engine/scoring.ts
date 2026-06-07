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

export function calculateGroupPositionPoints(
  predicted: {
    position_1: string;
    position_2: string;
    position_3: string;
    position_4: string;
  },
  actual: {
    position_1: string;
    position_2: string;
    position_3: string;
    position_4: string;
  }
): number {
  let points = 0;
  // 15 points for each correct position
  if (predicted.position_1 === actual.position_1) points += 15;
  if (predicted.position_2 === actual.position_2) points += 15;
  if (predicted.position_3 === actual.position_3) points += 15;
  if (predicted.position_4 === actual.position_4) points += 15;
  return points;
}

export function calculateThirdPlaceQualifierPoints(
  // Player's predicted list of 8 third-placed teams
  // that advance to Round of 32
  predicted: string[],
  // Actual 8 third-placed teams that advanced
  actual: string[]
): number {
  let points = 0;
  // 15 points for each correct third-placed team predicted
  predicted.forEach(team => {
    if (actual.includes(team)) points += 15;
  });
  return points;
}

