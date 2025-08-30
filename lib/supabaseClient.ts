import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined

function assertEnv(required: Array<[string, string | undefined]>) {
  const missing = required.filter(([, v]) => !v).map(([k]) => k)
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}. Configurez .env.local (voir .env.example).`
    )
  }
}

declare global {
  // Persist across HMR reloads in dev
  // eslint-disable-next-line no-var
  var __supabase_browser: SupabaseClient | undefined
  // eslint-disable-next-line no-var
  var __supabase_admin: SupabaseClient | undefined
}

export const supabaseBrowser = <T = any>(): SupabaseClient<T> => {
  assertEnv([
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey],
  ])
  if (!globalThis.__supabase_browser) {
    globalThis.__supabase_browser = createClient<T>(
      supabaseUrl as string,
      supabaseAnonKey as string
    ) as unknown as SupabaseClient
  }
  return globalThis.__supabase_browser as SupabaseClient<T>
}

export const supabaseAdmin = <T = any>(): SupabaseClient<T> => {
  assertEnv([
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ])
  if (!globalThis.__supabase_admin) {
    globalThis.__supabase_admin = createClient<T>(
      supabaseUrl as string,
      serviceRoleKey as string,
      { auth: { persistSession: false } }
    ) as unknown as SupabaseClient
  }
  return globalThis.__supabase_admin as SupabaseClient<T>
}


