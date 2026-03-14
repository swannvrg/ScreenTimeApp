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
    .from('api_keys').select('user_id').eq('key', apiKey).single()
  if (error || !data) return null
  return data.user_id
}

const DEFAULT_CONFIG = {
  budget: 45,
  solde_depart: 10,
  timezone: 'Asia/Singapore',
  tasks: [],
  blocked_apps: [],
  setup_complete: false,
}

// ── GET ──
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const { data, error } = await supabase
      .from('config').select('*').eq('user_id', userId).single()

    if (error || !data) return NextResponse.json({ ...DEFAULT_CONFIG, user_id: userId })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST ──
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const { budget, solde_depart, timezone, tasks, blocked_apps, device_type, setup_complete } = body

    const update: Record<string, unknown> = { user_id: userId }
    if (budget !== undefined)         update.budget         = parseInt(budget)
    if (solde_depart !== undefined)   update.solde_depart   = parseInt(solde_depart)
    if (timezone !== undefined)       update.timezone       = timezone
    if (tasks !== undefined)          update.tasks          = tasks
    if (blocked_apps !== undefined)   update.blocked_apps   = blocked_apps
    if (device_type !== undefined)    update.device_type    = device_type
    if (setup_complete !== undefined) update.setup_complete = setup_complete

    const { error } = await supabase
      .from('config').upsert(update, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ status: 'ok', message: 'Config mise à jour' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}