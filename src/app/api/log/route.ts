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

function getDateTimeInZone(timezone: string): { date: string; heure: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  const date  = `${pad(local.getDate())}/${pad(local.getMonth() + 1)}/${local.getFullYear()}`
  const heure = `${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`
  return { date, heure }
}

async function getUserConfig(userId: string) {
  const { data } = await supabase
    .from('config')
    .select('solde_depart, timezone')
    .eq('user_id', userId)
    .single()
  return {
    soldeDepart: data?.solde_depart ?? 10,
    timezone:    data?.timezone    ?? 'Asia/Singapore',
  }
}

// ── GET — retourne solde + date du jour ──
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const { soldeDepart, timezone } = await getUserConfig(userId)
    const { date } = getDateTimeInZone(timezone)

    const { data: logs } = await supabase
      .from('logs')
      .select('solde')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1)

    const solde = logs && logs.length > 0 ? logs[0].solde : soldeDepart

    return NextResponse.json({ status: 'ok', solde, date, timezone })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST — enregistre un log et calcule le nouveau solde ──
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const { nom_task, time } = body

    if (!nom_task || time === undefined) {
      return NextResponse.json({ error: 'Missing fields: nom_task, time' }, { status: 400 })
    }

    const timeVal  = parseFloat(time) || 0
    const isSpend  = nom_task.trim() === 'Consommation temps'

    const { soldeDepart, timezone } = await getUserConfig(userId)
    const { date, heure }           = getDateTimeInZone(timezone)

    // Dernier solde du jour
    const { data: lastLogs } = await supabase
      .from('logs')
      .select('solde')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1)

    const currentSolde = lastLogs && lastLogs.length > 0 ? lastLogs[0].solde : soldeDepart
    const newSolde     = isSpend ? currentSolde - timeVal : currentSolde + timeVal

    const { error: insertErr } = await supabase
      .from('logs')
      .insert({
        user_id:  userId,
        date,
        heure,
        nom_task: nom_task.trim(),
        time:     timeVal,
        solde:    newSolde,
      })

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    return NextResponse.json({
      status:  'ok',
      message: 'Log ajouté',
      solde:   newSolde,
      date,
      heure,
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}