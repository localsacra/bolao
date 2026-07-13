import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePoints } from './scoring';
import type { Database } from '../lib/supabase';

type Match = Database['public']['Tables']['matches']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];

// Dummy base objects to build test cases on
const baseMatch: Match = {
  id: 1,
  phase: 'round_of_16', // Knockout phase
  group_name: 'Knockout',
  team_a: 'Norway',
  team_b: 'England',
  match_date: '2026-07-11T18:00:00Z',
  deadline: '2026-07-11T17:45:00Z',
  actual_score_a: null,
  actual_score_b: null,
  actual_tiebreaker_winner: null,
  actual_advance_method: null,
};

const basePrediction: Prediction = {
  id: 1,
  player_id: 'user-123',
  match_id: 1,
  predicted_score_a: 0,
  predicted_score_b: 0,
  advance_team: null,
  advance_method: null,
  predicted_tiebreaker_winner: null,
  created_at: new Date().toISOString(),
};

test('Scenario 1: Draw predicted, Actual is draw', async (t: any) => {
  await t.test('Correct advancer, correct method', () => {
    // Prediction: 1-1 draw, B (England) advances via Penalties
    const pred: Partial<Prediction> = {
      ...basePrediction,
      predicted_score_a: 1,
      predicted_score_b: 1,
      advance_team: 'England',
      advance_method: 'Pênaltis',
      predicted_tiebreaker_winner: 'B',
    };

    // Actual result: 1-1 draw, B (England) advances via Penalties
    const match: Match = {
      ...baseMatch,
      actual_score_a: 1,
      actual_score_b: 1,
      actual_tiebreaker_winner: 'B',
      actual_advance_method: 'Pênaltis',
    };

    // Exact Score (24) + Correct Advancer (15) + Tie-breaker Winner (3) + Method (5) = 47 pts
    const points = calculatePoints(match, pred);
    assert.equal(points, 47);
  });

  await t.test('Correct advancer, wrong method', () => {
    // Prediction: 1-1 draw, B (England) advances via Penalties
    const pred: Partial<Prediction> = {
      ...basePrediction,
      predicted_score_a: 1,
      predicted_score_b: 1,
      advance_team: 'England',
      advance_method: 'Pênaltis',
      predicted_tiebreaker_winner: 'B',
    };

    // Actual result: 1-1 draw, B (England) advances via Extra Time (Prorrogação)
    const match: Match = {
      ...baseMatch,
      actual_score_a: 1,
      actual_score_b: 1,
      actual_tiebreaker_winner: 'B',
      actual_advance_method: 'Prorrogação',
    };

    // Exact Score (24) + Correct Advancer (15) + Tie-breaker Winner (3) + Wrong Method (0) = 42 pts
    const points = calculatePoints(match, pred);
    assert.equal(points, 42);
  });

  await t.test('Wrong advancer, wrong method (method gated off)', () => {
    // Prediction: 1-1 draw, A (Norway) advances via Penalties
    const pred: Partial<Prediction> = {
      ...basePrediction,
      predicted_score_a: 1,
      predicted_score_b: 1,
      advance_team: 'Norway',
      advance_method: 'Pênaltis',
      predicted_tiebreaker_winner: 'A',
    };

    // Actual result: 1-1 draw, B (England) advances via Penalties
    const match: Match = {
      ...baseMatch,
      actual_score_a: 1,
      actual_score_b: 1,
      actual_tiebreaker_winner: 'B',
      actual_advance_method: 'Pênaltis',
    };

    // Exact Score (24) + Wrong Advancer (0) + Tie-breaker Winner (0) + Method Gated (0) = 24 pts
    const points = calculatePoints(match, pred);
    assert.equal(points, 24);
  });
});

test('Scenario 2: Non-draw predicted, Actual is draw', async (t: any) => {
  await t.test('Predicted winner regulation advances (gains advancer bonus + regulation goals)', () => {
    // Prediction: 2-1 (A wins in regulation), so predicted advancer is A (Norway)
    const pred: Partial<Prediction> = {
      ...basePrediction,
      predicted_score_a: 2,
      predicted_score_b: 1,
    };

    // Actual result: 1-1 draw, A (Norway) advances on penalties
    const match: Match = {
      ...baseMatch,
      actual_score_a: 1,
      actual_score_b: 1,
      actual_tiebreaker_winner: 'A',
      actual_advance_method: 'Pênaltis',
    };

    // Result is draw, so correctResult is false (0).
    // predictedAdvancer (Norway) === actualAdvancer (Norway) is true (+15 pts).
    // predicted_score_b === actual_score_b (1 === 1) is true, so oneTeamGoalsCorrect is true (+3 pts).
    // Exact Score is false.
    // Total: 0 + 15 + 3 = 18 pts
    const points = calculatePoints(match, pred);
    assert.equal(points, 18);
  });

  await t.test('Predicted winner regulation does not advance (only regulation goals)', () => {
    // Prediction: 2-1 (A wins in regulation), so predicted advancer is A (Norway)
    const pred: Partial<Prediction> = {
      ...basePrediction,
      predicted_score_a: 2,
      predicted_score_b: 1,
    };

    // Actual result: 1-1 draw, B (England) advances on penalties
    const match: Match = {
      ...baseMatch,
      actual_score_a: 1,
      actual_score_b: 1,
      actual_tiebreaker_winner: 'B',
      actual_advance_method: 'Pênaltis',
    };

    // Result is draw, so correctResult is false (0).
    // predictedAdvancer (Norway) === actualAdvancer (England) is false (0).
    // predicted_score_b === actual_score_b (1 === 1) is true (+3 pts).
    // Total: 3 pts
    const points = calculatePoints(match, pred);
    assert.equal(points, 3);
  });
});
