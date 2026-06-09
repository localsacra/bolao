-- SQL Script to update Supabase matches table with the correct 2026 World Cup Group Stage fixtures
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)

UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'A', 
  team_a = 'Mexico', 
  team_b = 'South Africa', 
  match_date = '2026-06-11T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 1;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'A', 
  team_a = 'South Korea', 
  team_b = 'Czechia', 
  match_date = '2026-06-11T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 2;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'A', 
  team_a = 'Czechia', 
  team_b = 'South Africa', 
  match_date = '2026-06-18T13:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 3;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'A', 
  team_a = 'Mexico', 
  team_b = 'South Korea', 
  match_date = '2026-06-18T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 4;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'A', 
  team_a = 'Czechia', 
  team_b = 'Mexico', 
  match_date = '2026-06-24T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 5;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'A', 
  team_a = 'South Africa', 
  team_b = 'South Korea', 
  match_date = '2026-06-24T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 6;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'B', 
  team_a = 'Canada', 
  team_b = 'Bosnia & Herzegovina', 
  match_date = '2026-06-12T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 7;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'B', 
  team_a = 'Qatar', 
  team_b = 'Switzerland', 
  match_date = '2026-06-13T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 8;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'B', 
  team_a = 'Switzerland', 
  team_b = 'Bosnia & Herzegovina', 
  match_date = '2026-06-18T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 9;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'B', 
  team_a = 'Canada', 
  team_b = 'Qatar', 
  match_date = '2026-06-18T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 10;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'B', 
  team_a = 'Switzerland', 
  team_b = 'Canada', 
  match_date = '2026-06-24T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 11;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'B', 
  team_a = 'Bosnia & Herzegovina', 
  team_b = 'Qatar', 
  match_date = '2026-06-24T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 12;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'C', 
  team_a = 'Brazil', 
  team_b = 'Morocco', 
  match_date = '2026-06-13T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 13;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'C', 
  team_a = 'Haiti', 
  team_b = 'Scotland', 
  match_date = '2026-06-13T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 14;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'C', 
  team_a = 'Scotland', 
  team_b = 'Morocco', 
  match_date = '2026-06-19T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 15;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'C', 
  team_a = 'Brazil', 
  team_b = 'Haiti', 
  match_date = '2026-06-19T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 16;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'C', 
  team_a = 'Scotland', 
  team_b = 'Brazil', 
  match_date = '2026-06-24T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 17;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'C', 
  team_a = 'Morocco', 
  team_b = 'Haiti', 
  match_date = '2026-06-24T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 18;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'D', 
  team_a = 'USA', 
  team_b = 'Paraguay', 
  match_date = '2026-06-12T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 19;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'D', 
  team_a = 'Australia', 
  team_b = 'Türkiye', 
  match_date = '2026-06-13T01:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 20;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'D', 
  team_a = 'USA', 
  team_b = 'Australia', 
  match_date = '2026-06-19T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 21;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'D', 
  team_a = 'Türkiye', 
  team_b = 'Paraguay', 
  match_date = '2026-06-20T01:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 22;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'D', 
  team_a = 'Türkiye', 
  team_b = 'USA', 
  match_date = '2026-06-25T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 23;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'D', 
  team_a = 'Paraguay', 
  team_b = 'Australia', 
  match_date = '2026-06-25T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 24;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'E', 
  team_a = 'Germany', 
  team_b = 'Curaçao', 
  match_date = '2026-06-14T14:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 25;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'E', 
  team_a = 'Ivory Coast', 
  team_b = 'Ecuador', 
  match_date = '2026-06-14T20:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 26;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'E', 
  team_a = 'Germany', 
  team_b = 'Ivory Coast', 
  match_date = '2026-06-20T17:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 27;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'E', 
  team_a = 'Ecuador', 
  team_b = 'Curaçao', 
  match_date = '2026-06-20T21:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 28;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'E', 
  team_a = 'Ecuador', 
  team_b = 'Germany', 
  match_date = '2026-06-25T17:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 29;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'E', 
  team_a = 'Curaçao', 
  team_b = 'Ivory Coast', 
  match_date = '2026-06-25T17:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 30;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'F', 
  team_a = 'Netherlands', 
  team_b = 'Japan', 
  match_date = '2026-06-14T17:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 31;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'F', 
  team_a = 'Sweden', 
  team_b = 'Tunisia', 
  match_date = '2026-06-14T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 32;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'F', 
  team_a = 'Netherlands', 
  team_b = 'Sweden', 
  match_date = '2026-06-20T14:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 33;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'F', 
  team_a = 'Tunisia', 
  team_b = 'Japan', 
  match_date = '2026-06-20T01:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 34;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'F', 
  team_a = 'Tunisia', 
  team_b = 'Netherlands', 
  match_date = '2026-06-25T20:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 35;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'F', 
  team_a = 'Japan', 
  team_b = 'Sweden', 
  match_date = '2026-06-25T20:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 36;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'G', 
  team_a = 'Belgium', 
  team_b = 'Egypt', 
  match_date = '2026-06-15T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 37;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'G', 
  team_a = 'Iran', 
  team_b = 'New Zealand', 
  match_date = '2026-06-15T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 38;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'G', 
  team_a = 'Belgium', 
  team_b = 'Iran', 
  match_date = '2026-06-21T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 39;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'G', 
  team_a = 'New Zealand', 
  team_b = 'Egypt', 
  match_date = '2026-06-21T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 40;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'G', 
  team_a = 'New Zealand', 
  team_b = 'Belgium', 
  match_date = '2026-06-26T21:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 41;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'G', 
  team_a = 'Egypt', 
  team_b = 'Iran', 
  match_date = '2026-06-26T21:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 42;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'H', 
  team_a = 'Spain', 
  team_b = 'Cape Verde', 
  match_date = '2026-06-15T13:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 43;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'H', 
  team_a = 'Saudi Arabia', 
  team_b = 'Uruguay', 
  match_date = '2026-06-15T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 44;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'H', 
  team_a = 'Spain', 
  team_b = 'Saudi Arabia', 
  match_date = '2026-06-21T13:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 45;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'H', 
  team_a = 'Uruguay', 
  team_b = 'Cape Verde', 
  match_date = '2026-06-21T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 46;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'H', 
  team_a = 'Uruguay', 
  team_b = 'Spain', 
  match_date = '2026-06-26T21:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 47;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'H', 
  team_a = 'Cape Verde', 
  team_b = 'Saudi Arabia', 
  match_date = '2026-06-26T21:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 48;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'I', 
  team_a = 'France', 
  team_b = 'Senegal', 
  match_date = '2026-06-16T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 49;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'I', 
  team_a = 'Iraq', 
  team_b = 'Norway', 
  match_date = '2026-06-16T19:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 50;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'I', 
  team_a = 'France', 
  team_b = 'Iraq', 
  match_date = '2026-06-22T18:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 51;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'I', 
  team_a = 'Norway', 
  team_b = 'Senegal', 
  match_date = '2026-06-22T21:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 52;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'I', 
  team_a = 'Norway', 
  team_b = 'France', 
  match_date = '2026-06-26T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 53;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'I', 
  team_a = 'Senegal', 
  team_b = 'Iraq', 
  match_date = '2026-06-26T16:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 54;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'J', 
  team_a = 'Argentina', 
  team_b = 'Algeria', 
  match_date = '2026-06-16T22:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 55;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'J', 
  team_a = 'Austria', 
  team_b = 'Jordan', 
  match_date = '2026-06-17T01:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 56;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'J', 
  team_a = 'Argentina', 
  team_b = 'Austria', 
  match_date = '2026-06-22T14:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 57;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'J', 
  team_a = 'Jordan', 
  team_b = 'Algeria', 
  match_date = '2026-06-23T00:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 58;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'J', 
  team_a = 'Jordan', 
  team_b = 'Argentina', 
  match_date = '2026-06-27T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 59;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'J', 
  team_a = 'Algeria', 
  team_b = 'Austria', 
  match_date = '2026-06-27T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 60;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'K', 
  team_a = 'Portugal', 
  team_b = 'DR Congo', 
  match_date = '2026-06-17T14:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 61;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'K', 
  team_a = 'Uzbekistan', 
  team_b = 'Colombia', 
  match_date = '2026-06-17T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 62;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'K', 
  team_a = 'Portugal', 
  team_b = 'Uzbekistan', 
  match_date = '2026-06-23T14:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 63;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'K', 
  team_a = 'Colombia', 
  team_b = 'DR Congo', 
  match_date = '2026-06-23T23:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 64;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'K', 
  team_a = 'Colombia', 
  team_b = 'Portugal', 
  match_date = '2026-06-27T20:30:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 65;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'K', 
  team_a = 'DR Congo', 
  team_b = 'Uzbekistan', 
  match_date = '2026-06-27T20:30:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 66;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'L', 
  team_a = 'England', 
  team_b = 'Croatia', 
  match_date = '2026-06-17T17:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 67;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'L', 
  team_a = 'Ghana', 
  team_b = 'Panama', 
  match_date = '2026-06-17T20:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 68;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'L', 
  team_a = 'England', 
  team_b = 'Ghana', 
  match_date = '2026-06-23T17:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 69;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'L', 
  team_a = 'Panama', 
  team_b = 'Croatia', 
  match_date = '2026-06-23T20:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 70;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'L', 
  team_a = 'Panama', 
  team_b = 'England', 
  match_date = '2026-06-27T18:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 71;
UPDATE public.matches 
SET 
  phase = 'group', 
  group_name = 'L', 
  team_a = 'Croatia', 
  team_b = 'Ghana', 
  match_date = '2026-06-27T18:00:00-03:00', 
  deadline = '2026-06-11T14:00:00-03:00' 
WHERE id = 72;

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
