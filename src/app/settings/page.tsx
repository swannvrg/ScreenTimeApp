'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Copy, Check } from 'lucide-react'
import Link from 'next/link'

const C = {
  muted: 'rgba(255,255,255,0.4)', text: '#f0f0ff',
  border: 'rgba(255,255,255,0.1)', accent: '#6ee7b7', danger: '#ff6b8a',
}

interface ApiKey {
  key: string
  label: string
  created_at: string
}

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
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)

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

  useEffect(() => { fetchKeys() }, [fetchKeys])

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

  async function handleCreateKey() {
    if (!user || !newLabel.trim()) return
    setCreating(true)
    const { error } = await supabase
      .from('api_keys')
      .insert({ user_id: user.id, label: newLabel.trim() })
    setCreating(false)
    if (!error) { setNewLabel(''); fetchKeys() }
  }

  async function handleDeleteKey(key: string) {
    await supabase.from('api_keys').delete().eq('key', key)
    fetchKeys()
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
          </div>
        </div>
      </div>

     {/* API Keys */}
<div className="fade-up s2 glass-card" style={{ marginBottom: 16 }}>
  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Clé API — Raccourcis iOS</p>
  <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Clé générée automatiquement à la création du compte. Colle-la dans ton raccourci iOS.</p>

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

  {/* Instructions raccourci */}
  {keys.length > 0 && (
    <div style={{ marginTop: 16, background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 8 }}>Dans ton raccourci iOS :</p>
      <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• URL : <span style={{ color: C.text, fontFamily: 'monospace' }}>{process.env.NEXT_PUBLIC_APP_URL || 'https://ton-app.vercel.app'}/api/log</span></p>
      <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• Method : <span style={{ color: C.text }}>POST</span></p>
      <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• Header : <span style={{ color: C.text, fontFamily: 'monospace' }}>x-api-key: ta_clé</span></p>
      <p style={{ fontSize: 12, color: C.muted, margin: '4px 0' }}>• Body : <span style={{ color: C.text }}>JSON</span></p>
    </div>
  )}
</div>

      {/* Changer mot de passe */}
      <div className="fade-up s3 glass-card" style={{ marginBottom: 16 }}>
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
      <div className="fade-up s4 glass-card">
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Session</p>
        <button onClick={logout} style={{ width: '100%', background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.25)', borderRadius: 14, padding: '13px 20px', color: C.danger, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
          Se déconnecter
        </button>
      </div>

    </main>
  )
}