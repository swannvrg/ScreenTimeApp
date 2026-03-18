import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserId(req: NextRequest): Promise<string | null> {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return null
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', apiKey)
    .single()
  if (error || !data) return null
  return data.user_id
}

const DEFAULT_CONFIG = {
  budget: 45,
  solde_depart: 10,
  timezone: 'Asia/Singapore',
  tasks: [
    { id: '1', name: 'Exos_pompes',        label: 'Exos pompes',     time: 5,  emoji: '💪' },
    { id: '2', name: "Boire_1L5_d'eau",    label: "Boire 1L5 d'eau", time: 3,  emoji: '💧' },
    { id: '3', name: 'Faire_lit',           label: 'Faire lit',       time: 2,  emoji: '🛏️' },
    { id: '4', name: 'Lire_10_page_livre',  label: 'Lire 10 pages',   time: 10, emoji: '📚' },
    { id: '5', name: 'Finir_podcast',       label: 'Finir podcast',   time: 5,  emoji: '🎧' },
  ]
}

// ── GET — retourne la config du user ──
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ ...DEFAULT_CONFIG, user_id: userId })
    }

    return NextResponse.json(data)

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST — crée ou met à jour la config du user ──
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const { budget, solde_depart, timezone, tasks } = body

    if (budget === undefined && solde_depart === undefined && timezone === undefined && tasks === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const update: Record<string, unknown> = { user_id: userId }
    if (budget !== undefined)       update.budget       = parseInt(budget)
    if (solde_depart !== undefined) update.solde_depart = parseInt(solde_depart)
    if (timezone !== undefined)     update.timezone     = timezone
    if (tasks !== undefined)        update.tasks        = tasks

    const { error } = await supabase
      .from('config')
      .upsert(update, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ status: 'ok', message: 'Config mise à jour' })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}