import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../src/App'

vi.mock('../src/pages/LandingPage', () => ({ default: ({ onNavigate }) => (
  <>
    <p>route:landing</p>
    <button onClick={() => onNavigate('tentang')}>Buka tentang</button>
    <button onClick={() => onNavigate('dashboard')}>Buka dashboard</button>
    <button onClick={() => onNavigate('berita/kolaborasi')}>Buka berita</button>
  </>
) }))
vi.mock('../src/pages/LoginPage', () => ({ default: () => <p>route:login</p> }))
vi.mock('../src/pages/RegisterPage', () => ({ default: () => <p>route:register</p> }))
vi.mock('../src/pages/DashboardPage', () => ({ default: () => <p>route:dashboard</p> }))
vi.mock('../src/pages/FrontPage/TentangPage', () => ({ default: () => <p>route:tentang</p> }))
vi.mock('../src/pages/FrontPage/ProgramPage', () => ({ default: () => <p>route:program</p> }))
vi.mock('../src/pages/FrontPage/EventPage', () => ({ default: () => <p>route:event</p> }))
vi.mock('../src/pages/FrontPage/BeritaPage', () => ({ default: () => <p>route:berita</p> }))
vi.mock('../src/pages/FrontPage/DetailBeritaPage', () => ({ default: ({ slug }) => <p>route:detail:{slug}</p> }))
vi.mock('../src/pages/FrontPage/ArtikelPage', () => ({ default: () => <p>route:artikel</p> }))
vi.mock('../src/pages/FrontPage/PartnershipPage', () => ({ default: () => <p>route:partnership</p> }))
vi.mock('../src/pages/FrontPage/KontakPage', () => ({ default: () => <p>route:kontak</p> }))

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

function mountApp(url = '/') {
  window.history.replaceState({}, '', url)
  return render(<StrictMode><App /></StrictMode>)
}

describe('app routing contract', () => {
  it.each(['login', 'register', 'tentang', 'program', 'event', 'berita', 'artikel', 'partnership', 'kontak'])('opens the existing %s hash route', (page) => {
    mountApp(`/#${page}`)
    expect(screen.getByText(`route:${page}`)).toBeTruthy()
  })

  it.each(['/', '/#landing', '/#unknown'])('falls back to landing for %s', (url) => {
    mountApp(url)
    expect(screen.getByText('route:landing')).toBeTruthy()
  })

  it.each([
    ['/#berita/kolaborasi%20digital%2F2026', 'kolaborasi digital/2026'],
    ['/#berita/%E0%A4%A', '%E0%A4%A'],
  ])('preserves decoded or malformed detail slugs in %s', (url, slug) => {
    mountApp(url)
    expect(screen.getByText(`route:detail:${slug}`)).toBeTruthy()
  })

  it('redirects unauthenticated dashboard entry to login', () => {
    mountApp('/#dashboard')
    expect(screen.getByText('route:login')).toBeTruthy()
    expect(window.location.hash).toBe('#login')
  })

  it('keeps authenticated dashboard entry', () => {
    localStorage.setItem('inotal_token', 'routing-fixture-not-a-real-token')
    mountApp('/#dashboard')
    expect(screen.getByText('route:dashboard')).toBeTruthy()
  })

  it('navigates through page callbacks and keeps scroll and hash behavior', () => {
    mountApp()
    fireEvent.click(screen.getByRole('button', { name: 'Buka tentang' }))
    expect(screen.getByText('route:tentang')).toBeTruthy()
    expect(window.location.hash).toBe('#tentang')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('protects dashboard navigation without changing the early-return scroll behavior', () => {
    mountApp()
    fireEvent.click(screen.getByRole('button', { name: 'Buka dashboard' }))
    expect(screen.getByText('route:login')).toBeTruthy()
    expect(window.location.hash).toBe('#login')
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('handles hash history events and rechecks a removed session', () => {
    localStorage.setItem('inotal_token', 'routing-fixture-not-a-real-token')
    mountApp('/#dashboard')
    act(() => {
      window.history.pushState({}, '', '/#event')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByText('route:event')).toBeTruthy()
    act(() => {
      localStorage.removeItem('inotal_token')
      window.history.pushState({}, '', '/#dashboard')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByText('route:login')).toBeTruthy()
  })

  it.each(['#login', '#dashboard'])('accepts an OAuth callback starting at %s under StrictMode', async (hash) => {
    mountApp(`/auth/callback?token=oauth-fixture-not-a-real-token${hash}`)
    await waitFor(() => expect(screen.getByText('route:dashboard')).toBeTruthy())
    expect(localStorage.getItem('inotal_token')).toBe('oauth-fixture-not-a-real-token')
    expect(window.location.pathname).toBe('/')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#dashboard')
  })

  it.each(['#tentang', '#login'])('keeps a tokenless OAuth callback at login from %s', async (hash) => {
    mountApp(`/auth/callback?error=cancelled${hash}`)
    await waitFor(() => expect(screen.getByText('route:login')).toBeTruthy())
    expect(window.location.pathname).toBe('/auth/callback')
    expect(window.location.search).toBe('?error=cancelled')
    expect(window.location.hash).toBe('#login')
  })
})
