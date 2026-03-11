'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface LogRow {
  id:       string
  user_id:  string
  date:     string
  heure:    string
  nom_task: string
  time:     number
  solde:    number
}

export interface DayStats {
  label:   string
  dateStr: string
  earned:  number
  spent:   number
  isToday: boolean
}

export interface DashboardData {
  earned:     number
  spent:      number
  solde:      number
  tasksDone:  number
  streak:     number
  todayTasks: { name: string; count: number; total: number }[]
  weekDays:   DayStats[]
  recent:     LogRow[]
  raw:        LogRow[]
}

const BUDGET       = 45
const SOLDE_DEPART = 10
const DAYS         = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function pad(n: number) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isTask(r: LogRow)  { return r.nom_task && r.nom_task !== 'Consommation temps' && r.nom_task.trim() !== '' }
function isSpend(r: LogRow) { return r.nom_task === 'Consommation temps' }

function computeStreak(data: LogRow[]): number {
  let streak = 0
  const check = new Date()
  for (let i = 0; i < 60; i++) {
    const ds   = `${check.getFullYear()}-${pad(check.getMonth() + 1)}-${pad(check.getDate())}`
    const rows = data.filter(r => r.date === ds)
    if (rows.filter(isTask).length > 0) { streak++ }
    else if (i > 0) break
    check.setDate(check.getDate() - 1)
  }
  return streak
}

export function useScreenData(userId: string | null) {
  const [data, setData]             = useState<DashboardData | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data: rows, error: err } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        // ✅ Trier par date ET heure pour garantir l'ordre chronologique
        .order('date', { ascending: true })
        .order('heure', { ascending: true })

      if (err) throw new Error(err.message)

      const allRows   = rows as LogRow[]
      const today     = todayStr()
      const todayRows = allRows.filter(r => r.date === today)

      const earned    = todayRows.filter(isTask).reduce((s, r)  => s + r.time, 0)
      const spent     = todayRows.filter(isSpend).reduce((s, r) => s + r.time, 0)
      const tasksDone = todayRows.filter(isTask).length

      // ✅ Solde recalculé dynamiquement côté front : SOLDE_DEPART + gagné - dépensé
      const solde = SOLDE_DEPART + earned - spent

      const counts: Record<string, { count: number; total: number }> = {}
      todayRows.filter(isTask).forEach(r => {
        if (!counts[r.nom_task]) counts[r.nom_task] = { count: 0, total: 0 }
        counts[r.nom_task].count++
        counts[r.nom_task].total += r.time
      })
      const todayTasks = Object.entries(counts)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total)

      const weekDays: DayStats[] = []
      const todayDow       = new Date().getDay()
      const daysFromMonday = todayDow === 0 ? 6 : todayDow - 1
      for (let i = 6; i >= 0; i--) {
        const d  = new Date()
        d.setDate(d.getDate() - daysFromMonday + (6 - i))
        const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        const r  = allRows.filter(x => x.date === ds)
        weekDays.push({
          label:   DAYS[d.getDay()],
          dateStr: ds,
          earned:  r.filter(isTask).reduce((s, x)  => s + x.time, 0),
          spent:   r.filter(isSpend).reduce((s, x) => s + x.time, 0),
          isToday: ds === today,
        })
      }

      setData({
        earned, spent, solde,
        tasksDone,
        streak:    computeStreak(allRows),
        todayTasks,
        weekDays,
        recent:    [...allRows].reverse().slice(0, 40),
        raw:       allRows,
      })
      setLastUpdate(new Date().toLocaleTimeString('fr'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 120_000)
    return () => clearInterval(id)
  }, [fetchData])

  return { data, loading, error, lastUpdate, refetch: fetchData, budget: BUDGET }
}
