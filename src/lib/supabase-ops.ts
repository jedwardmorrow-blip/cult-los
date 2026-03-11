import { createClient } from '@supabase/supabase-js'

// Second Supabase client for CULT-OPS CRM data (read-only)
const opsUrl = import.meta.env.VITE_CULTOPS_SUPABASE_URL
const opsAnonKey = import.meta.env.VITE_CULTOPS_SUPABASE_ANON_KEY

// Graceful fallback — page will show empty CRM section if not configured
export const supabaseOps = (opsUrl && opsAnonKey)
  ? createClient(opsUrl, opsAnonKey)
  : null
