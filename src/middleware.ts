import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PROTECTED = ['/', '/log', '/settings']
const PUBLIC    = ['/login', '/signup', '/setup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ignore les routes API et assets
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/icons')) {
    return NextResponse.next()
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Récupère la session depuis le cookie
  const accessToken = req.cookies.get('sb-access-token')?.value
    || req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value

  if (!accessToken) {
    // Pas connecté → redirige vers login si page protégée
    if (PROTECTED.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // Connecté → vérifie si setup complet
  const { data: { user } } = await supabase.auth.getUser(accessToken)

  if (!user) {
    if (PROTECTED.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // Vérifie setup_complete
  const { data: config } = await supabase
    .from('config')
    .select('setup_complete')
    .eq('user_id', user.id)
    .single()

  const setupComplete = config?.setup_complete ?? false

  // Connecté + setup incomplet → force /setup sauf si déjà sur /setup ou pages publiques
  if (!setupComplete && !PUBLIC.includes(pathname)) {
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  // Connecté + setup complet → redirige hors des pages publiques
  if (setupComplete && PUBLIC.includes(pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}