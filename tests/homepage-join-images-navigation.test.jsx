import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../src/components/Sidebar'
import Topbar from '../src/components/Topbar'

test('admin membuka Gambar Kolase di Home Page, bukan di Banner Halaman', async () => {
  const navigate = vi.fn()
  render(<>
    <Sidebar user={{ role: 'admin', full_name: 'Admin Uji' }} activeNav="dashboard"
      setActiveNav={navigate} sidebarOpen={false} setSidebarOpen={() => {}} />
    <Topbar activeNav="homeJoinImages" setSidebarOpen={() => {}} />
  </>)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Home Page', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Mengapa Bergabung', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Gambar Kolase', exact: true }))
  expect(navigate).toHaveBeenCalledWith('homeJoinImages')
  expect(screen.getByText('Home Page / Mengapa Bergabung / Gambar Kolase')).not.toBeNull()
  expect(screen.getByRole('button', { name: 'Banner Halaman' }).getAttribute('aria-expanded')).toBe('false')
})
