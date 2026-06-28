import { isKnownPhase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];

export const calculatePoints = (match: Match, pred: Partial<Prediction> | undefined): number => {
  if (!isKnownPhase(match.phase)) {
    console.warn(`Unknown match phase: "${match.phase}" — returning 0`);
    return 0;
  }

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

      // Advance method bonus (+3 pts)
      if (
        pred.advance_method &&
        match.actual_advance_method &&
        pred.advance_method === match.actual_advance_method
      ) {
        points += 3;
      }
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
  // predicted: array of teams the player tipped to advance as 3rd-place qualifiers
  predicted: string[],
  // actualStandings: official group results keyed by group name
  actualStandings: Record<string, { position_1: string, position_2: string, position_3: string, position_4?: string }>
): number {
  let points = 0;
  predicted.forEach(team => {
    if (!team) return;
    for (const [_, official] of Object.entries(actualStandings)) {
      const isTeamInGroup = 
        official.position_1 === team || 
        official.position_2 === team || 
        official.position_3 === team || 
        official.position_4 === team;
        
      if (isTeamInGroup) {
        if (official.position_3 === team) {
          points += 15;
        } else if (official.position_1 === team || official.position_2 === team) {
          points += 10;
        }
        break;
      }
    }
  });
  return points;
}

export function normalizeSpecialPrediction(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
    .replace(/[^a-z0-9]/g, '');      // Remove all non-alphanumeric characters
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
  if (normalizeSpecialPrediction(prediction.champion) === normalizeSpecialPrediction(actual.champion)) points += 25;
  if (prediction.vice_champion && 
      normalizeSpecialPrediction(prediction.vice_champion) === normalizeSpecialPrediction(actual.vice_champion)) 
    points += 10;
  if (prediction.third_place && 
      normalizeSpecialPrediction(prediction.third_place) === normalizeSpecialPrediction(actual.third_place)) 
    points += 10;
  if (normalizeSpecialPrediction(prediction.top_scorer) === normalizeSpecialPrediction(actual.top_scorer)) 
    points += 15;
  if (normalizeSpecialPrediction(prediction.best_player) === normalizeSpecialPrediction(actual.best_player)) 
    points += 15;
  return points;
}


