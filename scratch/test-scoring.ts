import { calculatePoints } from '../src/engine/scoring';
import type { Database } from '../src/lib/supabase';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];

// Helper to create a base match
function createMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    phase: 'round_of_16',
    group_name: 'Knockout',
    team_a: 'Brazil',
    team_b: 'Argentina',
    match_date: '2026-06-15T22:00:00Z',
    deadline: '2026-06-15T21:45:00Z',
    actual_score_a: null,
    actual_score_b: null,
    actual_tiebreaker_winner: null,
    ...overrides
  };
}

// Helper to create a base prediction
function createPrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 1,
    player_id: 'player123',
    match_id: 1,
    predicted_score_a: 0,
    predicted_score_b: 0,
    advance_team: null,
    advance_method: null,
    predicted_tiebreaker_winner: null,
    created_at: new Date().toISOString(),
    ...overrides
  };
}

// Running tests
let passed = 0;
let failed = 0;

function assertEqual(actual: number, expected: number, testName: string) {
  if (actual === expected) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}: expected ${expected}, got ${actual}`);
    failed++;
  }
}

console.log('--- Starting Tie-Breaker Scoring Tests ---');

// Case 1: Draw predicted, correct tie-breaker winner -> base (24) + 5 = 29 pts
const match1 = createMatch({ actual_score_a: 1, actual_score_b: 1, actual_tiebreaker_winner: 'A' });
const pred1 = createPrediction({ predicted_score_a: 1, predicted_score_b: 1, predicted_tiebreaker_winner: 'A' });
assertEqual(calculatePoints(match1, pred1), 29, 'Draw predicted, correct tie-breaker winner (Exact draw scoreline: 24 + 5 = 29)');

// Case 1b: Draw predicted (non-exact), correct tie-breaker winner -> base (12) + 5 = 17 pts
const match1b = createMatch({ actual_score_a: 1, actual_score_b: 1, actual_tiebreaker_winner: 'A' });
const pred1b = createPrediction({ predicted_score_a: 2, predicted_score_b: 2, predicted_tiebreaker_winner: 'A' });
assertEqual(calculatePoints(match1b, pred1b), 17, 'Draw predicted (non-exact), correct tie-breaker winner (12 + 5 = 17)');

// Case 2: Draw predicted, wrong tie-breaker winner -> base pts only (24)
const match2 = createMatch({ actual_score_a: 1, actual_score_b: 1, actual_tiebreaker_winner: 'A' });
const pred2 = createPrediction({ predicted_score_a: 1, predicted_score_b: 1, predicted_tiebreaker_winner: 'B' });
assertEqual(calculatePoints(match2, pred2), 24, 'Draw predicted, wrong tie-breaker winner (Exact draw scoreline: 24)');

// Case 3: Draw predicted, no tie-breaker pick -> base pts only (24)
const match3 = createMatch({ actual_score_a: 1, actual_score_b: 1, actual_tiebreaker_winner: 'A' });
const pred3 = createPrediction({ predicted_score_a: 1, predicted_score_b: 1, predicted_tiebreaker_winner: null });
assertEqual(calculatePoints(match3, pred3), 24, 'Draw predicted, no tie-breaker pick (Exact draw scoreline: 24)');

// Case 4: Non-draw knockout match -> tie-breaker has no effect (24 pts)
const match4 = createMatch({ actual_score_a: 2, actual_score_b: 1, actual_tiebreaker_winner: null });
const pred4 = createPrediction({ predicted_score_a: 2, predicted_score_b: 1, predicted_tiebreaker_winner: 'A' });
assertEqual(calculatePoints(match4, pred4), 24, 'Non-draw knockout match (Exact scoreline: 24)');

// Case 5: Group stage match -> tie-breaker logic never applies
// Exact draw prediction in group stage is 12 pts (draw result in group stage)
const match5 = createMatch({ phase: 'group', actual_score_a: 1, actual_score_b: 1, actual_tiebreaker_winner: 'A' });
const pred5 = createPrediction({ predicted_score_a: 1, predicted_score_b: 1, predicted_tiebreaker_winner: 'A' });
assertEqual(calculatePoints(match5, pred5), 12, 'Group stage match (Exact draw scoreline: 12)');

console.log(`\n--- Test Summary: ${passed} passed, ${failed} failed ---`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
