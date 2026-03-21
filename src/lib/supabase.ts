import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient as SupabaseClientTyped } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and set local Supabase values.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/** Typed client — same as `ReturnType<typeof createClient<Database>>` would be if expressible in TypeScript. */
export type SupabaseClient = SupabaseClientTyped<Database>
