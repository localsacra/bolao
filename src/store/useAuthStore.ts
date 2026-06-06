import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  initialize: () => void;
  login: (email: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      set({ profile: data, isAdmin: data.is_admin, isLoading: false })
    } else {
      set({ profile: null, isAdmin: false, isLoading: false })
    }
  }

  return {
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,

    initialize: () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        set({ user: session?.user ?? null })
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          set({ isLoading: false, profile: null, isAdmin: false })
        }
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          set({ profile: null, isAdmin: false, isLoading: false })
        }
      })
    },

    login: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      })
      return { error }
    },

    logout: async () => {
      await supabase.auth.signOut()
    }
  }
})
