'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const C = {
  accent: '#6ee7b7', accentB: '#3b82f6', danger: '#ff6b8a',
  text: '#f0f0ff', muted: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)',
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6)  { setError('Minimum 6 caractères.'); return }
    setLoading(true)
    try {
      const { data, error: signupErr } = await supabase.auth.signUp({ email, password })
      if (signupErr) { setError(signupErr.message); return }
      if (!data.user) { setError('Erreur création compte'); return }

      // Crée la clé API automatiquement
      await supabase.from('api_keys').insert({ user_id: data.user.id, label: 'PWA' })

      // Login auto
      await supabase.auth.signInWithPassword({ email, password })

      // Redirige vers setup
      router.replace('/setup')
    } catch {
      setError('Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: C.text, margin: '0 0 8px', lineHeight: 1 }}>
            Screen<span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentB})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Time</span>
          </h1>
          <p style={{ fontSize: 14, color: C.muted }}>Crée ton compte pour commencer</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 24px' }}>
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Email</label>
              <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="toi@exemple.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Mot de passe</label>
              <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 caractères" minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Confirmer</label>
              <input className="field" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
              {confirm.length > 0 && (
                <p style={{ fontSize: 12, marginTop: 6, color: password === confirm ? C.accent : C.danger }}>
                  {password === confirm ? '✓ Correspondent' : '✗ Ne correspondent pas'}
                </p>
              )}
            </div>
            {error && <p style={{ fontSize: 13, color: C.danger }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading || password !== confirm}>
              {loading ? 'Création…' : 'Créer mon compte →'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 20 }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: C.accent, textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </main>
  )
}