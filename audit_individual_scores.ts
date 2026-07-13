import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Import scoring functions directly from the codebase
import {
  calculatePoints,
  calculateGroupPositionPoints,
  calculateThirdPlaceQualifierPoints,
  calculateSpecialPoints
} from './src/engine/scoring';

// Load environment variables from .env and .env.local
const loadEnv = () => {
  const env: Record<string, string> = { ...process.env as Record<string, string> };

  const parseEnvFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        env[key] = value.trim();
      }
    });
  };

  parseEnvFile(path.resolve(process.cwd(), '.env'));
  parseEnvFile(path.resolve(process.cwd(), '.env.local'));

  return env;
};

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'] || env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment or .env/.env.local files.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Generic pagination fetch helper
async function fetchAll<T>(table: string, columns: string = '*'): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + 999);
    if (error) {
      console.error(`Error fetching table ${table}:`, error.message);
      throw error;
    }
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
}

interface Profile {
  id: string;
  name: string;
}

interface Match {
  id: number;
  phase: string;
  group_name: string;
  team_a: string;
  team_b: string;
  match_date: string;
  deadline: string;
  actual_score_a: number | null;
  actual_score_b: number | null;
  actual_tiebreaker_winner: 'A' | 'B' | null;
  actual_advance_method: string | null;
}

interface Prediction {
  player_id: string;
  match_id: number;
  predicted_score_a: number;
  predicted_score_b: number;
  advance_team: string | null;
  advance_method: string | null;
  predicted_tiebreaker_winner: 'A' | 'B' | null;
}

interface GroupPrediction {
  player_id: string;
  group_name: string;
  position_1: string;
  position_2: string;
  position_3: string;
  position_4: string;
}

interface SpecialPrediction {
  player_id: string;
  champion: string;
  vice_champion?: string;
  third_place?: string;
  top_scorer: string;
  best_player: string;
}

interface PlayerScore {
  player_id: string;
  match_points: number;
  group_points: number;
  special_points: number;
  total_points: number;
}

async function runAudit() {
  console.log('Fetching database records...');
  try {
    const [
      profiles,
      matches,
      predictions,
      groupPredictions,
      specialPredictions,
      playerScores
    ] = await Promise.all([
      fetchAll<Profile>('profiles', 'id, name'),
      fetchAll<Match>('matches'),
      fetchAll<Prediction>('predictions'),
      fetchAll<GroupPrediction>('group_predictions'),
      fetchAll<SpecialPrediction>('special_predictions'),
      fetchAll<PlayerScore>('player_scores')
    ]);

    const profileMap = new Map<string, string>();
    profiles.forEach(p => {
      profileMap.set(p.id, p.name);
    });

    const scoreMap = new Map<string, PlayerScore>();
    playerScores.forEach(s => {
      scoreMap.set(s.player_id, s);
    });

    // 1. Match prediction auditing helpers
    const completedMatches = matches.filter(m => m.actual_score_a !== null && m.actual_score_b !== null);
    const matchMap = new Map<number, Match>();
    completedMatches.forEach(m => {
      matchMap.set(m.id, m);
    });

    // Group predictions by player_id
    const predictionsByPlayer = new Map<string, Prediction[]>();
    predictions.forEach(p => {
      if (!predictionsByPlayer.has(p.player_id)) {
        predictionsByPlayer.set(p.player_id, []);
      }
      predictionsByPlayer.get(p.player_id)!.push(p);
    });

    // 2. Group standing auditing helpers
    const officialGroupPreds = groupPredictions.filter(gp => gp.player_id === '00000000-0000-0000-0000-000000000000');
    const officialGroups = new Map<string, GroupPrediction>();
    const officialStandingsRecord: Record<string, { position_1: string, position_2: string, position_3: string, position_4: string }> = {};

    officialGroupPreds.forEach(g => {
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

    // Confirmed 3rd-place qualifiers
    const confirmedThirdPlaceQualifiers = new Set<string>(
      Object.values(officialStandingsRecord)
        .map(g => g.position_3)
        .filter((t): t is string => t !== '' && t != null)
    );

    // Group player group predictions by player_id -> group_name
    const groupPredsMap = new Map<string, Map<string, GroupPrediction>>();
    groupPredictions.forEach(gp => {
      if (gp.player_id === '00000000-0000-0000-0000-000000000000') return;
      if (!groupPredsMap.has(gp.player_id)) {
        groupPredsMap.set(gp.player_id, new Map());
      }
      groupPredsMap.get(gp.player_id)!.set(gp.group_name, gp);
    });

    // 3. Special predictions auditing helpers
    const officialSpecials = specialPredictions.find(s => s.player_id === '00000000-0000-0000-0000-000000000000');
    
    // Audit execution
    let checkedCount = 0;
    let cleanCount = 0;
    let mismatchCount = 0;
    
    const mismatches: Array<{ name: string; category: string; stored: number; computed: number; delta: number }> = [];

    // Get list of active player IDs
    const activePlayerIds = new Set<string>();
    predictions.forEach(p => activePlayerIds.add(p.player_id));
    groupPredictions.forEach(gp => activePlayerIds.add(gp.player_id));
    specialPredictions.forEach(sp => activePlayerIds.add(sp.player_id));
    activePlayerIds.delete('00000000-0000-0000-0000-000000000000');

    activePlayerIds.forEach(pId => {
      checkedCount++;

      // A. Compute Match Prediction Points
      let computedMatchPoints = 0;
      const playerPreds = predictionsByPlayer.get(pId) || [];
      playerPreds.forEach(pred => {
        const match = matchMap.get(pred.match_id);
        if (match) {
          computedMatchPoints += calculatePoints(match as any, pred as any);
        }
      });

      // B. Compute Group Standing Points
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
            const predQualify = true;
            const didQualify = actPos === '1' || actPos === '2';
            return calculateGroupPositionPoints(predPos, actPos, predQualify, didQualify);
          };

          const p1Points = getPointsForPick(firstPick, '1');
          const p2Points = getPointsForPick(secondPick, '2');
          groupPoints += p1Points + p2Points;
        }
      });

      // Calculate third-place qualifier points
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

      // Cross-slot credit
      let crossSlotPoints = 0;
      if (playerGroupPreds) {
        playerGroupPreds.forEach((gp, groupName) => {
          const official = officialStandingsRecord[groupName];
          if (!official) return;

          const p1 = gp.position_1;
          const p2 = gp.position_2;

          if (p1 && confirmedThirdPlaceQualifiers.has(p1) && !playerThirdPlacesSet.has(p1)) {
            crossSlotPoints += 10;
          }
          if (p2 && confirmedThirdPlaceQualifiers.has(p2) && !playerThirdPlacesSet.has(p2)) {
            crossSlotPoints += 10;
          }
        });
      }

      const computedGroupPoints = groupPoints + thirdPlacePoints + crossSlotPoints;

      // C. Compute Special Predictions Points
      let computedSpecialPoints = 0;
      const playerSpecials = specialPredictions.find(s => s.player_id === pId);

      if (officialSpecials) {
        const isResolved = (val: string | undefined | null) => val !== null && val !== undefined && val.trim() !== '';

        const actual = {
          champion: isResolved(officialSpecials.champion) ? officialSpecials.champion : '__unresolved__',
          vice_champion: isResolved(officialSpecials.vice_champion) ? officialSpecials.vice_champion : '__unresolved__',
          third_place: isResolved(officialSpecials.third_place) ? officialSpecials.third_place : '__unresolved__',
          top_scorer: isResolved(officialSpecials.top_scorer) ? officialSpecials.top_scorer : '__unresolved__',
          best_player: isResolved(officialSpecials.best_player) ? officialSpecials.best_player : '__unresolved__',
        };

        if (playerSpecials) {
          const pred = {
            champion: playerSpecials.champion || '',
            vice_champion: playerSpecials.vice_champion || '',
            third_place: playerSpecials.third_place || '',
            top_scorer: playerSpecials.top_scorer || '',
            best_player: playerSpecials.best_player || '',
          };
          computedSpecialPoints = calculateSpecialPoints(pred, actual);
        }
      }

      // D. Compare against stored sub-totals
      const playerStore = scoreMap.get(pId) || { match_points: 0, group_points: 0, special_points: 0, total_points: 0 };
      
      const storedMatch = playerStore.match_points || 0;
      const storedGroup = playerStore.group_points || 0;
      const storedSpecial = playerStore.special_points || 0;

      const matchDiff = computedMatchPoints - storedMatch;
      const groupDiff = computedGroupPoints - storedGroup;
      const specialDiff = computedSpecialPoints - storedSpecial;

      if (matchDiff !== 0 || groupDiff !== 0 || specialDiff !== 0) {
        mismatchCount++;
        const playerName = profileMap.get(pId) || `Player (${pId.substring(0, 8)})`;
        
        if (matchDiff !== 0) {
          mismatches.push({
            name: playerName,
            category: 'match_points',
            stored: storedMatch,
            computed: computedMatchPoints,
            delta: matchDiff
          });
        }
        if (groupDiff !== 0) {
          mismatches.push({
            name: playerName,
            category: 'group_points',
            stored: storedGroup,
            computed: computedGroupPoints,
            delta: groupDiff
          });
        }
        if (specialDiff !== 0) {
          mismatches.push({
            name: playerName,
            category: 'special_points',
            stored: storedSpecial,
            computed: computedSpecialPoints,
            delta: specialDiff
          });
        }
      } else {
        cleanCount++;
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('AUDIT SUMMARY — audit_individual_scores');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Players checked:     ${checkedCount}`);
    console.log(`✅ Clean:            ${cleanCount}`);
    console.log(`❌ Mismatches:        ${mismatchCount}`);
    
    mismatches.forEach(m => {
      const deltaStr = m.delta > 0 ? `+${m.delta}` : `${m.delta}`;
      console.log(`  → ${m.name.padEnd(20)} ${m.category.padEnd(15)} stored=${m.stored.toString().padEnd(4)} computed=${m.computed.toString().padEnd(4)} delta=${deltaStr}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (mismatchCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Audit failed with error:', error);
    process.exit(1);
  }
}

runAudit();
