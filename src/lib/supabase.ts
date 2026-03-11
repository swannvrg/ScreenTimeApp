import { createClient } from '@supabase/supabase-js'

export type Log = {
  id:         string
  user_id:    string
  date:       string
  heure:      string
  nom_task:   string
  time:       number
  solde:      number
  created_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)