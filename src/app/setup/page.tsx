'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Plus, Check, ChevronRight, Copy, ExternalLink } from 'lucide-react'

const C = {
  accent: '#6ee7b7', accentB: '#3b82f6', danger: '#ff6b8a',
  text: '#f0f0ff', muted: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)',
}

const APP_URL = 'https://screen-time-app-sable.vercel.app'
const SHORTCUT_ICLOUD_URL = 'https://www.icloud.com/shortcuts/REMPLACE_PAR_TON_LIEN'

const PRESET_TASKS = [
  { name: 'Exos_pompes',       label: 'Exos pompes',     time: 5,  emoji: '💪' },
  { name: "Boire_1L5_d'eau",   label: "Boire 1L5 d'eau", time: 3,  emoji: '💧' },
  { name: 'Faire_lit',         label: 'Faire lit',       time: 2,  emoji: '🛏️' },
  { name: 'Lire_10_pages',     label: 'Lire 10 pages',   time: 10, emoji: '📚' },
  { name: 'Finir_podcast',     label: 'Finir podcast',   time: 5,  emoji: '🎧' },
  { name: 'Meditation',        label: 'Méditation',      time: 10, emoji: '🧘' },
  { name: 'Sport_30min',       label: 'Sport 30 min',    time: 15, emoji: '🏃' },
  { name: 'Pas_fume',          label: 'Pas fumé',        time: 5,  emoji: '🚭' },
  { name: 'Journaling',        label: 'Journaling',      time: 8,  emoji: '✍️' },
  { name: 'Cuisine_maison',    label: 'Cuisine maison',  time: 10, emoji: '🍳' },
]

const EMOJI_OPTIONS = ['💪','💧','🛏️','📚','🎧','🧘','🏃','🚭','✍️','🍳','🎯','🧹','💊','🎸','⭐']

const POPULAR_APPS = [
  { name: 'TikTok', icon: '🎵' }, { name: 'Instagram', icon: '📸' },
  { name: 'YouTube', icon: '▶️' }, { name: 'Twitter / X', icon: '🐦' },
  { name: 'Snapchat', icon: '👻' }, { name: 'Netflix', icon: '🎬' },
  { name: 'Facebook', icon: '👤' }, { name: 'Reddit', icon: '🤖' },
  { name: 'Twitch', icon: '🎮' }, { name: 'Discord', icon: '💬' },
]

interface Task { id: string; name: string; label: string; time: number; emoji: string }
type Step = 'device' | 'tasks' | 'params' | 'install'
type DeviceType = 'ios' | 'android'

export default function SetupPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()

  const [step, setStep]           = useState<Step>('device')
  const [device, setDevice]       = useState<DeviceType | null>(null)
  const [apiKey, setApiKey]       = useState('')
  const [copied, setCopied]       = useState(false)

  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])
  const [newTask, setNewTask]     = useState({ label: '', time: 5, emoji: '💪' })
  const [showCustom, setShowCustom] = useState(false)

  const [budget, setBudget]           = useState(45)
  const [soldeDepart, setSoldeDepart] = useState(10)
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [savingConfig, setSavingConfig] = useState(false)
  const [configError, setConfigError]   = useState('')

  // Redirige si pas connecté
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  // Récupère la clé API + vérifie si setup déjà fait
  const init = useCallback(async () => {
    if (!user) return
    const { data: keyData } = await supabase
      .from('api_keys').select('key').eq('user_id', user.id).single()
    if (keyData) setApiKey(keyData.key)

    // Si setup déjà complet → redirige dashboard
    const { data: config } = await supabase
      .from('config').select('setup_complete').eq('user_id', user.id).single()
    if (config?.setup_complete) router.replace('/')
  }, [user, router])

  useEffect(() => { init() }, [init])

  function togglePreset(preset: typeof PRESET_TASKS[0]) {
    const exists = selectedTasks.find(t => t.name === preset.name)
    if (exists) setSelectedTasks(prev => prev.filter(t => t.name !== preset.name))
    else setSelectedTasks(prev => [...prev, { ...preset, id: Date.now().toString() }])
  }

  function handleAddCustom() {
    if (!newTask.label.trim()) return
    const name = newTask.label.trim().replace(/ /g, '_')
    setSelectedTasks(prev => [...prev, { id: Date.now().toString(), name, label: newTask.label.trim(), time: newTask.time, emoji: newTask.emoji }])
    setNewTask({ label: '', time: 5, emoji: '💪' })
    setShowCustom(false)
  }

  async function handleSaveConfig() {
    if (!apiKey) return
    setSavingConfig(true)
    setConfigError('')
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget, solde_depart: soldeDepart, timezone,
          tasks: selectedTasks, device_type: device,
          setup_complete: true,
        }),
      })
      const data = await res.json()
      if (data.status === 'ok') setStep('install')
      else setConfigError(data.error || 'Erreur')
    } catch { setConfigError('Erreur réseau') }
    finally { setSavingConfig(false) }
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps: Step[] = ['device', 'tasks', 'params', 'install']
  const stepLabels = ['Device', 'Tâches', 'Paramètres', 'Installation']
  const stepIdx = steps.indexOf(step)

  if (authLoading || !user) return null

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      padding: '32px 16px 80px', maxWidth: 480, margin: '0 auto',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ position: 'fixed', top: '5%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header + Progress */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: C.text, margin: '0 0 24px', lineHeight: 1 }}>
            Screen<span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentB})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Time</span>
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {stepLabels.map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 3, borderRadius: 2, background: i <= stepIdx ? C.accent : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                <span style={{ fontSize: 10, color: i <= stepIdx ? C.accent : C.muted, fontWeight: i === stepIdx ? 700 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1 : Device ── */}
        {step === 'device' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Étape 1</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>Quel est ton téléphone ?</h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Le guide d'installation sera adapté à ton device.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                { type: 'ios' as DeviceType, icon: '', label: 'iPhone / iPad', sub: 'iOS — Raccourci + Screen Time' },
                { type: 'android' as DeviceType, icon: '🤖', label: 'Android', sub: 'MacroDroid + PWA' },
              ] as const).map(opt => (
                <button key={opt.type} onClick={() => { setDevice(opt.type); setStep('tasks') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                    borderRadius: 16, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(110,231,183,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <span style={{ fontSize: 32, flexShrink: 0 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0' }}>{opt.sub}</p>
                  </div>
                  <ChevronRight size={18} color={C.muted} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 : Tâches ── */}
        {step === 'tasks' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Étape 2</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Mes tâches</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Sélectionne les habitudes à tracker.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {PRESET_TASKS.map(preset => {
                  const selected = !!selectedTasks.find(t => t.name === preset.name)
                  return (
                    <button key={preset.name} onClick={() => togglePreset(preset)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: selected ? 'rgba(110,231,183,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selected ? 'rgba(110,231,183,0.3)' : C.border}`,
                      borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{preset.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: selected ? C.accent : C.text, margin: 0 }}>{preset.label}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>+{preset.time} min</p>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: selected ? C.accent : 'rgba(255,255,255,0.06)', border: `1px solid ${selected ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <Check size={13} color="#0d0d1a" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {!showCustom ? (
                <button onClick={() => setShowCustom(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px dashed ${C.border}`, borderRadius: 14, padding: '12px', color: C.muted, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                  <Plus size={15} /> Ajouter une tâche personnalisée
                </button>
              ) : (
                <div style={{ background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 14, padding: '14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => setNewTask(prev => ({ ...prev, emoji: e }))} style={{ fontSize: 18, background: newTask.emoji === e ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${newTask.emoji === e ? 'rgba(110,231,183,0.4)' : C.border}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>{e}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input className="field" placeholder="Nom de la tâche" value={newTask.label} onChange={e => setNewTask(prev => ({ ...prev, label: e.target.value }))} style={{ flex: 1 }} />
                    <input type="number" min={1} max={60} value={newTask.time} onChange={e => setNewTask(prev => ({ ...prev, time: parseInt(e.target.value) || 1 }))} style={{ width: 56, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 8px', color: C.accent, fontSize: 14, fontWeight: 700, textAlign: 'center', fontFamily: "'Outfit', sans-serif" }} />
                    <span style={{ fontSize: 12, color: C.muted, alignSelf: 'center' }}>min</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowCustom(false)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Annuler</button>
                    <button onClick={handleAddCustom} disabled={!newTask.label.trim()} style={{ flex: 2, padding: '10px', background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 10, color: C.accent, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", opacity: !newTask.label.trim() ? 0.4 : 1 }}>Ajouter</button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setStep('params')} disabled={selectedTasks.length === 0} style={{ width: '100%', background: selectedTasks.length > 0 ? 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedTasks.length > 0 ? 'rgba(110,231,183,0.3)' : C.border}`, borderRadius: 14, padding: '14px', color: selectedTasks.length > 0 ? C.accent : C.muted, fontWeight: 700, fontSize: 15, cursor: selectedTasks.length > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {selectedTasks.length > 0 ? `Continuer avec ${selectedTasks.length} tâche${selectedTasks.length > 1 ? 's' : ''}` : 'Sélectionne au moins une tâche'}
              {selectedTasks.length > 0 && <ChevronRight size={16} />}
            </button>
          </div>
        )}

        {/* ── Step 3 : Paramètres ── */}
        {step === 'params' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Étape 3</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Paramètres</h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Configure ton système de récompense.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Budget écran quotidien</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={10} max={240} step={5} value={budget} onChange={e => setBudget(parseInt(e.target.value))} style={{ flex: 1, accentColor: C.danger }} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.danger, minWidth: 60 }}>{budget} min</span>
                </div>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Limite avant alerte</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Solde de départ quotidien</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={0} max={60} step={1} value={soldeDepart} onChange={e => setSoldeDepart(parseInt(e.target.value))} style={{ flex: 1, accentColor: C.accent }} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.accent, minWidth: 60 }}>{soldeDepart} min</span>
                </div>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Minutes disponibles à minuit</p>
              </div>

              <div style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🌍</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Timezone détecté</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '...'}</p>
                </div>
              </div>
            </div>

            {/* Apps à limiter */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Apps à limiter</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                {device === 'ios' ? 'Configurées via Screen Time à l\'étape suivante.' : 'Configurées via MacroDroid à l\'étape suivante.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {POPULAR_APPS.map(app => {
                  const sel = selectedApps.includes(app.name)
                  return (
                    <button key={app.name} onClick={() => setSelectedApps(prev => sel ? prev.filter(a => a !== app.name) : [...prev, app.name])}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: `1px solid ${sel ? 'rgba(255,107,138,0.4)' : C.border}`, background: sel ? 'rgba(255,107,138,0.1)' : 'rgba(255,255,255,0.04)', color: sel ? C.danger : C.muted, fontSize: 13, fontWeight: sel ? 700 : 400, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                      <span style={{ fontSize: 14 }}>{app.icon}</span>{app.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {configError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{configError}</p>}
            <button onClick={handleSaveConfig} disabled={savingConfig} style={{ width: '100%', background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 14, padding: '14px', color: C.accent, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {savingConfig ? 'Sauvegarde…' : 'Continuer →'}
            </button>
          </div>
        )}

        {/* ── Step 4 : Installation ── */}
        {step === 'install' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Clé API */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Ta clé API</p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Copie-la — tu en auras besoin pour le raccourci.</p>
              <div style={{ background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: C.accent, wordBreak: 'break-all', margin: 0, flex: 1 }}>{apiKey}</p>
                <button onClick={copyKey} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? C.accent : C.muted, flexShrink: 0, padding: 4 }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Guide iOS */}
            {device === 'ios' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}></span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Installation iOS</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>3 étapes — environ 5 minutes</p>
                  </div>
                </div>

                {[
                  {
                    title: '1. Installer la PWA',
                    color: C.accent,
                    steps: [
                      'Ouvre cette page dans Safari (pas Chrome)',
                      'Icône Partager en bas → "Sur l\'écran d\'accueil"',
                      'Nomme l\'app "ScreenTime" → Ajouter',
                    ]
                  },
                  {
                    title: '2. Installer le raccourci',
                    color: C.accent,
                    steps: [
                      'Appuie sur le bouton ci-dessous',
                      '"Ajouter le raccourci" dans Shortcuts',
                      'Au premier lancement, colle ta clé API',
                      'Le menu tâches se charge automatiquement',
                    ],
                    cta: { label: 'Installer le raccourci', href: SHORTCUT_ICLOUD_URL }
                  },
                  ...(selectedApps.length > 0 ? [{
                    title: '3. Screen Time',
                    color: C.danger,
                    steps: [
                      'Réglages → Temps d\'écran → Activer',
                      'Limites d\'apps → Ajouter une limite',
                      `Sélectionne : ${selectedApps.join(', ')}`,
                      'Durée : selon ton budget configuré',
                    ]
                  }] : [])
                ].map((section, si) => (
                  <div key={si} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: section.color, marginBottom: 10 }}>{section.title}</p>
                    {section.steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${section.color}20`, border: `1px solid ${section.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: section.color, flexShrink: 0 }}>{i + 1}</span>
                        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>{s}</p>
                      </div>
                    ))}
                    {'cta' in section && section.cta && (
                      <a href={section.cta.href} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 10, background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 12, padding: '12px', color: C.accent, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                        <ExternalLink size={15} /> {section.cta.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Guide Android */}
            {device === 'android' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}>🤖</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Installation Android</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>PWA + MacroDroid</p>
                  </div>
                </div>

                {[
                  {
                    title: '1. Installer la PWA',
                    color: C.accent,
                    steps: [
                      'Ouvre cette page dans Chrome',
                      'Menu ⋮ → "Ajouter à l\'écran d\'accueil"',
                      'Confirme → l\'icône apparaît sur ton écran',
                    ]
                  },
                  {
                    title: '2. Configurer MacroDroid',
                    color: C.accent,
                    steps: [
                      'Installe MacroDroid depuis le Play Store (gratuit)',
                      'Nouvelle macro → Déclencheur : Widget',
                      `Action : HTTP Request POST`,
                      `URL : ${APP_URL}/api/log`,
                      `Header : x-api-key = ${apiKey}`,
                      'Body JSON : {"nom_task": "NomTask", "time": 5}',
                      'Duplique une macro par tâche',
                    ]
                  },
                  ...(selectedApps.length > 0 ? [{
                    title: '3. Bloquer les apps',
                    color: C.danger,
                    steps: [
                      'MacroDroid → Nouvelle macro',
                      'Déclencheur : Minuterie quotidienne 00:00',
                      `Action : Bloquer app → ${selectedApps[0]}`,
                      'Répète pour chaque app sélectionnée',
                    ]
                  }] : [])
                ].map((section, si) => (
                  <div key={si} style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: section.color, marginBottom: 10 }}>{section.title}</p>
                    {section.steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${section.color}20`, border: `1px solid ${section.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: section.color, flexShrink: 0 }}>{i + 1}</span>
                        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5, fontFamily: s.includes('http') || s.includes('{') || s.includes('x-api') ? 'monospace' : 'inherit' }}>{s}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Boutons finaux */}
            <button onClick={() => router.push('/log')}
              style={{ width: '100%', background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 14, padding: '14px', color: C.accent, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
              Ouvrir le logger →
            </button>
            <button onClick={() => router.push('/')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', color: C.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
              Voir le dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  )
}