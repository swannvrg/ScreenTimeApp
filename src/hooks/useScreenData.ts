'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Log } from '@/lib/supabase'

export type { Log }

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
  recent:     Log[]
  raw:        Log[]
}

const BUDGET       = 45
const SOLDE_DEPART = 10
const DAYS         = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function pad(n: number) { return String(n).padStart(2, '0') }

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayDisplay() {
  const d = new Date()
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function isTask(r: Log)  { return r.nom_task && r.nom_task !== 'Consommation temps' && r.nom_task.trim() !== '' }
function isSpend(r: Log) { return r.nom_task === 'Consommation temps' }

function computeStreak(data: Log[]): number {
  let streak = 0
  const check = new Date()
  for (let i = 0; i < 60; i++) {
    const ds = `${check.getFullYear()}-${pad(check.getMonth() + 1)}-${pad(check.getDate())}`
    if (data.filter(r => r.date === ds).filter(isTask).length > 0) streak++
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
      // Fetch tous les logs du user (30 derniers jours)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const sinceISO = `${since.getFullYear()}-${pad(since.getMonth() + 1)}-${pad(since.getDate())}`

      const { data: rows, error: err } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', sinceISO)
        .order('date', { ascending: true })
        .order('heure', { ascending: true })

      if (err) throw new Error(err.message)

      const logs    = rows as Log[]
      const todayIS = todayISO()
      const todayRows = logs.filter(r => r.date === todayIS)

      const earned    = todayRows.filter(isTask).reduce((s, r)  => s + r.time, 0)
      const spent     = todayRows.filter(isSpend).reduce((s, r) => s + r.time, 0)
      const tasksDone = todayRows.filter(isTask).length
      const lastRow   = todayRows.length > 0 ? todayRows[todayRows.length - 1] : null
      const solde     = lastRow ? lastRow.solde : SOLDE_DEPART

      // Tâches du jour groupées
      const counts: Record<string, { count: number; total: number }> = {}
      todayRows.filter(isTask).forEach(r => {
        if (!counts[r.nom_task]) counts[r.nom_task] = { count: 0, total: 0 }
        counts[r.nom_task].count++
        counts[r.nom_task].total += r.time
      })
      const todayTasks = Object.entries(counts)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total)

      // Semaine Lun → Dim
      const weekDays: DayStats[] = []
      const todayDow      = new Date().getDay()
      const daysFromMonday = todayDow === 0 ? 6 : todayDow - 1
      for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - daysFromMonday + i)
        const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        const r  = logs.filter(x => x.date === ds)
        weekDays.push({
          label:   DAYS[d.getDay()],
          dateStr: ds,
          earned:  r.filter(isTask).reduce((s, x)  => s + x.time, 0),
          spent:   r.filter(isSpend).reduce((s, x) => s + x.time, 0),
          isToday: ds === todayIS,
        })
      }

      setData({
        earned, spent, solde, tasksDone,
        streak:    computeStreak(logs),
        todayTasks, weekDays,
        recent:    [...logs].reverse().slice(0, 40),
        raw:       logs,
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