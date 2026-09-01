import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project URL + anon key.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Auth helpers ---
export async function signInWithEmail(email) {
  return supabase.auth.signInWithOtp({ email })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google' })
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

export async function signOut() {
  return supabase.auth.signOut()
}
