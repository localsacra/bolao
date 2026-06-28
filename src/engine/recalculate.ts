import { supabase } from '../lib/supabase';
import { calculatePoints, calculateGroupPositionPoints, calculateThirdPlaceQualifierPoints } from './scoring';

export const recalculateScores = async (matchId?: number) => {
  if (matchId !== undefined) {
    console.log('Recalculating scores after update to match:', matchId);
  } else {
    console.log('Recalculating scores after admin standing update');
  }
  
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
      profiles,
      officialGroupPredsRes,
      allGroupPredictionsRes
    ] = await Promise.all([
      supabase.from('matches').select('*').not('actual_score_a', 'is', null),
      fetchAllPredictions(),
      fetchAllPlayerScores(),
      fetchAllProfiles(),
      supabase.from('group_predictions').select('*').eq('player_id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('group_predictions').select('*').neq('player_id', '00000000-0000-0000-0000-000000000000')
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

    // Map official group standings (A-L)
    const officialGroups = new Map<string, any>();
    const officialStandingsRecord: Record<string, { position_1: string, position_2: string, position_3: string, position_4: string }> = {};

    if (officialGroupPredsRes.data) {
      officialGroupPredsRes.data.forEach(g => {
        if (g.position_1 && g.position_2) {
          officialGroups.set(g.group_name, g);
        }
        officialStandingsRecord[g.group_name] = {
          position_1: g.position_1 || '',
          position_2: g.position_2 || '',
          position_3: g.position_3 || '',
          position_4: g.position_4 || ''
        };
      });
    }

    // Build the set of confirmed 3rd-place qualifiers from official standings
    const confirmedThirdPlaceQualifiers = new Set<string>(
      Object.values(officialStandingsRecord)
        .map(g => g.position_3)
        .filter((t): t is string => t !== '' && t != null)
    );

    // Map player group predictions by player_id -> group_name -> prediction
    const groupPredsMap = new Map<string, Map<string, any>>();
    if (allGroupPredictionsRes.data) {
      allGroupPredictionsRes.data.forEach(gp => {
        if (!groupPredsMap.has(gp.player_id)) {
          groupPredsMap.set(gp.player_id, new Map());
        }
        groupPredsMap.get(gp.player_id)!.set(gp.group_name, gp);
      });
    }

    const existingScoresMap = new Map(allPlayerScores?.map(s => [s.player_id, s]) || []);

    const upserts = profiles.map(profile => {
      const pId = profile.id;
      const matchPoints = scoresByPlayer.get(pId) || 0;
      
      // Calculate group points for player pId (positions 1 & 2 only)
      let groupPoints = 0;
      const playerGroupPreds = groupPredsMap.get(pId);
      
      officialGroups.forEach((official, groupName) => {
        const pred = playerGroupPreds?.get(groupName);
        if (pred) {
          const firstPick = pred.position_1 || null;
          const secondPick = pred.position_2 || null;

          const getPointsForPick = (pick: string | null, targetPosition: '1' | '2') => {
            if (!pick) return 0;
            const predPos = targetPosition;
            const actPos = official.position_1 === pick ? '1' : official.position_2 === pick ? '2' : official.position_3 === pick ? '3' : '4';
            const predQualify = true; // picked in top 2
            const didQualify = actPos === '1' || actPos === '2';
            return calculateGroupPositionPoints(predPos, actPos, predQualify, didQualify);
          };

          const p1Points = getPointsForPick(firstPick, '1');
          const p2Points = getPointsForPick(secondPick, '2');
          groupPoints += p1Points + p2Points;
        }
      });

      // Calculate third-place qualifier points (using the new signature)
      const playerThirdPlaces: string[] = [];
      const playerThirdPlacesSet = new Set<string>();
      if (playerGroupPreds) {
        playerGroupPreds.forEach(gp => {
          if (gp.position_3 && typeof gp.position_3 === 'string' && gp.position_3.trim() !== '') {
            playerThirdPlaces.push(gp.position_3);
            playerThirdPlacesSet.add(gp.position_3);
          }
        });
      }

      const thirdPlacePoints = calculateThirdPlaceQualifierPoints(playerThirdPlaces, officialStandingsRecord);

      // Cross-slot credit: position_1 or position_2 pick that ended up as a 3rd-place qualifier
      let crossSlotPoints = 0;
      if (playerGroupPreds) {
        playerGroupPreds.forEach((gp, groupName) => {
          const official = officialStandingsRecord[groupName];
          if (!official) return;

          const p1 = gp.position_1;
          const p2 = gp.position_2;

          // Avoid double-counting: if player also predicted this team in position_3, 
          // those points are already awarded in the 3rd-place section
          if (p1 && confirmedThirdPlaceQualifiers.has(p1) && !playerThirdPlacesSet.has(p1)) {
            crossSlotPoints += 10;
          }
          if (p2 && confirmedThirdPlaceQualifiers.has(p2) && !playerThirdPlacesSet.has(p2)) {
            crossSlotPoints += 10;
          }
        });
      }

      const totalGroupPoints = groupPoints + thirdPlacePoints + crossSlotPoints;

      const existing = existingScoresMap.get(pId) || { special_points: 0, id: undefined };
      
      return {
        ...(existing.id ? { id: existing.id } : {}),
        player_id: pId,
        match_points: matchPoints,
        group_points: totalGroupPoints,
        special_points: existing.special_points,
        total_points: matchPoints + totalGroupPoints + existing.special_points,
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
