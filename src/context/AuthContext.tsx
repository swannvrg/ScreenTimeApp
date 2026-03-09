'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  scriptUrl: string | null
  isAuthenticated: boolean
  login: (url: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [scriptUrl, setScriptUrl] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('st_url')
    const auth   = sessionStorage.getItem('st_auth')
    if (stored && auth === '1') {
      setScriptUrl(stored)
      setIsAuthenticated(true)
    }
  }, [])

  function login(url: string, password: string): boolean {
    const secret = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD
    if (!secret) {
      console.error('NEXT_PUBLIC_DASHBOARD_PASSWORD non défini dans .env.local')
      return false
    }
    if (password !== secret) return false
    sessionStorage.setItem('st_url', url)
    sessionStorage.setItem('st_auth', '1')
    setScriptUrl(url)
    setIsAuthenticated(true)
    return true
  }

  function logout() {
    sessionStorage.clear()
    setScriptUrl(null)
    setIsAuthenticated(false)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ scriptUrl, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}