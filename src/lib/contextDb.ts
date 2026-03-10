// E4: Dedicated Supabase client for the Context DB (separate project)
import { createClient } from '@supabase/supabase-js'

const CONTEXT_DB_URL = 'https://uayyhluztelnfxfvdhyt.supabase.co'
const CONTEXT_DB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheXlobHV6dGVsbmZ4ZnZkaHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzMzODUsImV4cCI6MjA4NzgwOTM4NX0.iM8ROgjk1bD3P9hET_7fUratfsv0slvIVx56L746Txw'

export const contextDb = createClient(CONTEXT_DB_URL, CONTEXT_DB_ANON_KEY)
