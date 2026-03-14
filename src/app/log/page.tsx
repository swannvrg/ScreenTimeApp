'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings, Smartphone } from 'lucide-react'
import Link from 'next/link'

const C = {
  accent: '#6ee7b7', accentB: '#3b82f6', danger: '#ff6b8a',
  warn: '#fbbf24', text: '#f0f0ff', muted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.1)',
}

interface Task {
  id: string
  name: string
  label: string
  time: number
  emoji: string
}

interface Config {
  budget: number
  solde_depart: number
  tasks: Task[]
}

type LogState = 'idle' | 'loading' | 'success' | 'error'

const QUICK_DURATIONS = [2, 5, 10]

export default function LogPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()

  const [config, setConfig]           = useState<Config | null>(null)
  const [apiKey, setApiKey]           = useState<string | null>(null)
  const [solde, setSolde]             = useState<number | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)

  // État du log
  const [logState, setLogState]   = useState<LogState>('idle')
  const [lastLog, setLastLog]     = useState<{ label: string; solde: number } | null>(null)
  const successTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Consommation écran
  const [showConso, setShowConso]       = useState(false)
  const [consoDuration, setConsoDuration] = useState(5)
  const [consoLogging, setConsoLogging] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  // Fetch api_key + config + solde
  const init = useCallback(async () => {
    if (!user) return
    setLoadingInit(true)
    try {
      // Récupère la clé API
      const { data: keyData } = await (await import('@/lib/supabase')).supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .single()

      if (!keyData) return
      const key = keyData.key
      setApiKey(key)

      // Fetch config + solde en parallèle
      const [configRes, soldeRes] = await Promise.all([
        fetch('/api/config', { headers: { 'x-api-key': key } }),
        fetch('/api/log',    { headers: { 'x-api-key': key } }),
      ])
      const configData = await configRes.json()
      const soldeData  = await soldeRes.json()

      setConfig(configData)
      setSolde(soldeData.solde ?? configData.solde_depart ?? 10)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingInit(false)
    }
  }, [user])

  useEffect(() => { init() }, [init])

  async function logTask(nomTask: string, time: number, label: string) {
    if (!apiKey || logState === 'loading') return
    setLogState('loading')
    if (successTimer.current) clearTimeout(successTimer.current)

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_task: nomTask, time }),
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setSolde(data.solde)
        setLastLog({ label, solde: data.solde })
        setLogState('success')
        successTimer.current = setTimeout(() => {
          setLogState('idle')
          setLastLog(null)
        }, 2500)
      } else {
        setLogState('error')
        setTimeout(() => setLogState('idle'), 2000)
      }
    } catch {
      setLogState('error')
      setTimeout(() => setLogState('idle'), 2000)
    }
  }

  async function handleConso() {
    setConsoLogging(true)
    await logTask('Consommation temps', consoDuration, `Écran ${consoDuration} min`)
    setShowConso(false)
    setConsoDuration(5)
    setConsoLogging(false)
  }

  if (authLoading || !user) return null

  const soldeColor = solde !== null && solde >= 0 ? C.accent : C.danger

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      padding: '32px 16px 80px',
      maxWidth: 420,
      margin: '0 auto',
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* Glow bg */}
      <div style={{ position: 'fixed', top: '5%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Logger</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1 }}>
              Mes tâches
            </h1>
          </div>
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, textDecoration: 'none' }}>
            <Settings size={16} />
          </Link>
        </div>

        {/* ── Solde ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(110,231,183,0.1), rgba(59,130,246,0.08))',
          border: '1px solid rgba(110,231,183,0.2)',
          borderRadius: 20, padding: '20px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Solde du jour</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{
                fontSize: 64, fontWeight: 800, lineHeight: 0.9,
                background: loadingInit ? 'none' : solde !== null && solde >= 0
                  ? `linear-gradient(135deg, ${C.accent}, ${C.accentB})`
                  : 'linear-gradient(135deg, #ff6b8a, #ff2d55)',
                WebkitBackgroundClip: !loadingInit && solde !== null ? 'text' : 'unset',
                WebkitTextFillColor: !loadingInit && solde !== null ? 'transparent' : C.muted,
                color: !loadingInit && solde !== null ? 'transparent' : C.muted,
              }}>
                {loadingInit ? '…' : solde ?? '—'}
              </span>
              <span style={{ fontSize: 18, color: C.muted, paddingBottom: 6 }}>min</span>
            </div>
          </div>

          {/* Bouton consommation écran */}
          <button
            onClick={() => setShowConso(true)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.25)',
              borderRadius: 16, padding: '12px 16px', cursor: 'pointer', color: C.danger,
            }}>
            <Smartphone size={20} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>Écran</span>
          </button>
        </div>

        {/* ── Confirmation animée ── */}
        <div style={{
          height: logState === 'success' || logState === 'error' ? 56 : 0,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          marginBottom: logState !== 'idle' ? 16 : 0,
        }}>
          {logState === 'success' && lastLog && (
            <div style={{
              background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.3)',
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>✓ {lastLog.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>Solde : {lastLog.solde} min</span>
            </div>
          )}
          {logState === 'error' && (
            <div style={{ background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.25)', borderRadius: 14, padding: '12px 16px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.danger }}>✗ Erreur — réessaie</span>
            </div>
          )}
        </div>

        {/* ── Liste des tâches ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {loadingInit ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 68, background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: `1px solid ${C.border}`, opacity: 0.5 }} />
            ))
          ) : config?.tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 14 }}>
              Aucune tâche configurée —{' '}
              <Link href="/settings" style={{ color: C.accent, textDecoration: 'none' }}>ajouter dans Settings</Link>
            </div>
          ) : (
            config?.tasks.map(task => (
              <button
                key={task.id}
                onClick={() => logTask(task.name, task.time, `${task.emoji} ${task.label}`)}
                disabled={logState === 'loading'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: '14px 16px',
                  cursor: logState === 'loading' ? 'not-allowed' : 'pointer',
                  textAlign: 'left', width: '100%',
                  transition: 'background 0.15s, border-color 0.15s',
                  opacity: logState === 'loading' ? 0.6 : 1,
                }}
                onMouseDown={e => (e.currentTarget.style.background = 'rgba(110,231,183,0.08)')}
                onMouseUp={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onTouchStart={e => (e.currentTarget.style.background = 'rgba(110,231,183,0.08)')}
                onTouchEnd={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{task.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{task.label}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>+{task.time} min</p>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: C.accent,
                  background: 'rgba(110,231,183,0.1)', padding: '4px 12px', borderRadius: 8,
                  flexShrink: 0,
                }}>
                  +{task.time}
                </span>
              </button>
            ))
          )}
        </div>

        {/* ── Modal consommation écran ── */}
        {showConso && (
          <div
            onClick={() => setShowConso(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              zIndex: 100, padding: '0 16px 32px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 420,
                background: 'linear-gradient(135deg, #0d0d1a, #0a1628)',
                border: `1px solid ${C.border}`, borderRadius: 24,
                padding: '24px',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Consommation</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 24 }}>Temps écran</p>

              {/* Boutons rapides */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {QUICK_DURATIONS.map(d => (
                  <button key={d} onClick={() => setConsoDuration(d)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12,
                      border: `1px solid ${consoDuration === d ? 'rgba(255,107,138,0.5)' : C.border}`,
                      background: consoDuration === d ? 'rgba(255,107,138,0.15)' : 'rgba(255,255,255,0.04)',
                      color: consoDuration === d ? C.danger : C.muted,
                      fontSize: 16, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                    {d} min
                  </button>
                ))}
              </div>

              {/* Slider personnalisé */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Personnalisé</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.danger }}>{consoDuration} min</span>
                </div>
                <input
                  type="range" min={1} max={60} step={1}
                  value={consoDuration}
                  onChange={e => setConsoDuration(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: C.danger }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>1 min</span>
                  <span style={{ fontSize: 11, color: C.muted }}>60 min</span>
                </div>
              </div>

              {/* Bouton confirmer */}
              <button
                onClick={handleConso}
                disabled={consoLogging}
                style={{
                  width: '100%', padding: '16px',
                  background: 'linear-gradient(135deg, rgba(255,107,138,0.2), rgba(255,45,85,0.15))',
                  border: '1px solid rgba(255,107,138,0.35)',
                  borderRadius: 14, color: C.danger,
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <Smartphone size={18} />
                {consoLogging ? 'Enregistrement…' : `Logger ${consoDuration} min d'écran`}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}