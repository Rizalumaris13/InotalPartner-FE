import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../src/components/Sidebar'
import { navItems } from '../src/data/sidebarNavItems'

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

test('Memberdayakan Bisnis menggantikan Kartu Tentang setelah Kemitraan dan hanya untuk admin', () => {
  const index = navItems.findIndex((item) => item.key === 'aboutEmpoweringGroup')
  expect(navItems[index - 1].key).toBe('partners')
  expect(navItems[index + 1].key).toBe('users')
  expect(navItems[index].roles).toEqual(['admin', 'super_admin'])
  expect(navItems[index].subItems).toEqual([
    { key: 'aboutEmpowering', label: 'Pengaturan Bagian' },
    { key: 'aboutCards', label: 'Kelola Kartu' },
  ])
  expect(navItems.some((item) => item.key === 'aboutCards')).toBe(false)
})

test.each(['operator', 'guest'])('menu Memberdayakan Bisnis tidak tersedia bagi %s', (role) => {
  render(
    <Sidebar
      user={{ role, full_name: 'Pengguna Pengujian' }}
      activeNav="dashboard"
      setActiveNav={() => {}}
      sidebarOpen={false}
      setSidebarOpen={() => {}}
    />,
  )
  expect(screen.queryByRole('button', { name: 'Kartu Tentang' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Memberdayakan Bisnis' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Pengaturan Bagian' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Kelola Kartu' })).toBeNull()
})
