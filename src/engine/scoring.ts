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
  const oneTeamGoalsCorrect = a === pa || b === pb;

  let points = 0;
  const isKnockout = match.phase !== 'group';

  if (isKnockout) {
    if (exactScore && correctResult) points += 24;
    else if (correctResult) points += 12;

    if (!exactScore && oneTeamGoalsCorrect) points += 3;

    // Tie-breaker bonus (+5 pts)
    if (
      pa === pb &&
      a === b &&
      pred.predicted_tiebreaker_winner &&
      match.actual_tiebreaker_winner &&
      pred.predicted_tiebreaker_winner === match.actual_tiebreaker_winner
    ) {
      points += 5;
    }
  } else {
    if (exactScore && correctResult) points += 12;
    else if (correctResult) points += 6;

    if (!exactScore && oneTeamGoalsCorrect) points += 2;
  }

  return points;
};

export function calculateGroupPositionPoints(
  predictedPosition: string,
  actualPosition: string,
  predictedQualify: boolean,
  didQualify: boolean
): number {
  if (predictedPosition === actualPosition) return 15;
  if (predictedQualify && didQualify) return 10;
  return 0;
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

export function calculateSpecialPoints(
  prediction: {
    champion: string;
    vice_champion?: string;
    third_place?: string;
    top_scorer: string;
    best_player: string;
  },
  actual: {
    champion: string;
    vice_champion?: string;
    third_place?: string;
    top_scorer: string;
    best_player: string;
  }
): number {
  let points = 0;
  if (prediction.champion === actual.champion) points += 25;
  if (prediction.vice_champion && 
      prediction.vice_champion === actual.vice_champion) 
    points += 10;
  if (prediction.third_place && 
      prediction.third_place === actual.third_place) 
    points += 10;
  if (prediction.top_scorer === actual.top_scorer) 
    points += 15;
  if (prediction.best_player === actual.best_player) 
    points += 15;
  return points;
}


