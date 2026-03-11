import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client admin — utilise la service role key côté serveur uniquement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // 1. Récupère la clé API depuis le header
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    }

    // 2. Vérifie la clé et récupère le user_id
    const { data: keyRow, error: keyErr } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (keyErr || !keyRow) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // 3. Parse le body JSON
    const body = await req.json()
    const { date, heure, nom_task, time, solde } = body

    if (!date || !heure || !nom_task || time === undefined) {
      return NextResponse.json({ error: 'Missing fields: date, heure, nom_task, time' }, { status: 400 })
    }

    // 4. Insère le log avec le user_id de la clé
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

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ status: 'ok', message: 'Log ajouté' })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}