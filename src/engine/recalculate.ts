import { supabase } from '../lib/supabase';
import { calculatePoints } from './scoring';

export const recalculateScores = async (matchId: number) => {
  console.log('Recalculating scores after update to match:', matchId);
  
  const fetchAllPredictions = async () => {
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .range(from, from + 999);
      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      } else {
        hasMore = false;
      }
    }
    return allData;
  };

  const fetchAllPlayerScores = async () => {
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('player_scores')
        .select('*')
        .range(from, from + 999);
      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      } else {
        hasMore = false;
      }
    }
    return allData;
  };

  const fetchAllProfiles = async () => {
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .range(from, from + 999);
      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
        }
      } else {
        hasMore = false;
      }
    }
    return allData;
  };

  try {
    const [
      allMatchesRes,
      allPredictions,
      allPlayerScores,
      profiles
    ] = await Promise.all([
      supabase.from('matches').select('*').not('actual_score_a', 'is', null),
      fetchAllPredictions(),
      fetchAllPlayerScores(),
      fetchAllProfiles()
    ]);

    const allMatches = allMatchesRes.data;

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
  } catch (error) {
    console.error("Error in recalculateScores:", error);
  }
};
