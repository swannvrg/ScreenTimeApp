'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Copy, Check, Save, GripVertical } from 'lucide-react'
import Link from 'next/link'

const C = {
  muted: 'rgba(255,255,255,0.4)', text: '#f0f0ff',
  border: 'rgba(255,255,255,0.1)', accent: '#6ee7b7', danger: '#ff6b8a',
  warn: '#fbbf24',
}

interface ApiKey {
  key: string
  label: string
  created_at: string
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
  timezone: string
  tasks: Task[]
}

const EMOJI_OPTIONS = ['💪','💧','🛏️','📚','🎧','🍎','🏃','🧘','✍️','🎯','🧹','💊','🚶','📝','🎸']

export default function SettingsPage() {
  const { user, authLoading, logout, updatePassword } = useAuth()
  const router = useRouter()

  // Mot de passe
  const [newPass, setNewPass]     = useState('')
  const [confirm, setConfirm]     = useState('')
  const [passError, setPassError] = useState('')
  const [passOk, setPassOk]       = useState('')
  const [savingPass, setSaving]   = useState(false)

  // API Keys
  const [keys, setKeys]         = useState<ApiKey[]>([])
  const [copied, setCopied]     = useState<string | null>(null)

  // Config
  const [config, setConfig]         = useState<Config | null>(null)
  const [loadingConfig, setLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configOk, setConfigOk]     = useState('')
  const [configErr, setConfigErr]   = useState('')

  // Nouvelle tâche
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({ name: '', label: '', time: 5, emoji: '💪' })
  const [addingTask, setAddingTask] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const fetchKeys = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('api_keys')
      .select('key, label, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setKeys(data || [])
  }, [user])

  const fetchConfig = useCallback(async () => {
    if (!user || keys.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/config', {
        headers: { 'x-api-key': keys[0].key }
      })
      const data = await res.json()
      setConfig(data)

      // Envoie le timezone du device si pas encore défini ou différent
      const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (data.timezone !== deviceTz) {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'x-api-key': keys[0].key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: deviceTz }),
        })
        setConfig(prev => prev ? { ...prev, timezone: deviceTz } : prev)
      }
    } catch (e) {
      setConfigErr('Erreur chargement config')
    } finally {
      setLoading(false)
    }
  }, [user, keys])

  useEffect(() => { fetchKeys() }, [fetchKeys])
  useEffect(() => { fetchConfig() }, [fetchConfig])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassError(''); setPassOk('')
    if (newPass !== confirm) { setPassError('Les mots de passe ne correspondent pas.'); return }
    if (newPass.length < 6)  { setPassError('Minimum 6 caractères.'); return }
    setSaving(true)
    const { error } = await updatePassword(newPass)
    setSaving(false)
    if (error) setPassError(error)
    else { setPassOk('Mot de passe mis à jour !'); setNewPass(''); setConfirm('') }
  }

  async function handleSaveConfig() {
    if (!config || keys.length === 0) return
    setSavingConfig(true)
    setConfigOk(''); setConfigErr('')
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'x-api-key': keys[0].key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: config.budget,
          solde_depart: config.solde_depart,
          tasks: config.tasks,
        }),
      })
      const data = await res.json()
      if (data.status === 'ok') setConfigOk('Configuration sauvegardée ✓')
      else setConfigErr(data.error || 'Erreur')
    } catch {
      setConfigErr('Erreur réseau')
    } finally {
      setSavingConfig(false)
    }
  }

  function handleAddTask() {
    if (!newTask.label.trim() || !newTask.time) return
    setAddingTask(true)
    const name = newTask.label.trim().replace(/ /g, '_')
    const task: Task = {
      id:    Date.now().toString(),
      name,
      label: newTask.label.trim(),
      time:  newTask.time,
      emoji: newTask.emoji,
    }
    setConfig(prev => prev ? { ...prev, tasks: [...prev.tasks, task] } : prev)
    setNewTask({ name: '', label: '', time: 5, emoji: '💪' })
    setAddingTask(false)
  }

  function handleDeleteTask(id: string) {
    setConfig(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== id) } : prev)
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (authLoading || !user) return null

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      padding: '32px 16px 80px', maxWidth: 520, margin: '0 auto',
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, textDecoration: 'none' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Paramètres</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Mon compte</h1>
        </div>
      </div>

      {/* Infos compte */}
      <div className="fade-up s1 glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Compte</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #6ee7b7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#0d0d1a', flexShrink: 0 }}>
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>{user.email}</p>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0' }}>Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
            {config?.timezone && (
              <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0' }}>🌍 {config.timezone}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Paramètres système ── */}
      <div className="fade-up s2 glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>Paramètres du système</p>

        {loadingConfig ? (
          <p style={{ fontSize: 13, color: C.muted }}>Chargement…</p>
        ) : config ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Budget écran quotidien (min)
              </label>
              <input
                className="field"
                type="number" min={1} max={480}
                value={config.budget}
                onChange={e => setConfig(prev => prev ? { ...prev, budget: parseInt(e.target.value) || 0 } : prev)}
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Limite de consommation avant alerte</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Solde de départ quotidien (min)
              </label>
              <input
                className="field"
                type="number" min={0} max={120}
                value={config.solde_depart}
                onChange={e => setConfig(prev => prev ? { ...prev, solde_depart: parseInt(e.target.value) || 0 } : prev)}
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Solde initial à minuit chaque jour</p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: C.danger }}>{configErr || 'Impossible de charger la config'}</p>
        )}
      </div>

      {/* ── Gestion des tâches ── 
      <div className="fade-up s3 glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>Tâches du menu</p>

        
        {config && config.tasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {config.tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px' }}>
                <GripVertical size={14} color={C.muted} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 18, flexShrink: 0 }}>{t.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{t.name} · +{t.time} min</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <input
                    type="number" min={1} max={60}
                    value={t.time}
                    onChange={e => setConfig(prev => prev ? {
                      ...prev,
                      tasks: prev.tasks.map(task => task.id === t.id ? { ...task, time: parseInt(e.target.value) || 1 } : task)
                    } : prev)}
                    style={{ width: 48, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 8px', color: C.accent, fontSize: 13, fontWeight: 700, textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}
                  />
                  <span style={{ fontSize: 11, color: C.muted }}>min</span>
                  <button onClick={() => handleDeleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, padding: 4, display: 'flex' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}*/}

        {/* Ajouter une tâche 
        <div style={{ background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 12, padding: '14px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 12 }}>Ajouter une tâche</p>

          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setNewTask(prev => ({ ...prev, emoji: e }))}
                style={{ fontSize: 18, background: newTask.emoji === e ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${newTask.emoji === e ? 'rgba(110,231,183,0.4)' : C.border}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
                {e}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              className="field"
              placeholder="Nom affiché (ex: Exos pompes)"
              value={newTask.label}
              onChange={e => setNewTask(prev => ({ ...prev, label: e.target.value }))}
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <input
                type="number" min={1} max={60}
                value={newTask.time}
                onChange={e => setNewTask(prev => ({ ...prev, time: parseInt(e.target.value) || 1 }))}
                style={{ width: 56, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 8px', color: C.accent, fontSize: 14, fontWeight: 700, textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}
              />
              <span style={{ fontSize: 12, color: C.muted }}>min</span>
            </div>
          </div>

          <button
            onClick={handleAddTask}
            disabled={!newTask.label.trim() || addingTask}
            style={{ width: '100%', background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 10, padding: '10px', color: C.accent, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !newTask.label.trim() ? 0.4 : 1 }}>
            <Plus size={15} /> Ajouter
          </button>
        </div>*/}

        {/* Bouton sauvegarder 
        <button
          onClick={handleSaveConfig}
          disabled={savingConfig || !config}
          style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 12, padding: '13px', color: C.accent, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Save size={16} />
          {savingConfig ? 'Sauvegarde…' : 'Sauvegarder la configuration'}
        </button>
        {configOk  && <p style={{ fontSize: 13, color: C.accent, marginTop: 8, textAlign: 'center' }}>{configOk}</p>}
        {configErr && <p style={{ fontSize: 13, color: C.danger, marginTop: 8, textAlign: 'center' }}>{configErr}</p>}
      </div>*/}

      {/* API Keys 
      <div className="fade-up s4 glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Clé API — Raccourcis iOS</p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Colle cette clé dans ta PWA ou ton raccourci iOS.</p>

        {keys.length === 0 ? (
          <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '12px 0' }}>Aucune clé trouvée</p>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Ma clé iOS</span>
              <button onClick={() => copyKey(keys[0].key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === keys[0].key ? C.accent : C.muted, padding: 4 }}>
                {copied === keys[0].key ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: C.accent, wordBreak: 'break-all', margin: 0 }}>{keys[0].key}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: '6px 0 0' }}>Créée le {new Date(keys[0].created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        )}

        {keys.length > 0 && (
          <div style={{ marginTop: 16, background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 8 }}>Dans ta PWA / raccourci iOS :</p>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• URL : <span style={{ color: C.text, fontFamily: 'monospace' }}>{process.env.NEXT_PUBLIC_APP_URL || 'https://screen-time-app-sable.vercel.app'}/api/log</span></p>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• Method : <span style={{ color: C.text }}>POST</span></p>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• Header : <span style={{ color: C.text, fontFamily: 'monospace' }}>x-api-key: {keys[0].key}</span></p>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• Body : <span style={{ color: C.text, fontFamily: 'monospace' }}>{`{"nom_task": "Exos_pompes", "time": 5}`}</span></p>
          </div>
        )}
      </div>*/}

      {/* Changer mot de passe */}
      <div className="fade-up s5 glass-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>Changer le mot de passe</p>
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Nouveau mot de passe</label>
            <input className="field" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required placeholder="Min. 6 caractères" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Confirmer</label>
            <input className="field" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
            {confirm.length > 0 && (
              <p style={{ fontSize: 12, marginTop: 6, color: newPass === confirm ? C.accent : C.danger }}>
                {newPass === confirm ? '✓ Correspondent' : '✗ Ne correspondent pas'}
              </p>
            )}
          </div>
          {passError && <p style={{ fontSize: 13, color: C.danger }}>{passError}</p>}
          {passOk    && <p style={{ fontSize: 13, color: C.accent }}>{passOk}</p>}
          <button className="btn-primary" type="submit" disabled={savingPass || newPass !== confirm}>
            {savingPass ? '...' : 'Mettre à jour →'}
          </button>
        </form>
      </div>

      {/* Déconnexion */}
      <div className="fade-up s6 glass-card">
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Session</p>
        <button onClick={logout} style={{ width: '100%', background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.25)', borderRadius: 14, padding: '13px 20px', color: C.danger, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
          Se déconnecter
        </button>
      </div>

    </main>
  )
}