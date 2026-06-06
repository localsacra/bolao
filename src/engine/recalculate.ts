import { supabase } from '../lib/supabase';
import { calculatePoints } from './scoring';

export const recalculateScores = async (matchId: number) => {
  console.log('Recalculating scores after update to match:', matchId);
  // We recalculate all scores for all players based on the source of truth to ensure 100% accuracy.
  const [
    { data: allMatches },
    { data: allPredictions },
    { data: allPlayerScores },
    { data: profiles }
  ] = await Promise.all([
    supabase.from('matches').select('*').not('actual_score_a', 'is', null),
    supabase.from('predictions').select('*'),
    supabase.from('player_scores').select('*'),
    supabase.from('profiles').select('id')
  ]);

  if (!allMatches || !allPredictions || !profiles) {
    console.error("Failed to fetch data for score recalculation.");
    return;
  }

  const matchMap = new Map(allMatches.map(m => [m.id, m]));
  const scoresByPlayer = new Map<string, number>();

  allPredictions.forEach(pred => {
    const match = matchMap.get(pred.match_id);
    if (match) {
      const points = calculatePoints(match, pred);
      scoresByPlayer.set(pred.player_id, (scoresByPlayer.get(pred.player_id) || 0) + points);
    }
  });

  const existingScoresMap = new Map(allPlayerScores?.map(s => [s.player_id, s]) || []);

  const upserts = profiles.map(profile => {
    const pId = profile.id;
    const matchPoints = scoresByPlayer.get(pId) || 0;
    const existing = existingScoresMap.get(pId) || { group_points: 0, special_points: 0, id: undefined };
    
    return {
      ...(existing.id ? { id: existing.id } : {}),
      player_id: pId,
      match_points: matchPoints,
      group_points: existing.group_points,
      special_points: existing.special_points,
      total_points: matchPoints + existing.group_points + existing.special_points,
      updated_at: new Date().toISOString()
    };
  });

  for (const row of upserts) {
    if (row.id) {
       await supabase.from('player_scores').update(row).eq('id', row.id);
    } else {
       await supabase.from('player_scores').insert(row);
    }
  }
};
