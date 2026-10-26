import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../src/components/Sidebar'

test('admin membuka menu Kemitraan dari sidebar', async () => {
  const setActiveNav = vi.fn()
  const setSidebarOpen = vi.fn()
  render(
    <Sidebar
      user={{ role: 'admin', full_name: 'Admin Pengujian' }}
      activeNav="dashboard"
      setActiveNav={setActiveNav}
      sidebarOpen={false}
      setSidebarOpen={setSidebarOpen}
    />,
  )

  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Kemitraan' }))

  expect(setActiveNav).toHaveBeenCalledWith('partners')
  expect(setSidebarOpen).toHaveBeenCalledWith(false)
})
