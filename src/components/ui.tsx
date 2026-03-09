'use client'
import { ReactNode } from 'react'

const C = {
  bg:      '#0d0d1a',
  card:    'rgba(255,255,255,0.06)',
  border:  'rgba(255,255,255,0.1)',
  accent:  '#6ee7b7',
  accentB: '#3b82f6',
  danger:  '#ff6b8a',
  warn:    '#fbbf24',
  text:    '#f0f0ff',
  muted:   'rgba(255,255,255,0.4)',
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${C.border}`,
      borderRadius: 24,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: C.muted,
      margin: '24px 0 10px',
    }}>
      {children}
    </p>
  )
}

export function StatTile({ icon, value, label, accent }: {
  icon: string; value: string | number; label: string; accent?: boolean
}) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{
        fontSize: 32, fontWeight: 800, lineHeight: 1,
        background: accent ? `linear-gradient(135deg, ${C.accent}, ${C.accentB})` : 'none',
        WebkitBackgroundClip: accent ? 'text' : 'unset',
        WebkitTextFillColor: accent ? 'transparent' : C.text,
        color: accent ? 'transparent' : C.text,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
    </Card>
  )
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct   = Math.min(Math.round((value / max) * 100), 100)
  const color = pct >= 100
    ? 'linear-gradient(90deg, #ff6b8a, #ff2d55)'
    : pct >= 75
    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
    : `linear-gradient(90deg, ${C.accent}, ${C.accentB})`
  return (
    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 99,
        background: color,
        width: pct + '%',
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: pct < 75 ? '0 0 12px rgba(110,231,183,0.4)' : 'none',
      }} />
    </div>
  )
}

export function AlertBanner({ type, title, message }: {
  type: 'danger' | 'warn'; title: string; message: string
}) {
  const isDanger = type === 'danger'
  return (
    <div style={{
      background: isDanger ? 'rgba(255,59,92,0.1)' : 'rgba(251,191,36,0.1)',
      border: `1px solid ${isDanger ? 'rgba(255,59,92,0.3)' : 'rgba(251,191,36,0.3)'}`,
      borderRadius: 16, padding: '14px 18px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{isDanger ? '🚨' : '⚠️'}</span>
      <div>
        <strong style={{ display: 'block', fontSize: 14, color: C.text, marginBottom: 3 }}>{title}</strong>
        <span style={{ fontSize: 12, color: C.muted }}>{message}</span>
      </div>
    </div>
  )
}

export function StatusDot({ status }: { status: 'ok' | 'error' | 'loading' }) {
  const color = status === 'ok' ? C.accent : status === 'error' ? C.danger : C.warn
  return (
    <span className={status === 'ok' ? 'pulse-dot' : status === 'loading' ? 'animate-pulse' : ''}
      style={{
        display: 'inline-block', width: 8, height: 8,
        borderRadius: '50%', background: color, flexShrink: 0,
      }}
    />
  )
}