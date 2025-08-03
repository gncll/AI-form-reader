import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehcazveenuygfvkehzwj.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY2F6dmVlbnV5Z2Z2a2VoendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzAwMDcsImV4cCI6MjA2OTgwNjAwN30.gl6UsgN6zYvvGUMCpg0NbM3tpG5rPmb3-C-4BcbWQXI'

export const supabase = createClient(supabaseUrl, supabaseKey)