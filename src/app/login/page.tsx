'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const DEMO_EMAIL = 'demo@demo.fr'
const DEMO_PASSWORD = 'demo123'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [submitting, setSub]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSub(true); setError('')
    const { error } = await login(email, password)
    if (error) { setError(error); setSub(false) }
  }

  async function handleDemoLogin() {
    setSub(true); setError('')
    const { error } = await login(DEMO_EMAIL, DEMO_PASSWORD)
    if (error) { setError(error); setSub(false) }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Card */}
        <div style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 28,
          padding: '48px 32px 40px',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
        }}>

          

          {/* Title */}
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#f0f0ff', margin: '0 0 32px', lineHeight: 1.2 }}>
            Connexion
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Email"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 14,
                padding: '14px 16px',
                color: '#f0f0ff',
                fontSize: 15,
                fontFamily: "'Outfit', sans-serif",
                outline: 'none',
                transition: 'background 0.2s',
              }}
              onFocus={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
              onBlur={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            />

            <input
              type="password"
              value={password}
              onChange={e => setPass(e.target.value)}
              required
              placeholder="Mot de passe"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 14,
                padding: '14px 16px',
                color: '#f0f0ff',
                fontSize: 15,
                fontFamily: "'Outfit', sans-serif",
                outline: 'none',
                transition: 'background 0.2s',
              }}
              onFocus={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
              onBlur={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            />

            {error && (
              <div style={{ background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.4)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#ff9fb6' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0089d9)',
                border: 'none',
                borderRadius: 14,
                padding: '16px',
                color: '#0d0d1a',
                fontSize: 16,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s ease, opacity 0.15s ease',
                opacity: submitting ? 0.8 : 1,
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Inscription link */}
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
            Pas de compte ?{' '}
            <Link href="/register" style={{ color: '#6ee7b7', fontWeight: 600, textDecoration: 'none' }}>
              S'inscrire
            </Link>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Demo button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              padding: '16px',
              color: '#f0f0ff',
              fontSize: 16,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          >
            {submitting ? 'Connexion...' : 'Compte démo'}
          </button>

        </div>

      </div>
    </main>
  )
}