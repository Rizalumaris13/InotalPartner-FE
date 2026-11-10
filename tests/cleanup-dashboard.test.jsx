import { useEffect } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import DashboardPage from '../src/pages/DashboardPage'

const probe = vi.hoisted(() => ({ pages: {}, user: null }))

// Kontrak antarhalaman diuji tanpa efek API atau lifecycle form anak.
function PageProbe({ name, props }) {
  useEffect(() => {
    probe.pages[name] = props
  }, [name, props])
  return <h2>{name}</h2>
}

function EditorProbe({ name, props, value }) {
  return (
    <section aria-label={name}>
      <PageProbe name={name} props={props} />
      <output aria-label="Pilihan editor">{JSON.stringify(value)}</output>
      <input aria-label="Draf editor" defaultValue="" />
    </section>
  )
}

vi.mock('../src/hooks/useAuth', () => ({ useAuth: () => ({ user: probe.user }) }))
vi.mock('../src/components/Sidebar', () => ({
  default: (props) => <PageProbe name="Sidebar" props={props} />,
}))
vi.mock('../src/components/Topbar', () => ({
  default: (props) => (
    <>
      <PageProbe name="Topbar" props={props} />
      <output aria-label="Navigasi aktif">{props.activeNav}</output>
    </>
  ),
}))
vi.mock('../src/components/MonthlyActivityChart', () => ({ default: () => null }))
vi.mock('../src/components/ServiceDistributionChart', () => ({ default: () => null }))
vi.mock('../src/components/ActivePartnersList', () => ({ default: () => null }))
vi.mock('../src/components/CollaborationProjectsList', () => ({ default: () => null }))
vi.mock('../src/components/PlaceholderPage', () => ({
  default: (props) => <PageProbe name="PlaceholderPage" props={props} />,
}))
vi.mock('../src/pages/ChangePasswordPage', () => ({
  default: (props) => <PageProbe name="ChangePasswordPage" props={props} />,
}))
vi.mock('../src/pages/UserPage', () => ({
  default: (props) => <PageProbe name="UserPage" props={props} />,
}))
vi.mock('../src/pages/KontakInboxPage', () => ({
  default: (props) => <PageProbe name="KontakInboxPage" props={props} />,
}))
vi.mock('../src/pages/KemitraanPage', () => ({
  default: (props) => <PageProbe name="KemitraanPage" props={props} />,
}))
vi.mock('../src/pages/KartuTentangPage', () => ({
  default: (props) => <PageProbe name="KartuTentangPage" props={props} />,
}))
vi.mock('../src/pages/AboutIntroPage', () => ({
  default: (props) => <PageProbe name="AboutIntroPage" props={props} />,
}))
vi.mock('../src/pages/PageBannerPage', () => ({
  default: (props) => <EditorProbe name="PageBannerPage" props={props} value={props.pageKey} />,
}))
vi.mock('../src/pages/HomepageJoinImagesPage', () => ({
  default: (props) => <PageProbe name="HomepageJoinImagesPage" props={props} />,
}))
vi.mock('../src/pages/HomepageJoinCardsPage', () => ({
  default: (props) => <PageProbe name="HomepageJoinCardsPage" props={props} />,
}))
vi.mock('../src/pages/HomepageServicesPage', () => ({
  default: (props) => <PageProbe name="HomepageServicesPage" props={props} />,
}))
vi.mock('../src/pages/CreatePost', () => ({
  default: (props) => <EditorProbe name="CreatePost" props={props} value={props.editingPost} />,
}))
vi.mock('../src/pages/PostListPage', () => ({
  default: (props) => <PageProbe name="PostListPage" props={props} />,
}))
vi.mock('../src/pages/CreateSlider', () => ({
  default: (props) => <EditorProbe name="CreateSlider" props={props} value={props.editingSlider} />,
}))
vi.mock('../src/pages/ListSliderPage', () => ({
  default: (props) => <PageProbe name="ListSliderPage" props={props} />,
}))
vi.mock('../src/pages/FormTestimonialPage', () => ({
  default: (props) => <EditorProbe name="FormTestimonialPage" props={props} value={props.editingTestimonial} />,
}))
vi.mock('../src/pages/ListTestimonialPage', () => ({
  default: (props) => <PageProbe name="ListTestimonialPage" props={props} />,
}))
vi.mock('../src/pages/CreateAboutPage', () => ({
  default: (props) => <PageProbe name="CreateAboutPage" props={props} />,
}))
vi.mock('../src/pages/ListAboutPage', () => ({
  default: (props) => <PageProbe name="ListAboutPage" props={props} />,
}))
vi.mock('../src/pages/FormTeamMemberPage', () => ({
  default: (props) => <EditorProbe name="FormTeamMemberPage" props={props} value={props.editingMember} />,
}))
vi.mock('../src/pages/FormVideoPage', () => ({
  default: (props) => <EditorProbe name="FormVideoPage" props={props} value={props.editingVideo} />,
}))
vi.mock('../src/pages/ListVideoPage', () => ({
  default: (props) => <PageProbe name="ListVideoPage" props={props} />,
}))
vi.mock('../src/pages/FormVideoHighlightPage', () => ({
  default: (props) => <EditorProbe name="FormVideoHighlightPage" props={props} value={props.editingHighlight} />,
}))
vi.mock('../src/pages/ListVideoHighlightPage', () => ({
  default: (props) => <PageProbe name="ListVideoHighlightPage" props={props} />,
}))
vi.mock('../src/pages/FormFAQPage', () => ({
  default: (props) => <EditorProbe name="FormFAQPage" props={props} value={props.editingFAQ} />,
}))
vi.mock('../src/pages/ListFAQPage', () => ({
  default: (props) => <PageProbe name="ListFAQPage" props={props} />,
}))
vi.mock('../src/pages/FormVideoSettingPage', () => ({
  default: (props) => <PageProbe name="FormVideoSettingPage" props={props} />,
}))

const flows = [
  { kind: 'post', list: 'PostListPage', listRoute: 'listPost', form: 'CreatePost', formRoute: 'createPost', selection: 'editingPost', finish: 'onFinishEdit', add: false, openList: false },
  { kind: 'slider', list: 'ListSliderPage', listRoute: 'listSlider', form: 'CreateSlider', formRoute: 'createSlider', selection: 'editingSlider', finish: 'onFinishEdit', add: false, openList: true },
  { kind: 'testimonial', list: 'ListTestimonialPage', listRoute: 'listTestimonial', form: 'FormTestimonialPage', formRoute: 'createTestimonial', selection: 'editingTestimonial', finish: 'onFinish', add: true, openList: true },
  { kind: 'member', list: 'ListAboutPage', listRoute: 'listAbout', form: 'FormTeamMemberPage', formRoute: 'formAboutMember', selection: 'editingMember', finish: 'onFinish', add: true, openList: true },
  { kind: 'video', list: 'ListVideoPage', listRoute: 'listVideo', form: 'FormVideoPage', formRoute: 'createVideo', selection: 'editingVideo', finish: 'onFinish', add: true, openList: true },
  { kind: 'highlight', list: 'ListVideoHighlightPage', listRoute: 'listVideoHighlight', form: 'FormVideoHighlightPage', formRoute: 'createVideoHighlight', selection: 'editingHighlight', finish: 'onFinish', add: true, openList: true },
  { kind: 'faq', list: 'ListFAQPage', listRoute: 'listFAQ', form: 'FormFAQPage', formRoute: 'createFAQ', selection: 'editingFAQ', finish: 'onFinish', add: true, openList: true },
]
const memberFlow = flows.find(({ kind }) => kind === 'member')
const record = { id: 41, title: 'Record uji', nested: { keep: true } }

beforeEach(() => {
  probe.pages = {}
  probe.user = { role: 'admin', full_name: 'Admin Uji' }
})

function invoke(page, callback, ...args) {
  act(() => probe.pages[page][callback](...args))
}

function navigate(route) {
  invoke('Sidebar', 'setActiveNav', route)
}

function expectRoute(route) {
  expect(screen.getByLabelText('Navigasi aktif').textContent).toBe(route)
  expect(probe.pages.Sidebar.activeNav).toBe(route)
}

function edit(flow, value = record, postType = 'berita') {
  const args = flow.kind === 'post' ? [postType, value] : [value]
  invoke(flow.list, 'onEdit', ...args)
}

function expectSelection(flow, value, postType = 'berita') {
  const actual = probe.pages[flow.form][flow.selection]
  if (flow.kind === 'post' && value !== null) {
    expect(actual).toEqual({ postType, post: value })
    expect(actual.post).toBe(value)
  } else {
    expect(actual).toBe(value)
  }
  expect(screen.getByLabelText('Pilihan editor').textContent).toBe(JSON.stringify(actual))
}

function fillDraft() {
  const input = screen.getByLabelText('Draf editor')
  fireEvent.change(input, { target: { value: 'Draf belum disimpan' } })
  return input
}

test.each(flows)('$kind: daftar, edit, selesai, dan buat baru memakai kontrak yang sama', (flow) => {
  render(<DashboardPage />)
  navigate(flow.listRoute)
  expectRoute(flow.listRoute)
  expect(Object.keys(probe.pages[flow.list]).sort()).toEqual(
    (flow.add ? ['onAddNew', 'onEdit'] : ['onEdit']).sort(),
  )

  edit(flow)
  expectRoute(flow.formRoute)
  expectSelection(flow, record)
  expect(Object.keys(probe.pages[flow.form]).sort()).toEqual(
    [flow.selection, flow.finish, ...(flow.openList ? ['onOpenList'] : [])].sort(),
  )

  invoke(flow.form, flow.finish)
  expectRoute(flow.listRoute)
  expect(screen.queryByLabelText('Draf editor')).toBeNull()

  if (flow.add) invoke(flow.list, 'onAddNew')
  else navigate(flow.formRoute)
  expectRoute(flow.formRoute)
  expectSelection(flow, null)

  invoke(flow.form, flow.finish)
  expectRoute(flow.listRoute)
})

test.each(flows.filter(({ openList }) => openList))('$kind: buka daftar dari form kembali ke daftar miliknya', (flow) => {
  render(<DashboardPage />)
  navigate(flow.listRoute)
  edit(flow)
  invoke(flow.form, 'onOpenList')
  expectRoute(flow.listRoute)
  expect(screen.queryByLabelText('Draf editor')).toBeNull()

  if (flow.add) invoke(flow.list, 'onAddNew')
  else navigate(flow.formRoute)
  expectSelection(flow, null)
})

test.each(flows)('$kind: ID sama mempertahankan draf, ID lain dan mode baru mereset form', (flow) => {
  render(<DashboardPage />)
  navigate(flow.listRoute)
  edit(flow)
  const firstInput = fillDraft()

  const sameId = { ...record, title: 'Data baru untuk ID yang sama' }
  edit(flow, sameId)
  expectSelection(flow, sameId)
  expect(screen.getByLabelText('Draf editor')).toBe(firstInput)
  expect(firstInput.value).toBe('Draf belum disimpan')

  const nextRecord = { ...record, id: 42 }
  edit(flow, nextRecord)
  expectSelection(flow, nextRecord)
  const nextInput = screen.getByLabelText('Draf editor')
  expect(nextInput).not.toBe(firstInput)
  expect(nextInput.value).toBe('')
  fillDraft()

  if (flow.add) invoke(flow.list, 'onAddNew')
  else navigate(flow.formRoute)
  expectSelection(flow, null)
  const newInput = screen.getByLabelText('Draf editor')
  expect(newInput).not.toBe(nextInput)
  expect(newInput.value).toBe('')

  fillDraft()
  if (flow.add) invoke(flow.list, 'onAddNew')
  else navigate(flow.formRoute)
  expect(screen.getByLabelText('Draf editor')).toBe(newInput)
  expect(newInput.value).toBe('Draf belum disimpan')
})

test('postType diteruskan apa adanya dan bukan bagian key post dengan ID yang sama', () => {
  const flow = flows[0]
  render(<DashboardPage />)
  navigate(flow.listRoute)
  edit(flow, record, 'berita')
  const input = fillDraft()
  edit(flow, record, 'event')
  expectSelection(flow, record, 'event')
  expect(screen.getByLabelText('Draf editor')).toBe(input)
  expect(input.value).toBe('Draf belum disimpan')
})

test.each(flows)('$kind: memilih menu form aktif membatalkan edit; pindah menu juga membuang pilihan', (flow) => {
  render(<DashboardPage />)
  navigate(flow.listRoute)
  edit(flow)
  const editedInput = fillDraft()
  navigate(flow.formRoute)
  expectRoute(flow.formRoute)
  expectSelection(flow, null)
  expect(screen.getByLabelText('Draf editor')).not.toBe(editedInput)

  edit(flow)
  navigate('contact')
  expectRoute('contact')
  navigate(flow.formRoute)
  expectSelection(flow, null)
})

test('CreateAbout tetap callback-only dan memakai formAboutMember untuk edit maupun tambah', () => {
  render(<DashboardPage />)
  navigate('createAbout')
  expect(Object.keys(probe.pages.CreateAboutPage).sort()).toEqual([
    'onAddNew', 'onCancelEdit', 'onEdit', 'onFinishEdit', 'onOpenList',
  ])
  invoke('CreateAboutPage', 'onEdit', record)
  expectRoute('formAboutMember')
  expectSelection(memberFlow, record)

  invoke('CreateAboutPage', 'onAddNew')
  expectRoute('formAboutMember')
  expectSelection(memberFlow, null)

  invoke('CreateAboutPage', 'onFinishEdit')
  expectRoute('listAbout')
})

test('CreateAbout onCancelEdit mengosongkan member tanpa navigasi', () => {
  render(<DashboardPage />)
  navigate('createAbout')
  invoke('CreateAboutPage', 'onCancelEdit')
  expectRoute('createAbout')

  invoke('CreateAboutPage', 'onEdit', record)
  const input = fillDraft()
  invoke('CreateAboutPage', 'onCancelEdit')
  expectRoute('formAboutMember')
  expectSelection(memberFlow, null)
  expect(screen.getByLabelText('Draf editor')).not.toBe(input)
})

test.each(flows.filter(({ kind }) => kind !== 'member'))('CreateAbout onCancelEdit tidak menyentuh editor $kind yang sedang aktif', (flow) => {
  render(<DashboardPage />)
  navigate('createAbout')
  navigate(flow.listRoute)
  edit(flow)
  const input = fillDraft()
  invoke('CreateAboutPage', 'onCancelEdit')
  expectRoute(flow.formRoute)
  expectSelection(flow, record)
  expect(screen.getByLabelText('Draf editor')).toBe(input)
  expect(input.value).toBe('Draf belum disimpan')
})

test('CreateAbout onOpenList hanya membuka listAbout, termasuk dari callback yang masih dipegang', () => {
  render(<DashboardPage />)
  navigate('createAbout')
  invoke('CreateAboutPage', 'onOpenList')
  expectRoute('listAbout')
  invoke('ListAboutPage', 'onEdit', record)
  expectRoute('formAboutMember')
  invoke('CreateAboutPage', 'onOpenList')
  expectRoute('listAbout')
})

const rolePages = [
  ['partners', 'KemitraanPage'],
  ['aboutCards', 'KartuTentangPage'],
  ['aboutIntro', 'AboutIntroPage'],
  ['homeJoinImages', 'HomepageJoinImagesPage'],
  ['homeJoinCards', 'HomepageJoinCardsPage'],
  ['homeServices', 'HomepageServicesPage'],
]
const banners = [
  ['bannerTentang', 'tentang'],
  ['bannerEvent', 'event'],
  ['bannerBerita', 'berita'],
  ['bannerArtikel', 'artikel'],
  ['bannerKontak', 'kontak'],
]

test.each(['admin', { name: 'super_admin' }, undefined])('role %j diteruskan tanpa normalisasi ke semua halaman terkait', (role) => {
  probe.user = role === undefined ? null : { role }
  render(<DashboardPage />)
  expect(probe.pages.Sidebar.user).toBe(probe.user)
  for (const [route, page] of rolePages) {
    navigate(route)
    expectRoute(route)
    expect(probe.pages[page]).toEqual({ role })
    expect(probe.pages[page].role).toBe(role)
  }
  for (const [route, pageKey] of banners) {
    navigate(route)
    expectRoute(route)
    expect(probe.pages.PageBannerPage).toEqual({ pageKey, role })
    expect(probe.pages.PageBannerPage.role).toBe(role)
  }
})

test('banner di-remount saat navKey berubah, bukan saat menu yang sama dipilih', () => {
  render(<DashboardPage />)
  let previousInput = null
  for (const [route] of banners) {
    navigate(route)
    const input = screen.getByLabelText('Draf editor')
    expect(input).not.toBe(previousInput)
    expect(input.value).toBe('')
    fillDraft()
    navigate(route)
    expect(screen.getByLabelText('Draf editor')).toBe(input)
    expect(input.value).toBe('Draf belum disimpan')
    previousInput = input
  }
})

test('shell, callback navigasi luar, menu mobile, dan route tanpa editor tetap sama', () => {
  const onNavigate = vi.fn()
  render(<DashboardPage onNavigate={onNavigate} />)
  expectRoute('dashboard')
  expect(screen.getByRole('heading', { name: 'Dashboard Overview' })).not.toBeNull()
  expect(screen.getByText('Monitor partnership activities and ongoing projects.')).not.toBeNull()
  expect(probe.pages.Sidebar.onNavigate).toBe(onNavigate)
  expect(probe.pages.Sidebar.sidebarOpen).toBe(false)
  invoke('Topbar', 'setSidebarOpen', true)
  expect(probe.pages.Sidebar.sidebarOpen).toBe(true)
  invoke('Sidebar', 'setSidebarOpen', false)
  expect(probe.pages.Sidebar.sidebarOpen).toBe(false)
  invoke('Sidebar', 'onNavigate', 'landing')
  expect(onNavigate).toHaveBeenCalledWith('landing')

  for (const [route, page] of [
    ['changePassword', 'ChangePasswordPage'],
    ['users', 'UserPage'],
    ['contact', 'KontakInboxPage'],
    ['videoSetting', 'FormVideoSettingPage'],
  ]) {
    navigate(route)
    expectRoute(route)
    expect(probe.pages[page]).toEqual({})
  }
  navigate('unknown-route')
  expectRoute('unknown-route')
  expect(probe.pages.PlaceholderPage).toEqual({ activeNav: 'unknown-route' })
})
