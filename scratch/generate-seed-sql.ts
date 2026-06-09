import { GROUP_STAGE_MATCHES } from '../src/data/matches2026';
import * as fs from 'fs';
import * as path from 'path';

console.log('Generating database update SQL...');

let sql = `-- SQL Script to update Supabase matches table with the correct 2026 World Cup Group Stage fixtures
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)

`;

GROUP_STAGE_MATCHES.forEach((match, index) => {
  const matchId = index + 1; // Assuming sequential IDs 1-72 for group stage
  // Escape single quotes for SQL
  const teamA = match.homeTeam.replace(/'/g, "''");
  const teamB = match.awayTeam.replace(/'/g, "''");
  
  sql += `UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = '${match.group}', 
  team_a = '${teamA}', 
  team_b = '${teamB}', 
  match_date = '${match.matchDate}', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = ${matchId};
`;
});

// Append predictions migration queries to prevent breaking user predictions
sql += `
-- ==========================================
-- PREDICTIONS MIGRATION FOR RENAMED TEAMS
-- ==========================================

-- Automatically migrate existing group predictions to the new team names
UPDATE public.group_predictions SET position_1 = 'South Korea' WHERE position_1 = 'Korea Republic';
UPDATE public.group_predictions SET position_2 = 'South Korea' WHERE position_2 = 'Korea Republic';
UPDATE public.group_predictions SET position_3 = 'South Korea' WHERE position_3 = 'Korea Republic';
UPDATE public.group_predictions SET position_4 = 'South Korea' WHERE position_4 = 'Korea Republic';

UPDATE public.group_predictions SET position_1 = 'Bosnia & Herzegovina' WHERE position_1 = 'Bosnia and Herzegovina';
UPDATE public.group_predictions SET position_2 = 'Bosnia & Herzegovina' WHERE position_2 = 'Bosnia and Herzegovina';
UPDATE public.group_predictions SET position_3 = 'Bosnia & Herzegovina' WHERE position_3 = 'Bosnia and Herzegovina';
UPDATE public.group_predictions SET position_4 = 'Bosnia & Herzegovina' WHERE position_4 = 'Bosnia and Herzegovina';

UPDATE public.group_predictions SET position_1 = 'USA' WHERE position_1 = 'United States';
UPDATE public.group_predictions SET position_2 = 'USA' WHERE position_2 = 'United States';
UPDATE public.group_predictions SET position_3 = 'USA' WHERE position_3 = 'United States';
UPDATE public.group_predictions SET position_4 = 'USA' WHERE position_4 = 'United States';

UPDATE public.group_predictions SET position_1 = 'Ivory Coast' WHERE position_1 = 'Côte d''Ivoire';
UPDATE public.group_predictions SET position_2 = 'Ivory Coast' WHERE position_2 = 'Côte d''Ivoire';
UPDATE public.group_predictions SET position_3 = 'Ivory Coast' WHERE position_3 = 'Côte d''Ivoire';
UPDATE public.group_predictions SET position_4 = 'Ivory Coast' WHERE position_4 = 'Côte d''Ivoire';

-- Automatically migrate existing special predictions
UPDATE public.special_predictions SET champion = 'South Korea' WHERE champion = 'Korea Republic';
UPDATE public.special_predictions SET vice_champion = 'South Korea' WHERE vice_champion = 'Korea Republic';
UPDATE public.special_predictions SET third_place = 'South Korea' WHERE third_place = 'Korea Republic';

UPDATE public.special_predictions SET champion = 'Bosnia & Herzegovina' WHERE champion = 'Bosnia and Herzegovina';
UPDATE public.special_predictions SET vice_champion = 'Bosnia & Herzegovina' WHERE vice_champion = 'Bosnia and Herzegovina';
UPDATE public.special_predictions SET third_place = 'Bosnia & Herzegovina' WHERE third_place = 'Bosnia and Herzegovina';

UPDATE public.special_predictions SET champion = 'USA' WHERE champion = 'United States';
UPDATE public.special_predictions SET vice_champion = 'USA' WHERE vice_champion = 'United States';
UPDATE public.special_predictions SET third_place = 'USA' WHERE third_place = 'United States';

UPDATE public.special_predictions SET champion = 'Ivory Coast' WHERE champion = 'Côte d''Ivoire';
UPDATE public.special_predictions SET vice_champion = 'Ivory Coast' WHERE vice_champion = 'Côte d''Ivoire';
UPDATE public.special_predictions SET third_place = 'Ivory Coast' WHERE third_place = 'Côte d''Ivoire';
`;

const outputPath = path.resolve(process.cwd(), 'scratch/update_matches.sql');
fs.writeFileSync(outputPath, sql);

console.log(`✅ SQL file generated successfully at: ${outputPath}`);
