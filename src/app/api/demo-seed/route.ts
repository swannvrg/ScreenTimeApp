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

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function dateToStr(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const { data: user, error: userErr } = await supabase.auth.admin.getUserById(userId)
    if (userErr || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userEmail = user.user_metadata?.email || user.email || ''
    if (userEmail.toLowerCase() !== 'demo@demo.fr') {
      return NextResponse.json({ error: 'Not a demo account' }, { status: 403 })
    }

    const { data: config, error: configErr } = await supabase
      .from('config')
      .select('solde_depart, timezone')
      .eq('user_id', userId)
      .single()

    const soldeDepart = config?.solde_depart ?? 10
    const timezone = config?.timezone ?? 'Asia/Singapore'

    const TASKS = [
      { name: 'Exos_pompes', label: '💪 Exos pompes', time: 5 },
      { name: 'Boire_1L5_deau', label: '💧 Boire 1L5 eau', time: 3 },
      { name: 'Faire_lit', label: '🛏️ Faire lit', time: 2 },
      { name: 'Lire_10_pages_livre', label: '📚 Lire 10 pages', time: 10 },
      { name: 'Finir_podcast', label: '🎧 Finir podcast', time: 5 },
    ]

    const logsToInsert = []
    let solde = soldeDepart

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const d = new Date()
      d.setDate(d.getDate() - dayOffset)
      const dateStr = dateToStr(d)

      const { data: existingLogs } = await supabase
        .from('logs')
        .select('id')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .limit(1)

      if (existingLogs && existingLogs.length > 0) {
        const { data: lastLog } = await supabase
          .from('logs')
          .select('solde')
          .eq('user_id', userId)
          .eq('date', dateStr)
          .order('created_at', { ascending: false })
          .limit(1)
        if (lastLog && lastLog.length > 0) {
          solde = lastLog[0].solde
        }
        continue
      }

      const numTasks = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < numTasks; i++) {
        const task = TASKS[Math.floor(Math.random() * TASKS.length)]
        const hh = 8 + i * 3 + Math.floor(Math.random() * 2)
        const mm = Math.floor(Math.random() * 60)
        const ss = Math.floor(Math.random() * 60)
        const heureStr = `${pad(hh)}:${pad(mm)}:${pad(ss)}`

        solde = solde + task.time
        logsToInsert.push({
          user_id: userId,
          date: dateStr,
          heure: heureStr,
          nom_task: task.name,
          time: task.time,
          solde,
        })
      }

      const screenTime = 15 + Math.floor(Math.random() * 30)
      const screenHour = 20 + Math.floor(Math.random() * 3)
      const screenMin = Math.floor(Math.random() * 60)
      const screenSec = Math.floor(Math.random() * 60)
      const screenHeureStr = `${pad(screenHour)}:${pad(screenMin)}:${pad(screenSec)}`

      solde = solde - screenTime
      logsToInsert.push({
        user_id: userId,
        date: dateStr,
        heure: screenHeureStr,
        nom_task: 'Consommation temps',
        time: screenTime,
        solde,
      })
    }

    if (logsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('logs')
        .insert(logsToInsert)

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: `Demo seeded with ${logsToInsert.length} logs`,
      logsCreated: logsToInsert.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
