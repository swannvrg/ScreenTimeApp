'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, ChevronRight, Check } from 'lucide-react'

const C = {
  accent: '#6ee7b7', accentB: '#3b82f6', danger: '#ff6b8a',
  text: '#f0f0ff', muted: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)',
}

const PRESET_TASKS = [
  { name: 'Exos_pompes',        label: 'Exos pompes',      time: 5,  emoji: '💪' },
  { name: "Boire_1L5_d'eau",    label: "Boire 1L5 d'eau",  time: 3,  emoji: '💧' },
  { name: 'Faire_lit',          label: 'Faire lit',        time: 2,  emoji: '🛏️' },
  { name: 'Lire_10_pages',      label: 'Lire 10 pages',    time: 10, emoji: '📚' },
  { name: 'Finir_podcast',      label: 'Finir podcast',    time: 5,  emoji: '🎧' },
  { name: 'Meditation',         label: 'Méditation',       time: 10, emoji: '🧘' },
  { name: 'Sport_30min',        label: 'Sport 30 min',     time: 15, emoji: '🏃' },
  { name: 'Pas_fume',           label: 'Pas fumé',         time: 5,  emoji: '🚭' },
  { name: 'Journaling',         label: 'Journaling',       time: 8,  emoji: '✍️' },
  { name: 'Cuisine_maison',     label: 'Cuisine maison',   time: 10, emoji: '🍳' },
]

const EMOJI_OPTIONS = ['💪','💧','🛏️','📚','🎧','🧘','🏃','🚭','✍️','🍳','🎯','🧹','💊','🎸','⭐']

interface Task { id: string; name: string; label: string; time: number; emoji: string }

type Step = 'account' | 'tasks' | 'params' | 'done'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('account')

  // Step 1 — compte
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [apiKey, setApiKey]     = useState('')

  // Step 2 — tâches
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])
  const [newTask, setNewTask]   = useState({ label: '', time: 5, emoji: '💪' })
  const [showCustom, setShowCustom] = useState(false)

  // Step 3 — params
  const [budget, setBudget]           = useState(45)
  const [soldeDepart, setSoldeDepart] = useState(10)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configError, setConfigError] = useState('')

  // ── Step 1 : Création du compte ──
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setAuthError(error.message); return }
      if (!data.user) { setAuthError('Erreur création compte'); return }

      // Crée la clé API automatiquement
      const { data: keyData, error: keyErr } = await supabase
        .from('api_keys')
        .insert({ user_id: data.user.id, label: 'PWA' })
        .select('key')
        .single()

      if (keyErr || !keyData) { setAuthError('Compte créé mais erreur clé API'); return }
      setApiKey(keyData.key)
      setStep('tasks')
    } catch (e) {
      setAuthError('Erreur inattendue')
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Step 2 : Toggle tâche preset ──
  function togglePreset(preset: typeof PRESET_TASKS[0]) {
    const exists = selectedTasks.find(t => t.name === preset.name)
    if (exists) {
      setSelectedTasks(prev => prev.filter(t => t.name !== preset.name))
    } else {
      setSelectedTasks(prev => [...prev, { ...preset, id: Date.now().toString() }])
    }
  }

  function handleAddCustom() {
    if (!newTask.label.trim()) return
    const name = newTask.label.trim().replace(/ /g, '_')
    setSelectedTasks(prev => [...prev, { id: Date.now().toString(), name, label: newTask.label.trim(), time: newTask.time, emoji: newTask.emoji }])
    setNewTask({ label: '', time: 5, emoji: '💪' })
    setShowCustom(false)
  }

  // ── Step 3 : Sauvegarder config ──
  async function handleSaveConfig() {
    if (!apiKey) return
    setSavingConfig(true)
    setConfigError('')
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, solde_depart: soldeDepart, timezone, tasks: selectedTasks }),
      })
      const data = await res.json()
      if (data.status === 'ok') setStep('done')
      else setConfigError(data.error || 'Erreur')
    } catch {
      setConfigError('Erreur réseau')
    } finally {
      setSavingConfig(false)
    }
  }

  // ── Progress bar ──
  const steps: Step[] = ['account', 'tasks', 'params', 'done']
  const stepIdx = steps.indexOf(step)
  const stepLabels = ['Compte', 'Tâches', 'Paramètres', 'Prêt']

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      padding: '32px 16px 80px', maxWidth: 480, margin: '0 auto',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ position: 'fixed', top: '5%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Bienvenue</p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: C.text, margin: '0 0 24px', lineHeight: 1 }}>
            Screen<span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentB})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Time</span>
          </h1>

          {/* Progress steps */}
          <div style={{ display: 'flex', gap: 8 }}>
            {stepLabels.map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 3, borderRadius: 2, background: i <= stepIdx ? C.accent : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                <span style={{ fontSize: 10, color: i <= stepIdx ? C.accent : C.muted, fontWeight: i === stepIdx ? 700 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1 : Compte ── */}
        {step === 'account' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Étape 1</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 20px' }}>Créer mon compte</h2>
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Email</label>
                <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="toi@exemple.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Mot de passe</label>
                <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 caractères" minLength={6} />
              </div>
              {authError && <p style={{ fontSize: 13, color: C.danger }}>{authError}</p>}
              <button className="btn-primary" type="submit" disabled={authLoading}>
                {authLoading ? 'Création…' : 'Créer mon compte →'}
              </button>
              <p style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
                Déjà un compte ?{' '}
                <a href="/login" style={{ color: C.accent, textDecoration: 'none' }}>Se connecter</a>
              </p>
            </form>
          </div>
        )}

        {/* ── Step 2 : Tâches ── */}
        {step === 'tasks' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Étape 2</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Mes tâches</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Sélectionne les habitudes à tracker. Tu pourras en ajouter plus tard.</p>

              {/* Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {PRESET_TASKS.map(preset => {
                  const selected = !!selectedTasks.find(t => t.name === preset.name)
                  return (
                    <button key={preset.name} onClick={() => togglePreset(preset)}
                      style={{
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
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: selected ? C.accent : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${selected ? C.accent : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected && <Check size={13} color="#0d0d1a" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Tâche custom */}
              {!showCustom ? (
                <button onClick={() => setShowCustom(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px dashed ${C.border}`, borderRadius: 14, padding: '12px', color: C.muted, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                  <Plus size={15} /> Ajouter une tâche personnalisée
                </button>
              ) : (
                <div style={{ background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 14, padding: '14px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => setNewTask(prev => ({ ...prev, emoji: e }))}
                        style={{ fontSize: 18, background: newTask.emoji === e ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${newTask.emoji === e ? 'rgba(110,231,183,0.4)' : C.border}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input className="field" placeholder="Nom de la tâche" value={newTask.label}
                      onChange={e => setNewTask(prev => ({ ...prev, label: e.target.value }))} style={{ flex: 1 }} />
                    <input type="number" min={1} max={60} value={newTask.time}
                      onChange={e => setNewTask(prev => ({ ...prev, time: parseInt(e.target.value) || 1 }))}
                      style={{ width: 56, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 8px', color: C.accent, fontSize: 14, fontWeight: 700, textAlign: 'center', fontFamily: "'Outfit', sans-serif" }} />
                    <span style={{ fontSize: 12, color: C.muted, alignSelf: 'center' }}>min</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowCustom(false)}
                      style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                      Annuler
                    </button>
                    <button onClick={handleAddCustom} disabled={!newTask.label.trim()}
                      style={{ flex: 2, padding: '10px', background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.25)', borderRadius: 10, color: C.accent, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", opacity: !newTask.label.trim() ? 0.4 : 1 }}>
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setStep('params')} disabled={selectedTasks.length === 0}
              style={{ width: '100%', background: selectedTasks.length > 0 ? `linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))` : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedTasks.length > 0 ? 'rgba(110,231,183,0.3)' : C.border}`, borderRadius: 14, padding: '14px', color: selectedTasks.length > 0 ? C.accent : C.muted, fontWeight: 700, fontSize: 15, cursor: selectedTasks.length > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {selectedTasks.length > 0 ? `Continuer avec ${selectedTasks.length} tâche${selectedTasks.length > 1 ? 's' : ''}` : 'Sélectionne au moins une tâche'}
              {selectedTasks.length > 0 && <ChevronRight size={16} />}
            </button>
          </div>
        )}

        {/* ── Step 3 : Paramètres ── */}
        {step === 'params' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Étape 3</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>Paramètres</h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Configure ton système de récompense.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Budget écran quotidien</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={10} max={240} step={5} value={budget}
                    onChange={e => setBudget(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: C.danger }} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.danger, minWidth: 60 }}>{budget} min</span>
                </div>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Limite de consommation avant alerte</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Solde de départ quotidien</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={0} max={60} step={1} value={soldeDepart}
                    onChange={e => setSoldeDepart(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: C.accent }} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.accent, minWidth: 60 }}>{soldeDepart} min</span>
                </div>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Minutes disponibles à minuit chaque jour</p>
              </div>

              <div style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🌍</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Timezone détecté automatiquement</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                </div>
              </div>
            </div>

            {configError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{configError}</p>}

            <button onClick={handleSaveConfig} disabled={savingConfig}
              style={{ width: '100%', background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 14, padding: '14px', color: C.accent, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {savingConfig ? 'Sauvegarde…' : 'Terminer la configuration →'}
            </button>
          </div>
        )}

        {/* ── Step 4 : Done ── */}
        {step === 'done' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(110,231,183,0.1), rgba(59,130,246,0.08))', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>C'est parti !</h2>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
              Ton système est configuré. Installe l'app sur ton écran d'accueil pour logger tes tâches en un tap.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => router.push('/log')}
                style={{ width: '100%', background: 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(110,231,183,0.3)', borderRadius: 14, padding: '14px', color: C.accent, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Ouvrir le logger →
              </button>
              <button onClick={() => router.push('/')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', color: C.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Voir le dashboard
              </button>
            </div>

            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Sur iPhone :</p>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                Safari → cette page → icône Partager → "Sur l'écran d'accueil"
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}