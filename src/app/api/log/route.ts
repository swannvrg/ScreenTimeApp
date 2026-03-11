import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET — retourne le dernier solde du jour ──
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 })

    const { data: keyRow, error: keyErr } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (keyErr || !keyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    // Date du jour en ISO (Singapore UTC+8)
    const now = new Date()
    const sgOffset = 8 * 60
    const sgNow = new Date(now.getTime() + (sgOffset - now.getTimezoneOffset()) * 60000)
    const today = sgNow.toISOString().split('T')[0]

    // Dernier log du jour
    const { data: logs } = await supabase
      .from('logs')
      .select('solde')
      .eq('user_id', keyRow.user_id)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)

    const solde = logs && logs.length > 0 ? logs[0].solde : 10 // 10 = solde de départ

    return NextResponse.json({ status: 'ok', solde, date: today })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST — enregistre un log ──
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 })

    const { data: keyRow, error: keyErr } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (keyErr || !keyRow) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const { date, heure, nom_task, time, solde } = body

    if (!date || !heure || !nom_task || time === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error: insertErr } = await supabase
      .from('logs')
      .insert({
        user_id:  keyRow.user_id,
        date,
        heure,
        nom_task,
        time:  parseFloat(time)  || 0,
        solde: parseFloat(solde) || 0,
      })

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    return NextResponse.json({ status: 'ok', message: 'Log ajouté' })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}