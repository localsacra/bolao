import { createClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export const KNOWN_PHASES = [
  'group',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final',
] as const;

export type MatchPhase = typeof KNOWN_PHASES[number];

export function isKnownPhase(phase: string): phase is MatchPhase {
  return (KNOWN_PHASES as readonly string[]).includes(phase);
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          is_admin: boolean
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          is_admin?: boolean
          is_hidden?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          is_admin?: boolean
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: any[]
      }
      matches: {
        Row: {
          id: number
          phase: MatchPhase
          group_name: string
          team_a: string
          team_b: string
          match_date: string
          deadline: string
          actual_score_a: number | null
          actual_score_b: number | null
          actual_tiebreaker_winner: 'A' | 'B' | null
        }
        Insert: {
          id?: number
          phase: string
          group_name: string
          team_a: string
          team_b: string
          match_date: string
          deadline: string
          actual_score_a?: number | null
          actual_score_b?: number | null
          actual_tiebreaker_winner?: 'A' | 'B' | null
        }
        Update: {
          id?: number
          phase?: string
          group_name?: string
          team_a?: string
          team_b?: string
          match_date?: string
          deadline?: string
          actual_score_a?: number | null
          actual_score_b?: number | null
          actual_tiebreaker_winner?: 'A' | 'B' | null
        }
        Relationships: any[]
      }
      predictions: {
        Row: {
          id: number
          player_id: string
          match_id: number
          predicted_score_a: number
          predicted_score_b: number
          advance_team: string | null
          advance_method: string | null
          predicted_tiebreaker_winner: 'A' | 'B' | null
          created_at: string
        }
        Insert: {
          id?: number
          player_id: string
          match_id: number
          predicted_score_a: number
          predicted_score_b: number
          advance_team?: string | null
          advance_method?: string | null
          predicted_tiebreaker_winner?: 'A' | 'B' | null
          created_at?: string
        }
        Update: {
          id?: number
          player_id?: string
          match_id?: number
          predicted_score_a?: number
          predicted_score_b?: number
          advance_team?: string | null
          advance_method?: string | null
          predicted_tiebreaker_winner?: 'A' | 'B' | null
          created_at?: string
        }
        Relationships: any[]
      }
      group_predictions: {
        Row: {
          id: number
          player_id: string
          group_name: string
          position_1: string
          position_2: string
          position_3: string
          position_4: string
        }
        Insert: {
          id?: number
          player_id: string
          group_name: string
          position_1: string
          position_2: string
          position_3: string
          position_4: string
        }
        Update: {
          id?: number
          player_id?: string
          group_name?: string
          position_1?: string
          position_2?: string
          position_3?: string
          position_4?: string
        }
        Relationships: any[]
      }
      special_predictions: {
        Row: {
          id: number
          player_id: string
          champion: string
          vice_champion: string
          third_place: string
          top_scorer: string
          best_player: string
        }
        Insert: {
          id?: number
          player_id: string
          champion: string
          vice_champion: string
          third_place: string
          top_scorer: string
          best_player: string
        }
        Update: {
          id?: number
          player_id?: string
          champion?: string
          vice_champion?: string
          third_place?: string
          top_scorer?: string
          best_player?: string
        }
        Relationships: any[]
      }
      player_scores: {
        Row: {
          id: number
          player_id: string
          total_points: number
          match_points: number
          group_points: number
          special_points: number
          updated_at: string
        }
        Insert: {
          id?: number
          player_id: string
          total_points: number
          match_points: number
          group_points: number
          special_points: number
          updated_at?: string
        }
        Update: {
          id?: number
          player_id?: string
          total_points?: number
          match_points?: number
          group_points?: number
          special_points?: number
          updated_at?: string
        }
        Relationships: any[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL) : undefined
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY) : undefined

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your configuration.')
}

export const supabase = createClient<Database>(supabaseUrl || 'https://placeholder-url-for-testing.supabase.co', supabaseAnonKey || 'placeholder-anon-key')
