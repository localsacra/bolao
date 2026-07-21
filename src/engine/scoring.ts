import { isKnownPhase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// Point rules configuration constants
export const POINTS_KNOCKOUT_EXACT = 24;
export const POINTS_KNOCKOUT_CORRECT_RESULT = 12;
export const POINTS_KNOCKOUT_ONE_TEAM_GOALS = 3;
export const POINTS_GROUP_EXACT = 12;
export const POINTS_GROUP_CORRECT_RESULT = 6;
export const POINTS_GROUP_ONE_TEAM_GOALS = 2;
export const POINTS_CORRECT_ADVANCER = 15;
export const POINTS_ADVANCE_METHOD = 5;

export const POINTS_SPECIAL_CHAMPION = 25;
export const POINTS_SPECIAL_RUNNER_UP = 10;
export const POINTS_SPECIAL_THIRD_PLACE = 10;
export const POINTS_SPECIAL_TOP_SCORER = 15;
export const POINTS_SPECIAL_BEST_PLAYER = 15;

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];

export const getPredictedAdvancer = (match: Match, pred: Partial<Prediction> | undefined): string | null => {
  if (!pred || pred.predicted_score_a == null || pred.predicted_score_b == null) return null;
  if (pred.predicted_score_a > pred.predicted_score_b) return match.team_a;
  if (pred.predicted_score_a < pred.predicted_score_b) return match.team_b;
  if (pred.advance_team) return pred.advance_team;
  if (pred.predicted_tiebreaker_winner === 'A') return match.team_a;
  if (pred.predicted_tiebreaker_winner === 'B') return match.team_b;
  return null;
};

export const getActualAdvancer = (match: Match): string | null => {
  if (match.actual_score_a == null || match.actual_score_b == null) return null;
  if (match.actual_score_a > match.actual_score_b) return match.team_a;
  if (match.actual_score_a < match.actual_score_b) return match.team_b;
  if (match.actual_tiebreaker_winner === 'A') return match.team_a;
  if (match.actual_tiebreaker_winner === 'B') return match.team_b;
  return null;
};

export const calculatePoints = (match: Match, pred: Partial<Prediction> | undefined): number => {
  if (!isKnownPhase(match.phase)) {
    console.warn(`Unknown match phase: "${match.phase}" — returning 0`);
    return 0;
  }

  if (!pred || pred.predicted_score_a == null || pred.predicted_score_b == null) return 0;
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
    if (exactScore && correctResult) points += POINTS_KNOCKOUT_EXACT;
    else if (correctResult) points += POINTS_KNOCKOUT_CORRECT_RESULT;

    if (!exactScore && oneTeamGoalsCorrect) points += POINTS_KNOCKOUT_ONE_TEAM_GOALS;

    // Correct advancer bonus (POINTS_CORRECT_ADVANCER = 15 pts)
    // Awarded generally to anyone who correctly predicts the team that ultimately advances,
    // whether they predicted a draw or a regulation win.
    const predictedAdvancer = getPredictedAdvancer(match, pred);
    const actualAdvancer = getActualAdvancer(match);
    if (predictedAdvancer && actualAdvancer && predictedAdvancer === actualAdvancer) {
      points += POINTS_CORRECT_ADVANCER;
    }

    // Advance method bonus (POINTS_ADVANCE_METHOD = 5 pts)
    // Awarded strictly on draw matches (both predicted and actual score are draws) where
    // the user correctly predicted the tie-breaker winner AND the advance method.
    // Note: The advance method check is combined with the tie-breaker winner check to gate
    // the bonus strictly behind a correct winner prediction.
    if (
      pa === pb &&
      a === b &&
      pred.predicted_tiebreaker_winner &&
      match.actual_tiebreaker_winner &&
      pred.predicted_tiebreaker_winner === match.actual_tiebreaker_winner &&
      pred.advance_method &&
      match.actual_advance_method &&
      pred.advance_method === match.actual_advance_method
    ) {
      points += POINTS_ADVANCE_METHOD;
    }
  } else {
    if (exactScore && correctResult) points += POINTS_GROUP_EXACT;
    else if (correctResult) points += POINTS_GROUP_CORRECT_RESULT;

    if (!exactScore && oneTeamGoalsCorrect) points += POINTS_GROUP_ONE_TEAM_GOALS;
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

export function parseApprovedSpecialKeys(actualField: string | undefined | null): Set<string> {
  if (!actualField || !actualField.trim()) return new Set();
  const keys = actualField
    .split('|')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  return new Set(keys);
}

export function isCategoryPredictionCorrect(
  userPrediction: string | null | undefined,
  officialString: string | null | undefined
): boolean {
  const userKey = normalizeSpecialPrediction(userPrediction);
  if (!userKey) return false;
  const approvedSet = parseApprovedSpecialKeys(officialString);
  return approvedSet.has(userKey);
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
  if (isCategoryPredictionCorrect(prediction.champion, actual.champion)) points += POINTS_SPECIAL_CHAMPION;
  if (prediction.vice_champion && isCategoryPredictionCorrect(prediction.vice_champion, actual.vice_champion)) points += POINTS_SPECIAL_RUNNER_UP;
  if (prediction.third_place && isCategoryPredictionCorrect(prediction.third_place, actual.third_place)) points += POINTS_SPECIAL_THIRD_PLACE;
  if (isCategoryPredictionCorrect(prediction.top_scorer, actual.top_scorer)) points += POINTS_SPECIAL_TOP_SCORER;
  if (isCategoryPredictionCorrect(prediction.best_player, actual.best_player)) points += POINTS_SPECIAL_BEST_PLAYER;
  return points;
}



