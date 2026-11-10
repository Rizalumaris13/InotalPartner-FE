import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Sidebar from '../src/components/Sidebar'

describe('dashboard navigation compatibility', () => {
  it('auto-opens a nested editor path while still allowing manual collapse', () => {
    const props = {
      user: { role: 'super_admin', full_name: 'Fixture Admin' },
      activeNav: 'createVideoHighlight',
      sidebarOpen: true,
      setSidebarOpen: vi.fn(),
      setActiveNav: vi.fn(),
      onNavigate: vi.fn(),
    }
    const { rerender } = render(<Sidebar {...props} />)
    expect(screen.getByRole('button', { name: 'Tambah Poin Video', exact: true })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Poin Video', exact: true }))
    expect(screen.queryByRole('button', { name: 'Tambah Poin Video', exact: true })).toBeNull()
    rerender(<Sidebar {...props} activeNav="listVideoHighlight" />)
    expect(screen.getByRole('button', { name: 'Daftar Poin Video', exact: true })).toBeTruthy()
  })

  it('opens the team group for the non-menu member editor alias', () => {
    render(<Sidebar user={{ role: 'admin' }} activeNav="formAboutMember" sidebarOpen setSidebarOpen={() => {}} setActiveNav={() => {}} />)
    expect(screen.getByRole('button', { name: 'List Tim Kami', exact: true })).toBeTruthy()
  })
})
