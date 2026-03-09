'use client'

import { useState, useEffect, useCallback } from 'react'

export interface LogRow {
  date:    string
  heure:   string
  nomTask: string
  time:    number
  solde:   number
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
const SOLDE_DEPART = 10 // minutes de départ chaque jour
const DAYS         = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function pad(n: number) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function isTask(r: LogRow)  { return r.nomTask && r.nomTask !== 'Consommation temps' && r.nomTask.trim() !== '' }
function isSpend(r: LogRow) { return r.nomTask === 'Consommation temps' }

function computeStreak(data: LogRow[]): number {
  let streak = 0
  const check = new Date()
  for (let i = 0; i < 60; i++) {
    const ds   = `${pad(check.getDate())}/${pad(check.getMonth() + 1)}/${check.getFullYear()}`
    const rows = data.filter(r => r.date === ds)
    if (rows.filter(isTask).length > 0) { streak++ }
    else if (i > 0) break
    check.setDate(check.getDate() - 1)
  }
  return streak
}

export function useScreenData(scriptUrl: string | null) {
  const [data, setData]             = useState<DashboardData | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!scriptUrl) return
    setLoading(true)
    setError(null)
    try {
      const res       = await fetch(scriptUrl, { redirect: 'follow' })
      const text      = await res.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd   = text.lastIndexOf('}')
      if (jsonStart === -1) throw new Error('Réponse invalide — vérifie ton URL Apps Script')
      const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
      if (json.status !== 'ok') throw new Error(json.message || 'Erreur API')

      const rows: LogRow[] = json.data
      const today          = todayStr()
      const todayRows      = rows.filter(r => r.date === today)

      const earned    = todayRows.filter(isTask).reduce((s, r)  => s + r.time, 0)
      const spent     = todayRows.filter(isSpend).reduce((s, r) => s + r.time, 0)
      const tasksDone = todayRows.filter(isTask).length

      // Solde = dernière valeur de solde du jour, ou SOLDE_DEPART si pas de logs
      const lastRow   = todayRows.length > 0 ? todayRows[todayRows.length - 1] : null
      const solde     = lastRow ? lastRow.solde : SOLDE_DEPART

      // Tâches du jour groupées
      const counts: Record<string, { count: number; total: number }> = {}
      todayRows.filter(isTask).forEach(r => {
        if (!counts[r.nomTask]) counts[r.nomTask] = { count: 0, total: 0 }
        counts[r.nomTask].count++
        counts[r.nomTask].total += r.time
      })
      const todayTasks = Object.entries(counts)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total)

      // Semaine
      // Semaine Lun → Dim (7 derniers jours en commençant par le lundi le plus récent)
      const weekDays: DayStats[] = []
      const todayDow = new Date().getDay() // 0=Dim, 1=Lun...
      // Offset pour remonter au lundi de la semaine courante
      const daysFromMonday = todayDow === 0 ? 6 : todayDow - 1
      for (let i = 6; i >= 0; i--) {
        const d  = new Date()
        d.setDate(d.getDate() - daysFromMonday + (6 - i))
        const ds = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
        const r  = rows.filter(x => x.date === ds)
        const isToday = ds === today
        weekDays.push({
          label:   DAYS[d.getDay()],
          dateStr: ds,
          earned:  r.filter(isTask).reduce((s, x)  => s + x.time, 0),
          spent:   r.filter(isSpend).reduce((s, x) => s + x.time, 0),
          isToday,
        })
      }

      setData({
        earned, spent, solde,
        tasksDone,
        streak:    computeStreak(rows),
        todayTasks,
        weekDays,
        recent:    [...rows].reverse().slice(0, 40),
        raw:       rows,
      })
      setLastUpdate(new Date().toLocaleTimeString('fr'))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [scriptUrl])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 120_000)
    return () => clearInterval(id)
  }, [fetchData])

  return { data, loading, error, lastUpdate, refetch: fetchData, budget: BUDGET }
}