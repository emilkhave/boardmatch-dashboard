import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Public client config — the anon key is designed to be exposed in the browser
// (security comes from Supabase Auth + row-level security, not from hiding it).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anon)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null
