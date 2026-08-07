/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

// Contact details deliberately do NOT live here — they are stored in the
// `settings` table so organisers can change them from the admin portal
// without a rebuild and redeploy. See Admin → Settings → Contact details.

interface ImportMeta {
  readonly env: ImportMetaEnv
}
