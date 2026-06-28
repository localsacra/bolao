-- =========================================================================
-- SQL Migration: Score Editor Role, Row-Level Security, & Column Safeguards
-- =========================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor)

-- 1. Add 'is_score_editor' column to public.profiles table (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_score_editor BOOLEAN NOT NULL DEFAULT false;

-- 2. Update RLS policies on matches table
-- Drop existing policies that might conflict or be updated
DROP POLICY IF EXISTS "Admins can update matches" ON public.matches;
DROP POLICY IF EXISTS "Admins and score editors can update matches" ON public.matches;

-- Create policy to allow UPDATE access ONLY. 
-- Note: This does NOT grant INSERT or DELETE privileges to is_score_editor users. 
-- Only administrators (via service_role or separate policies) can insert/delete matches.
CREATE POLICY "Admins and score editors can update matches" ON public.matches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_score_editor = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_score_editor = true)
    )
  );

-- 3. Create BEFORE UPDATE trigger on matches to restrict fields for score editors
-- This function ensures that if the user is a score editor (and not an admin),
-- they can ONLY update the score-related fields and nothing else.
CREATE OR REPLACE FUNCTION check_match_update_permissions()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_is_score_editor BOOLEAN;
BEGIN
  -- Get current user's privileges from profiles
  SELECT is_admin, is_score_editor INTO v_is_admin, v_is_score_editor
  FROM public.profiles
  WHERE id = auth.uid();

  -- If user is an admin, allow updating all columns
  IF v_is_admin = true THEN
    RETURN NEW;
  END IF;

  -- If user is a score editor, enforce a strict whitelist of editable columns:
  -- Allowed: actual_score_a, actual_score_b, actual_tiebreaker_winner, actual_advance_method
  -- Rejected: Any other column change.
  IF v_is_score_editor = true THEN
    IF (OLD.id IS DISTINCT FROM NEW.id) OR
       (OLD.phase IS DISTINCT FROM NEW.phase) OR
       (OLD.group_name IS DISTINCT FROM NEW.group_name) OR
       (OLD.team_a IS DISTINCT FROM NEW.team_a) OR
       (OLD.team_b IS DISTINCT FROM NEW.team_b) OR
       (OLD.match_date IS DISTINCT FROM NEW.match_date) OR
       (OLD.deadline IS DISTINCT FROM NEW.deadline) THEN
      RAISE EXCEPTION 'Score editors are only allowed to update score-related fields (actual_score_a, actual_score_b, actual_tiebreaker_winner, actual_advance_method).';
    END IF;
    RETURN NEW;
  END IF;

  -- If neither role matches, reject the update
  RAISE EXCEPTION 'Unauthorized: You do not have permissions to update matches.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the check trigger to matches table
DROP TRIGGER IF EXISTS trg_check_match_update_permissions ON public.matches;
CREATE TRIGGER trg_check_match_update_permissions
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION check_match_update_permissions();

-- 4. Update RLS policies on player_scores table
-- Drop existing policies that might restrict updates to admins only
DROP POLICY IF EXISTS "Admins can manage player scores" ON public.player_scores;
DROP POLICY IF EXISTS "Admins and score editors can manage player scores" ON public.player_scores;

-- Create policy to allow admins and score editors to perform all operations on player_scores
-- (needed because recalculateScores runs on the client and performs inserts/updates to player_scores)
CREATE POLICY "Admins and score editors can manage player scores" ON public.player_scores
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_score_editor = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_score_editor = true)
    )
  );
