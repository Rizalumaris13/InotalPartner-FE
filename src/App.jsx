import { useState, useEffect, useCallback } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TentangPage from './pages/FrontPage/TentangPage'
import ProgramPage from './pages/FrontPage/ProgramPage'
import EventPage from './pages/FrontPage/EventPage'
import BeritaPage from './pages/FrontPage/BeritaPage'
import DetailBeritaPage from './pages/FrontPage/DetailBeritaPage'
import ArtikelPage from './pages/FrontPage/ArtikelPage'
import PartnershipPage from './pages/FrontPage/PartnershipPage'
import KontakPage from './pages/FrontPage/KontakPage'

const PROTECTED_PAGES = ['dashboard']

const ALL_PAGES = [
  'login',
  'register',
  'dashboard',
  'tentang',
  'program',
  'event',
  'berita',
  'artikel',
  'partnership',
  'kontak',
]

/**
 * Hash route yang didukung:
 * #                 -> landing
 * #berita           -> daftar berita
 * #berita/contoh-slug -> detail berita
 */
function getRouteFromHash() {
  const rawHash = window.location.hash.replace(/^#/, '').trim()
  const decodedHash = (() => {
    try {
      return decodeURIComponent(rawHash)
    } catch {
      return rawHash
    }
  })()

  if (!decodedHash) {
    return { page: 'landing', slug: null }
  }

  const [route, ...slugParts] = decodedHash.split('/')
  const slug = slugParts.join('/')

  if (route === 'berita' && slug) {
    return { page: 'detailBerita', slug }
  }

  if (ALL_PAGES.includes(route)) {
    return { page: route, slug: null }
  }

  return { page: 'landing', slug: null }
}

function requiresLogin(page) {
  const token = localStorage.getItem('inotal_token')
  return PROTECTED_PAGES.includes(page) && !token
}

function getInitialRoute() {
  const route = getRouteFromHash()

  if (requiresLogin(route.page)) {
    window.location.hash = 'login'
    return { page: 'login', slug: null }
  }

  return route
}

function App() {
  const [route, setRoute] = useState(getInitialRoute)

  const navigate = useCallback((target) => {
    const safeTarget = String(target || 'landing').replace(/^#/, '')
    const [targetPage] = safeTarget.split('/')

    if (requiresLogin(targetPage)) {
      window.location.hash = 'login'
      setRoute({ page: 'login', slug: null })
      return
    }

    // Perbarui state dan hash agar URL bisa dibuka langsung,
    // di-refresh, serta mendukung tombol Back/Forward browser.
    setRoute(
      targetPage === 'berita' && safeTarget.includes('/')
        ? { page: 'detailBerita', slug: safeTarget.slice('berita/'.length) }
        : { page: targetPage === 'landing' ? 'landing' : targetPage, slug: null }
    )

    window.location.hash = safeTarget === 'landing' ? '' : safeTarget
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  // Pasang listener dulu: callback OAuth juga mengganti hash.
  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = getRouteFromHash()

      if (requiresLogin(nextRoute.page)) {
        window.location.hash = 'login'
        setRoute({ page: 'login', slug: null })
        return
      }

      setRoute(nextRoute)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Tangani callback Google OAuth.
  useEffect(() => {
    if (window.location.pathname !== '/auth/callback') return

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('inotal_token', token)
      window.history.replaceState({}, '', '/')
      window.location.hash = 'dashboard'
    } else {
      window.location.hash = 'login'
    }
  }, [])

  const { page, slug } = route

  if (page === 'login') return <LoginPage onNavigate={navigate} />
  if (page === 'register') return <RegisterPage onNavigate={navigate} />
  if (page === 'dashboard') return <DashboardPage onNavigate={navigate} />
  if (page === 'tentang') return <TentangPage onNavigate={navigate} />
  if (page === 'program') return <ProgramPage onNavigate={navigate} />
  if (page === 'event') return <EventPage onNavigate={navigate} />
  if (page === 'berita') return <BeritaPage onNavigate={navigate} />
  if (page === 'detailBerita') {
    return <DetailBeritaPage onNavigate={navigate} slug={slug} />
  }
  if (page === 'artikel') return <ArtikelPage onNavigate={navigate} />
  if (page === 'partnership') return <PartnershipPage onNavigate={navigate} />
  if (page === 'kontak') return <KontakPage onNavigate={navigate} />

  return <LandingPage onNavigate={navigate} />
}

export default App
