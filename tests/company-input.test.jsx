import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompanyInputPage from '../src/pages/CompanyInputPage'
import { COMPANY_MENUS } from '../src/data/companyInputs'
import Sidebar from '../src/components/Sidebar'
import Topbar from '../src/components/Topbar'
import { navItems } from '../src/data/sidebarNavItems'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

const renderPage = (menu = COMPANY_MENUS[0], props = {}) => render(
  <CompanyInputPage activeNav={menu.key} role="company" {...props} />,
)

const openForm = () => userEvent.setup().click(screen.getByRole('button', { name: 'Tambah' }))

function fillRequired(menu) {
  for (const field of menu.sections.flatMap((section) => section.fields)) {
    if (!field.required) continue
    const input = screen.getByLabelText(field.label, { exact: false })
    const value = field.options?.[0] || (field.type === 'email' ? 'qa@example.test'
      : field.type === 'date' ? (field.key === 'end_date' ? '2099-12-31' : '2099-01-01')
        : field.type === 'number' ? '2' : 'Isian pengujian perusahaan')
    fireEvent.change(input, { target: { value } })
  }
}

describe('company input UI', () => {
  it('restricts the five requested submenu entries to the company role', () => {
    const menu = navItems.find((item) => item.key === 'company')
    expect(menu.roles).toEqual(['company'])
    expect(menu.subItems).toEqual(COMPANY_MENUS.map(({ key, label }) => ({ key, label })))
    expect(COMPANY_MENUS[0]).toMatchObject({ key: 'companyInternships', label: 'Kesempatan Magang', previewTitle: 'Judul kesempatan magang' })
    expect(COMPANY_MENUS.map(({ label }) => label)).toEqual([
      'Kesempatan Magang', 'Investasi', 'Lowongan Pekerjaan', 'Kolaborasi', 'Proyek',
    ])
  })

  it.each(COMPANY_MENUS)('opens an empty list with an add button for $label', async (menu) => {
    renderPage(menu)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(menu.label)
    expect(screen.queryByRole('form')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Jenis peluang perusahaan' })).toBeNull()
    expect(screen.getByText(new RegExp(`Belum ada ${menu.label.toLowerCase()}`))).toBeTruthy()
    expect(screen.getByText(`0 dari 0 draf`)).toBeTruthy()
    await openForm()
    expect(screen.getByRole('form')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(`Tambah ${menu.label}`)
  })

  it.each(COMPANY_MENUS)('validates, then keeps a saved draft in the list for $label', async (menu) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const user = userEvent.setup()
    renderPage(menu)
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    await user.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(screen.getByRole('alert').textContent).toMatch(/Lengkapi/)
    expect(document.activeElement.id).toBe(`company-${menu.key}-title`)
    fillRequired(menu)
    fireEvent.change(screen.getByLabelText(menu.sections[0].fields[0].label, { exact: false }), { target: { value: 'Draf uji pertama' } })
    await user.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(screen.getByRole('status').textContent).toMatch(new RegExp(`${menu.label} berhasil ditambahkan`))
    expect(screen.queryByRole('form')).toBeNull()
    const table = screen.getByRole('table', { name: `Daftar ${menu.label}` })
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    expect(within(table).getByText('Draf uji pertama')).toBeTruthy()
    expect(screen.getByText('1 dari 1 draf')).toBeTruthy()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
  })

  it.each(COMPANY_MENUS)('keeps unresolved validation errors while editing $label', (menu) => {
    renderPage(menu)
    fireEvent.click(screen.getByRole('button', { name: 'Tambah' }))
    const fields = menu.sections.flatMap((section) => section.fields)
    const title = screen.getByLabelText(fields.find((field) => field.key === 'title').label, { exact: false })
    const email = screen.getByLabelText('Email narahubung', { exact: false })
    expect(screen.queryByRole('alert')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    fireEvent.change(title, { target: { value: 'Peluang perusahaan' } })
    expect(title.getAttribute('aria-invalid')).toBeNull()
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByRole('alert')).toBeTruthy()
    fireEvent.change(email, { target: { value: 'qa@example,com.test' } })
    expect(email.getAttribute('aria-invalid')).toBe('true')
    fireEvent.change(email, { target: { value: 'qa@example.test' } })
    expect(email.getAttribute('aria-invalid')).toBeNull()
    expect(screen.getByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Kosongkan Form' }))
    expect(title.value).toBe('')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('edits and deletes a saved draft without touching other categories', async () => {
    const first = COMPANY_MENUS[0]
    const second = COMPANY_MENUS[1]
    const user = userEvent.setup()
    const { rerender } = renderPage(first)
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    fillRequired(first)
    await user.click(screen.getByRole('button', { name: 'Simpan draf' }))
    fireEvent.click(screen.getByRole('button', { name: `Edit Isian pengujian perusahaan` }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(`Ubah ${first.label}`)
    fireEvent.change(screen.getByLabelText('Judul lowongan', { exact: false }), { target: { value: 'Magang Frontend' } })
    await user.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(screen.getByRole('status').textContent).toMatch(/berhasil diperbarui/)
    expect(screen.getByRole('table', { name: `Daftar ${first.label}` })).toBeTruthy()
    expect(screen.getByText('Magang Frontend')).toBeTruthy()
    rerender(<CompanyInputPage activeNav={second.key} role="company" />)
    expect(screen.getByText('0 dari 0 draf')).toBeTruthy()
    rerender(<CompanyInputPage activeNav={first.key} role="company" />)
    expect(screen.getByText('Magang Frontend')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Hapus Magang Frontend' }))
    expect(screen.getByRole('alertdialog').textContent).toMatch(/Hapus Draf/)
    await user.click(screen.getByRole('button', { name: 'Ya, Hapus Draf' }))
    expect(screen.getByRole('status').textContent).toMatch(/berhasil dihapus/)
    expect(screen.getByText('0 dari 0 draf')).toBeTruthy()
  })

  it('updates the preview while the form is open and cancels without saving', async () => {
    const first = COMPANY_MENUS[0]
    const user = userEvent.setup()
    renderPage(first)
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    fireEvent.change(screen.getByLabelText('Judul lowongan', { exact: false }), { target: { value: 'Magang Frontend' } })
    expect(within(screen.getByRole('region', { name: 'Pratinjau peluang' })).getByText('Magang Frontend')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.getByText('0 dari 0 draf')).toBeTruthy()
    expect(screen.queryByText('Magang Frontend')).toBeNull()
  })

  it('filters the list by search', async () => {
    const first = COMPANY_MENUS[0]
    const user = userEvent.setup()
    renderPage(first)
    for (const title of ['Magang Frontend', 'Magang Backend']) {
      await user.click(screen.getByRole('button', { name: 'Tambah' }))
      fillRequired(first)
      fireEvent.change(screen.getByLabelText('Judul lowongan', { exact: false }), { target: { value: title } })
      await user.click(screen.getByRole('button', { name: 'Simpan draf' }))
    }
    fireEvent.change(screen.getByRole('searchbox', { name: `Cari ${first.label}` }), { target: { value: 'backend' } })
    expect(screen.getByText('1 dari 2 draf')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: `Cari ${first.label}` }), { target: { value: 'tidak-ada' } })
    expect(screen.getByText('Tidak ada draf yang cocok dengan pencarian.')).toBeTruthy()
  })

  it.each(['-1', '2.5', '1e2', '9007199254740992'])('rejects invalid whole numbers without changing input %s', async (raw) => {
    renderPage()
    await openForm()
    const input = screen.getByLabelText('Jumlah peserta', { exact: false })
    fireEvent.change(input, { target: { value: raw } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(input.value).toBe(raw)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
  })

  it('rejects reversed dates and salary ranges', async () => {
    const jobs = COMPANY_MENUS.find((menu) => menu.key === 'companyJobs')
    const user = userEvent.setup()
    renderPage(jobs)
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    fillRequired(jobs)
    fireEvent.change(screen.getByLabelText('Gaji minimum', { exact: false }), { target: { value: '8000000' } })
    fireEvent.change(screen.getByLabelText('Gaji maksimum', { exact: false }), { target: { value: '4000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(screen.getByLabelText('Gaji maksimum', { exact: false }).getAttribute('aria-invalid')).toBe('true')
    cleanup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    fillRequired(COMPANY_MENUS[0])
    fireEvent.change(screen.getByLabelText('Tanggal mulai', { exact: false }), { target: { value: '2099-02-01' } })
    fireEvent.change(screen.getByLabelText('Batas pendaftaran', { exact: false }), { target: { value: '2099-03-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(screen.getByLabelText('Tanggal mulai', { exact: false }).getAttribute('aria-invalid')).toBe('true')
  })

  it.each(['guest', 'admin', 'super_admin', 'operator', null, { name: 'guest' }, { name: 'admin' }])('blocks unauthorized access for %j', (role) => {
    renderPage(COMPANY_MENUS[0], { role })
    expect(screen.queryByRole('form')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tambah' })).toBeNull()
    expect(screen.getByText('Menu perusahaan tidak tersedia untuk akun ini.')).toBeTruthy()
  })

  it('accepts the existing object role shape and blocks unknown categories', async () => {
    const { rerender } = renderPage(COMPANY_MENUS[0], { role: { name: 'company' } })
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeTruthy()
    rerender(<CompanyInputPage activeNav="unknown" role="company" />)
    expect(screen.queryByRole('button', { name: 'Tambah' })).toBeNull()
  })

  it.each(['company', { name: 'company' }])('opens every submenu for company role %j and resolves matching breadcrumbs', async (role) => {
    const setActiveNav = vi.fn()
    const setSidebarOpen = vi.fn()
    const { rerender } = render(<Sidebar user={{ role }} activeNav="dashboard" setActiveNav={setActiveNav} sidebarOpen={false} setSidebarOpen={setSidebarOpen} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Input Company' }))
    expect(screen.getByRole('button', { name: 'Input Company' }).getAttribute('aria-expanded')).toBe('true')
    for (const menu of COMPANY_MENUS) {
      await user.click(screen.getByRole('button', { name: menu.label }))
      expect(setActiveNav).toHaveBeenLastCalledWith(menu.key)
    }
    expect(setSidebarOpen).toHaveBeenLastCalledWith(false)
    for (const menu of COMPANY_MENUS) {
      rerender(<Topbar activeNav={menu.key} setSidebarOpen={() => {}} />)
      expect(screen.getByText(`Input Company / ${menu.label}`)).toBeTruthy()
    }
  })

  it.each(['admin', 'super_admin', 'operator', 'guest', { name: 'admin' }])('hides the company menu from other role %j', (role) => {
    render(<Sidebar user={{ role }} activeNav="dashboard" setActiveNav={() => {}} sidebarOpen={false} setSidebarOpen={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Input Company', exact: true })).toBeNull()
    for (const menu of COMPANY_MENUS) {
      expect(screen.queryByRole('button', { name: menu.label, exact: true })).toBeNull()
    }
  })
})
