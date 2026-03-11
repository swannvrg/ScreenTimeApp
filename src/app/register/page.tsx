'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function RegisterPage() {
  const { register, user } = useAuth()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPass]     = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSub]    = useState(false)



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6)  { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setSub(true)
    const { error } = await register(email, password)
    if (error) { setError(error); setSub(false) }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ position: 'fixed', top: '15%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #6ee7b7, #3b82f6)', marginBottom: 20, fontSize: 28 }}>📱</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, color: '#f0f0ff' }}>
            Screen<span style={{ background: 'linear-gradient(135deg, #6ee7b7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Time</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Gamification Dashboard</p>
        </div>

        {/* Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0ff', marginBottom: 24 }}>Créer un compte</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Email</label>
              <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="toi@email.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Mot de passe</label>
              <input className="field" type="password" value={password} onChange={e => setPass(e.target.value)} required placeholder="Min. 6 caractères" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Confirmer le mot de passe</label>
              <input className="field" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" />
              {/* Indicateur de correspondance */}
              {confirm.length > 0 && (
                <p style={{ fontSize: 12, marginTop: 6, color: password === confirm ? '#6ee7b7' : '#ff8fa3' }}>
                  {password === confirm ? '✓ Les mots de passe correspondent' : '✗ Ne correspondent pas'}
                </p>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff8fa3' }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={submitting || password !== confirm} style={{ marginTop: 4 }}>
              {submitting ? '...' : 'Créer mon compte →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#6ee7b7', fontWeight: 600, textDecoration: 'none' }}>
              Se connecter
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}