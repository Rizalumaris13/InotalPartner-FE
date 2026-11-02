import { expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../src/components/Sidebar'
import { navItems } from '../src/components/Sidebar'

const pages = [
  ['Tentang', 'bannerTentang'],
  ['Event', 'bannerEvent'],
  ['Berita', 'bannerBerita'],
  ['Artikel', 'bannerArtikel'],
  ['Kontak', 'bannerKontak'],
]

test('Banner Halaman memiliki lima CRUD terpisah di luar Settings', () => {
  const banner = navItems.find((item) => item.key === 'pageBanners')
  expect(banner).toBeDefined()
  expect(banner.roles).toEqual(['super_admin', 'admin'])
  expect(banner.subItems.map(({ label, key }) => [label, key])).toEqual(pages)
  const settings = navItems.find((item) => item.key === 'settings')
  expect(settings.subItems?.some((item) => item.key === 'pageBanners')).not.toBe(true)
  expect(navItems[navItems.findIndex((item) => item.key === 'contact') - 1].key).toBe('post')
})

test.each(pages)('admin dapat membuka CRUD banner %s', async (label, key) => {
  const navigate = vi.fn()
  const closeSidebar = vi.fn()
  render(
    <Sidebar
      user={{ role: 'admin', full_name: 'Admin Uji' }}
      activeNav="dashboard"
      setActiveNav={navigate}
      sidebarOpen={false}
      setSidebarOpen={closeSidebar}
    />,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Banner Halaman' }))
  await user.click(within(screen.getByRole('group', { name: 'Banner Halaman' })).getByRole('button', { name: label }))
  expect(navigate).toHaveBeenCalledWith(key)
  expect(closeSidebar).toHaveBeenCalledWith(false)
})

test.each(['operator', 'guest'])('menu Banner Halaman tidak tersedia untuk %s', (role) => {
  render(
    <Sidebar
      user={{ role, full_name: 'Pengguna Uji' }}
      activeNav="dashboard"
      setActiveNav={() => {}}
      sidebarOpen={false}
      setSidebarOpen={() => {}}
    />,
  )
  expect(screen.queryByRole('button', { name: 'Banner Halaman' })).toBeNull()
})
