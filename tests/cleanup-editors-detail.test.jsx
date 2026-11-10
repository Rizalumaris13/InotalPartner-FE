import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import FormFAQPage from '../src/pages/FormFAQPage'
import FormVideoPage from '../src/pages/FormVideoPage'
import FormVideoHighlightPage from '../src/pages/FormVideoHighlightPage'
import * as about from '../src/api/about'
import { server } from './setup'

const cases = [
  {
    label: 'FAQ', Component: FormFAQPage, prop: 'editingFAQ', endpoint: 'about/faqs',
    primary: 'question', secondary: 'answer',
    primaryPlaceholder: 'Contoh: Bagaimana mekanisme pengajuan kerja sama atau partnership?',
    secondaryPlaceholder: 'Tuliskan jawaban yang lengkap, jelas, dan informatif untuk pengunjung...',
    createLabel: 'Simpan FAQ',
    record: { id: 11, question: 'Pertanyaan awal', answer: 'Jawaban awal', display_order: 2, is_active: false },
    empty: { question: '', answer: '', display_order: 0, is_active: true },
  },
  {
    label: 'video', Component: FormVideoPage, prop: 'editingVideo', endpoint: 'about/video',
    primary: 'title', secondary: 'description',
    primaryPlaceholder: 'Contoh: Profil INOTAL Partner — Menghubungkan Kolaborasi & Talenta',
    secondaryPlaceholder: 'Tuliskan ringkasan singkat atau poin-poin yang dibahas dalam video profil ini...',
    createLabel: 'Tambah Video',
    record: { id: 11, title: 'Judul awal', description: 'Deskripsi awal', video_url: 'https://youtu.be/videoA', is_active: false },
    empty: { title: '', description: '', video_url: '', is_active: true },
  },
  {
    label: 'highlight', Component: FormVideoHighlightPage, prop: 'editingHighlight', endpoint: 'about/video-highlights',
    primary: 'title', secondary: 'description',
    primaryPlaceholder: 'Contoh: Transparansi Penuh',
    secondaryPlaceholder: 'Tuliskan penjelasan singkat poin video ini...',
    createLabel: 'Simpan Poin Video',
    record: { id: 11, title: 'Judul awal', description: 'Deskripsi awal', icon: 'Video', display_order: 2, is_active: false },
    empty: { title: '', description: '', icon: 'Video', display_order: 0, is_active: true },
  },
]

const videoPlaceholder = 'Contoh: https://www.youtube.com/watch?v=aqz-KE-bpKQ atau https://youtu.be/aqz-KE-bpKQ'

function signIn(role = 'admin') {
  localStorage.setItem('inotal_token', 'cleanup-editors-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ role, full_name: 'Admin Pengujian' }))
}

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function assertDraft(spec, record) {
  expect(screen.getByPlaceholderText(spec.primaryPlaceholder).value).toBe(record[spec.primary])
  expect(screen.getByPlaceholderText(spec.secondaryPlaceholder).value).toBe(record[spec.secondary])
  if (spec.label === 'FAQ') {
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(String(record.is_active))
  } else {
    expect(screen.getByRole('checkbox').checked).toBe(record.is_active)
  }
  if ('display_order' in record) expect(screen.getByRole('spinbutton').value).toBe(String(record.display_order))
  if ('icon' in record) expect(screen.getByRole('combobox').value).toBe(record.icon)
  if ('video_url' in record) expect(screen.getByPlaceholderText(videoPlaceholder).value).toBe(record.video_url)
}

beforeEach(() => { signIn() })

describe.each(cases)('$label editor source lifecycle', (spec) => {
  const { Component } = spec

  test('create, fresh edit, replacement object with SAME ID, different ID, then create', async () => {
    const reads = []
    let response = { ...spec.record, [spec.primary]: 'Data fresh', [spec.secondary]: 'Detail fresh', is_active: true }
    let fail = false
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    server.use(http.get(`*/api/${spec.endpoint}/:id`, ({ params }) => {
      reads.push(params.id)
      return fail
        ? HttpResponse.json({ message: 'Detail tidak tersedia' }, { status: 503 })
        : HttpResponse.json({ data: response })
    }))
    const { rerender } = render(<Component />)
    assertDraft(spec, spec.empty)
    fireEvent.change(screen.getByPlaceholderText(spec.primaryPlaceholder), { target: { value: 'Draf baru' } })
    rerender(<Component {...{ [spec.prop]: spec.record }} />)
    await screen.findByDisplayValue('Data fresh')
    assertDraft(spec, response)

    const sameIdReplacement = { ...spec.record, [spec.primary]: 'Seed pengganti', [spec.secondary]: 'Seed detail pengganti' }
    fail = true
    rerender(<Component {...{ [spec.prop]: sameIdReplacement }} />)
    await screen.findByDisplayValue('Seed pengganti')
    assertDraft(spec, sameIdReplacement)
    expect(warn).toHaveBeenCalled()
    expect(screen.queryByText('Detail tidak tersedia')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText(spec.primaryPlaceholder), { target: { value: 'Draf tetap' } })
    rerender(<Component {...{ [spec.prop]: sameIdReplacement }} onFinish={() => {}} />)
    expect(screen.getByPlaceholderText(spec.primaryPlaceholder).value).toBe('Draf tetap')
    expect(reads).toEqual(['11', '11'])

    response = { ...spec.record, id: 12, [spec.primary]: 'Target B' }
    fail = false
    rerender(<Component {...{ [spec.prop]: response }} />)
    await screen.findByDisplayValue('Target B')
    assertDraft(spec, response)
    expect(reads).toEqual(['11', '11', '12'])
    rerender(<Component />)
    assertDraft(spec, spec.empty)
  })

  test('empty detail response keeps the seed instead of clearing it', async () => {
    server.use(http.get(`*/api/${spec.endpoint}/:id`, () => HttpResponse.json({ data: null })))
    render(<Component {...{ [spec.prop]: spec.record }} />)
    await screen.findByDisplayValue(spec.record[spec.primary])
    assertDraft(spec, spec.record)
  })

  test('ID-less fields use the original empty/status/order normalization', () => {
    const record = { [spec.primary]: 'Seed', [spec.secondary]: null, display_order: '8', is_active: null }
    render(<Component {...{ [spec.prop]: record }} />)
    const expected = { ...spec.empty, [spec.primary]: 'Seed' }
    assertDraft(spec, expected)
  })

  test('ID-less prop updates reseed without losing the focused input', () => {
    const record = { ...spec.record, id: undefined }
    const { rerender } = render(<Component {...{ [spec.prop]: record }} />)
    const input = screen.getByPlaceholderText(spec.primaryPlaceholder)
    input.focus()
    const replacement = { ...record, [spec.primary]: 'Prop baru tanpa ID' }
    rerender(<Component {...{ [spec.prop]: replacement }} />)
    assertDraft(spec, replacement)
    expect(screen.getByPlaceholderText(spec.primaryPlaceholder)).toBe(input)
    expect(document.activeElement).toBe(input)
  })

  test.each([11, 12])('late detail responses cannot overwrite a new source (next ID %s) or a remount', async (nextId) => {
    const method = { FAQ: 'getAboutFAQByIdApi', video: 'getAboutVideoByIdApi', highlight: 'getAboutVideoHighlightByIdApi' }[spec.label]
    const load = vi.spyOn(about, method)
    const requests = []
    server.use(http.get(`*/api/${spec.endpoint}/:id`, async () => {
      const request = deferred()
      requests.push(request)
      return HttpResponse.json({ data: await request.promise })
    }))
    const { rerender, unmount } = render(<Component {...{ [spec.prop]: spec.record }} />)
    await waitFor(() => expect(requests).toHaveLength(1))
    rerender(<Component {...{ [spec.prop]: { ...spec.record, id: nextId } }} />)
    await waitFor(() => expect(requests).toHaveLength(2))
    await act(async () => {
      requests[1].resolve({ ...spec.record, id: nextId, [spec.primary]: 'Target terbaru' })
      await load.mock.results[1].value
    })
    await screen.findByDisplayValue('Target terbaru')
    await act(async () => {
      requests[0].resolve({ ...spec.record, [spec.primary]: 'Respons basi A' })
      await load.mock.results[0].value
    })
    expect(screen.getByPlaceholderText(spec.primaryPlaceholder).value).toBe('Target terbaru')

    rerender(<Component {...{ [spec.prop]: { ...spec.record, id: 13 } }} />)
    await waitFor(() => expect(requests).toHaveLength(3))
    unmount()
    render(<Component />)
    await act(async () => {
      requests[2].resolve({ ...spec.record, [spec.primary]: 'Respons setelah unmount' })
      await load.mock.results[2].value
    })
    assertDraft(spec, spec.empty)
  })

  test.each(['create', 'edit'])('%s preserves explicit payload and draft on failure, then retries', async (mode) => {
    let attempts = 0
    const writes = []
    const onFinish = vi.fn()
    const onOpenList = vi.fn()
    server.use(
      http.get(`*/api/${spec.endpoint}/:id`, () => HttpResponse.json({ data: spec.record })),
      http[mode === 'edit' ? 'put' : 'post'](`*/api/${spec.endpoint}${mode === 'edit' ? '/:id' : ''}`, async ({ request, params }) => {
        attempts += 1
        writes.push({ id: params.id, payload: await request.json() })
        return attempts === 1
          ? HttpResponse.json({ message: 'Simpan ditolak untuk pengujian' }, { status: 422 })
          : HttpResponse.json({ data: { id: 11 } })
      }),
    )
    render(<Component {...{ [spec.prop]: mode === 'edit' ? spec.record : null }} onFinish={onFinish} onOpenList={onOpenList} />)
    const primary = await screen.findByPlaceholderText(spec.primaryPlaceholder)
    fireEvent.change(primary, { target: { value: '  Nilai baru  ' } })
    fireEvent.change(screen.getByPlaceholderText(spec.secondaryPlaceholder), { target: { value: '  Isi baru  ' } })
    if (spec.label === 'video') fireEvent.change(screen.getByPlaceholderText(videoPlaceholder), { target: { value: '  URL non-YouTube tetap diterima  ' } })
    const submit = screen.getByRole('button', { name: mode === 'edit' ? 'Simpan Perubahan' : spec.createLabel })
    fireEvent.click(submit)
    await screen.findByText('Simpan ditolak untuk pengujian')
    expect(screen.getByPlaceholderText(spec.primaryPlaceholder).value).toBe('  Nilai baru  ')
    expect(onFinish).not.toHaveBeenCalled()
    expect(submit.disabled).toBe(false)
    fireEvent.click(submit)
    await waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
    expect(onOpenList).not.toHaveBeenCalled()
    const initial = mode === 'edit' ? spec.record : spec.empty
    const { id: recordId, ...fields } = initial
    const expectedPayload = { ...fields, [spec.primary]: 'Nilai baru', [spec.secondary]: 'Isi baru' }
    if (spec.label === 'video') Object.assign(expectedPayload, { video_url: 'URL non-YouTube tetap diterima', thumbnail_url: '' })
    expect(writes).toEqual(Array.from({ length: 2 }, () => ({ id: mode === 'edit' ? String(recordId) : undefined, payload: expectedPayload })))
  })

  test('cancel delegates without writing', async () => {
    const onOpenList = vi.fn()
    const onFinish = vi.fn()
    render(<Component onOpenList={onOpenList} onFinish={onFinish} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Batal' }))
    expect(onOpenList).toHaveBeenCalledOnce()
    expect(onFinish).not.toHaveBeenCalled()
  })

  test.each(['operator', { name: 'operator' }, 'admin', { name: 'super_admin' }])('role contract for %j', (role) => {
    signIn(role)
    render(<Component />)
    const allowed = role === 'admin' || role.name === 'super_admin'
    expect(screen.getByPlaceholderText(spec.primaryPlaceholder).disabled).toBe(!allowed)
    expect(Boolean(screen.queryByRole('button', { name: spec.createLabel }))).toBe(allowed)
  })
})

test('FAQ and video use list fallback after save, while highlight only calls onFinish', async () => {
  for (const spec of cases) {
    const { Component } = spec
    const onOpenList = vi.fn()
    server.use(http.post(`*/api/${spec.endpoint}`, () => HttpResponse.json({ data: { id: 1 } })))
    const { unmount } = render(<Component onOpenList={onOpenList} />)
    fireEvent.change(screen.getByPlaceholderText(spec.primaryPlaceholder), { target: { value: 'Judul pengujian' } })
    fireEvent.change(screen.getByPlaceholderText(spec.secondaryPlaceholder), { target: { value: 'Isi pengujian' } })
    if (spec.label === 'video') fireEvent.change(screen.getByPlaceholderText(videoPlaceholder), { target: { value: 'https://youtu.be/videoA' } })
    const button = screen.getByRole('button', { name: spec.createLabel })
    fireEvent.click(button)
    await waitFor(() => expect(button.disabled).toBe(false))
    expect(onOpenList).toHaveBeenCalledTimes(spec.label === 'highlight' ? 0 : 1)
    unmount()
  }
})

const youtubeCases = [
  ['https://www.youtube.com/watch?v=watchId&feature=share#fragment', 'watchId'],
  ['  https://youtu.be/shortId?t=10#fragment  ', 'shortId'],
  ['https://www.youtube.com/embed/embedId/extra', 'embedId'],
  ['https://m.youtube.com/shorts/shortsId?feature=share', 'shortsId'],
  ['https://youtube.com/live/liveId#fragment', 'liveId'],
  ['https://youtube.com/watch-extra?v=prefixId', 'prefixId'],
  ['https://notyoutube.com/watch?v=includesId', 'includesId'],
  ['https://youtube.com.example.org/embed/suffixId', 'suffixId'],
  ['https://notyoutu.be/accepted/extra', 'accepted'],
  ['https://youtu.be//double-slash', null],
  ['https://youtu.be/', null],
  ['https://youtube.com/embed/', null],
  ['https://youtube.com/watch', null],
  ['https://youtube.com/watch?v=', null],
  ['https://youtube.com/', null],
  ['https://example.org/watch?v=ignored', null],
  ['not a URL', null],
  ['', null],
]

test.each(youtubeCases)('admin thumbnail parsing keeps legacy behavior for %s', (url, id) => {
  render(<FormVideoPage />)
  fireEvent.change(screen.getByPlaceholderText(videoPlaceholder), { target: { value: url } })
  const image = screen.queryByAltText('Preview Thumbnail YouTube')
  if (id) expect(image.getAttribute('src')).toBe(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`)
  else expect(image).toBeNull()
})

test('thumbnail fallback survives a SAME-ID prop refresh when the detected YouTube ID is unchanged', async () => {
  const record = { ...cases[1].record, id: 71 }
  server.use(http.get('*/api/about/video/:id', () => HttpResponse.json({ data: record })))
  const { rerender } = render(<FormVideoPage editingVideo={record} />)
  fireEvent.error(await screen.findByAltText('Preview Thumbnail YouTube'))
  expect(screen.getByAltText('Preview Thumbnail YouTube').getAttribute('src')).toContain('/videoA/hqdefault.jpg')
  rerender(<FormVideoPage editingVideo={{ ...record, title: 'Prop fresh' }} />)
  expect((await screen.findByAltText('Preview Thumbnail YouTube')).getAttribute('src')).toContain('/videoA/hqdefault.jpg')
})

test('thumbnail retries HD for A → B → A, not for a different URL with the same ID', () => {
  render(<FormVideoPage />)
  const title = screen.getByPlaceholderText(cases[1].primaryPlaceholder)
  const url = screen.getByPlaceholderText(videoPlaceholder)
  fireEvent.change(title, { target: { value: 'Draf judul tetap' } })
  fireEvent.change(url, { target: { value: 'https://youtu.be/videoA' } })
  fireEvent.error(screen.getByAltText('Preview Thumbnail YouTube'))
  expect(screen.getByAltText('Preview Thumbnail YouTube').getAttribute('src')).toContain('/videoA/hqdefault.jpg')
  fireEvent.error(screen.getByAltText('Preview Thumbnail YouTube'))
  expect(screen.getByText('Kualitas HQ (Fallback)')).not.toBeNull()
  fireEvent.change(url, { target: { value: 'https://youtube.com/watch?v=videoA' } })
  expect(screen.getByAltText('Preview Thumbnail YouTube').getAttribute('src')).toContain('/videoA/hqdefault.jpg')
  fireEvent.change(url, { target: { value: 'https://youtu.be/videoB' } })
  expect(screen.getByAltText('Preview Thumbnail YouTube').getAttribute('src')).toContain('/videoB/maxresdefault.jpg')
  fireEvent.change(url, { target: { value: 'https://youtu.be/videoA' } })
  expect(screen.getByAltText('Preview Thumbnail YouTube').getAttribute('src')).toContain('/videoA/maxresdefault.jpg')
  expect(title.value).toBe('Draf judul tetap')
})
