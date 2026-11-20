import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import PostListPage from '../src/pages/PostListPage'
import CreatePost from '../src/pages/CreatePost'
import PostPreview from '../src/components/Postpreview'
import { server } from './setup'

function signIn(role = 'admin') {
  localStorage.setItem('inotal_token', 'cleanup-post-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ id: 99, role }))
}

function pageText() {
  return screen.getByText('Halaman', { exact: false }).textContent.replace(/\s+/g, ' ').trim()
}

const post = { id: 11, title: 'Post uji', slug: 'post-uji', author_id: 99, status: 'draft', content: 'Isi post', categories: [] }

test.each([
  { name: 'plural', categories: [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }], category: null, labels: ['Alpha', 'Beta'], preview: 'Alpha, Beta' },
  { name: 'legacy', categories: [], category: { id: 3, name: 'Legacy' }, labels: ['Legacy'], preview: 'Legacy' },
  { name: 'both', categories: [{ id: 1, name: 'Alpha' }], category: { id: 3, name: 'Ignored' }, labels: ['Alpha'], preview: 'Alpha' },
  { name: 'empty', categories: undefined, category: { id: 3, name: '' }, labels: ['-'], preview: 'Uncategorized' },
])('post list and real preview agree on $name category compatibility', async ({ categories, category, labels, preview }) => {
  signIn()
  server.use(http.get('*/api/news', () => HttpResponse.json({ data: { data: [{ ...post, categories, category }] } })))
  render(<PostListPage />)
  const table = await screen.findByRole('table')
  const row = within(table).getAllByRole('row')[1]
  const categoryCell = within(row).getAllByRole('cell')[1]
  expect(Array.from(categoryCell.querySelectorAll('span')).map((badge) => badge.textContent)).toEqual(labels)
  const user = userEvent.setup()
  await user.click(within(row).getByRole('button', { name: 'Preview post' }))
  expect(within(screen.getByRole('article')).getByText(preview, { exact: true })).not.toBeNull()
  expect(screen.queryByText('Ignored')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Tutup', exact: true }))
  expect(screen.queryByRole('article')).toBeNull()
})

test('post pagination only resets on changed type, search, or status and keeps limit 100', async () => {
  signIn()
  const requests = []
  for (const resource of ['news', 'events', 'articles']) {
    server.use(http.get(`*/api/${resource}`, ({ request }) => {
      const url = new URL(request.url)
      requests.push({ resource, page: url.searchParams.get('page'), limit: url.searchParams.get('limit') })
      return HttpResponse.json({ data: { data: Array.from({ length: 11 }, (_, i) => ({ ...post, id: i + 1, title: `Post ${resource} ${i + 1}` })) } })
    }))
  }
  render(<PostListPage />)
  const user = userEvent.setup()
  await screen.findByText('Post news 1')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByRole('button', { name: 'News', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Semua', exact: true }))
  fireEvent.change(screen.getByPlaceholderText('Cari judul post...'), { target: { value: '' } })
  expect(pageText()).toBe('Halaman 2 dari 2')
  expect(requests).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: 'Draft', exact: true }))
  expect(pageText()).toBe('Halaman 1 dari 2')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByRole('button', { name: 'Draft', exact: true }))
  expect(pageText()).toBe('Halaman 2 dari 2')
  fireEvent.change(screen.getByPlaceholderText('Cari judul post...'), { target: { value: '  POST  ' } })
  expect(pageText()).toBe('Halaman 1 dari 2')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByRole('button', { name: 'Event', exact: true }))
  await screen.findByText('Post events 1')
  expect(pageText()).toBe('Halaman 1 dari 2')
  expect(requests).toEqual([{ resource: 'news', page: '1', limit: '100' }, { resource: 'events', page: '1', limit: '100' }])
})

test('publishing from page two preserves the existing empty-page behavior after the draft filter shrinks', async () => {
  signIn()
  const items = Array.from({ length: 11 }, (_, i) => ({ ...post, id: i + 1, title: `Baca ${i + 1}` }))
  let reads = 0
  const writes = []
  server.use(
    http.get('*/api/news', () => { reads += 1; return HttpResponse.json({ data: { data: items } }) }),
    http.post('*/api/news/:id/publish', async ({ params, request }) => {
      writes.push({ id: params.id, body: await request.text() })
      items.find((item) => item.id === Number(params.id)).status = 'published'
      return HttpResponse.json({ data: {} })
    }),
  )
  render(<PostListPage />)
  const user = userEvent.setup()
  await screen.findByText('Baca 1')
  await user.click(screen.getByRole('button', { name: 'Draft', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByTitle('Publikasikan ke Landing Page'))
  await user.click(screen.getByRole('button', { name: 'Batal' }))
  expect(writes).toEqual([])
  await user.click(screen.getByTitle('Publikasikan ke Landing Page'))
  await user.click(screen.getByRole('button', { name: 'Ya, publikasikan' }))
  expect(await screen.findByText('Tidak ada post yang cocok dengan filter.')).not.toBeNull()
  expect(screen.getByRole('status').textContent).toContain('Post berhasil dipublikasikan ke Landing Page.')
  expect(writes).toEqual([{ id: '11', body: '' }])
  expect(reads).toBe(2)
  await user.click(screen.getByRole('button', { name: 'Draft', exact: true }))
  expect(screen.getByText('Tidak ada post yang cocok dengan filter.')).not.toBeNull()
  await user.click(screen.getByRole('button', { name: 'Semua' }))
  expect(screen.getByText('Baca 1')).not.toBeNull()
})

test.each(['operator', 'admin', 'super_admin', 'guest', { name: 'admin' }])('post permissions stay unchanged for %j, including author ownership', async (role) => {
  signIn(role)
  const items = [post, { ...post, id: 12, title: 'Milik lain', author_id: 100 }, { ...post, id: 13, title: 'Sudah terbit', status: 'published' }, { ...post, id: 14, title: 'Turun', status: 'taken_down' }]
  server.use(http.get('*/api/news', () => HttpResponse.json({ data: { data: items } })))
  const onEdit = vi.fn()
  render(<PostListPage onEdit={onEdit} />)
  const table = await screen.findByRole('table')
  const rows = within(table).getAllByRole('row').slice(1)
  const user = userEvent.setup()
  if (role === 'operator') {
    expect(screen.getByText('Daftar Post Saya')).not.toBeNull()
    expect(within(rows[0]).getByTitle('Edit post').disabled).toBe(false)
    expect(within(rows[1]).getByTitle('Hanya post milikmu yang bisa diedit').disabled).toBe(true)
    expect(within(rows[2]).getByTitle('Hanya post milikmu yang bisa diedit').disabled).toBe(true)
    await user.click(within(rows[3]).getByTitle('Edit post'))
    expect(onEdit).toHaveBeenCalledWith('news', items[3])
    expect(within(table).queryByTitle('Publikasikan ke Landing Page')).toBeNull()
  } else if (role === 'admin' || role === 'super_admin') {
    expect(within(table).getAllByTitle('Publikasikan ke Landing Page')).toHaveLength(3)
    expect(within(table).getAllByTitle('Turunkan dari Landing Page')).toHaveLength(1)
    expect(within(table).queryByTitle('Edit post')).toBeNull()
  } else {
    expect(within(table).getAllByRole('button')).toHaveLength(4)
    expect(within(table).queryByTitle('Publikasikan ke Landing Page')).toBeNull()
    expect(within(table).queryByTitle('Edit post')).toBeNull()
  }
})

test('CreatePost retains feedback validation, event payload and draft after save', async () => {
  const writes = []
  const calls = []
  server.use(
    http.get('*/api/categories', () => { calls.push('categories'); return HttpResponse.json({ data: [{ id: 3, name: 'Kategori uji' }] }) }),
    http.get('*/api/tags', () => { calls.push('tags'); return HttpResponse.json({ data: [] }) }),
    http.post('*/api/events', async ({ request }) => { writes.push(await request.json()); return HttpResponse.json({ data: { id: 1 } }) }),
  )
  render(<CreatePost />)
  const user = userEvent.setup()
  await screen.findByRole('checkbox', { name: 'Kategori uji' })
  await user.click(screen.getByRole('button', { name: 'Save Draft' }))
  expect(screen.getByRole('status').textContent).toContain('Silakan isi judul post.')
  await user.type(screen.getByPlaceholderText('Enter your post title...'), '  Judul  ')
  await user.click(screen.getByRole('button', { name: 'Save Draft' }))
  expect(screen.getByRole('status').textContent).toContain('Silakan isi konten post.')
  await user.type(screen.getByPlaceholderText('Start writing your post here...'), '  Isi  ')
  await user.click(screen.getByRole('button', { name: 'Save Draft' }))
  expect(screen.getByRole('status').textContent).toContain('Silakan pilih minimal satu kategori.')
  await user.click(screen.getByRole('checkbox', { name: 'Kategori uji' }))
  await user.click(screen.getByRole('button', { name: 'Save Draft' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Post berhasil disimpan sebagai Pending Review.'))
  expect(writes).toEqual([{
    title: 'Judul', content: 'Isi', excerpt: 'Isi', thumbnail_url: '', category_ids: [3], tag_ids: [],
    event_date: null, event_time: null, event_location: null,
  }])
  expect(calls).toEqual(['categories', 'tags'])
  expect(screen.getByPlaceholderText('Enter your post title...').value).toBe('  Judul  ')
  await user.click(screen.getByRole('button', { name: 'Preview', exact: true }))
  expect(within(screen.getByRole('article')).getByText('Kategori uji')).not.toBeNull()
})

test('shared PostPreview keeps placeholders, plain content, image and Event-only details', () => {
  const view = render(<PostPreview postType="News" />)
  expect(screen.getAllByText('Your Post Title')).toHaveLength(2)
  expect(screen.getByText('Your post content will appear here...')).not.toBeNull()
  expect(screen.getByText('Uncategorized')).not.toBeNull()
  view.rerender(<PostPreview title="Acara" content="<b>teks biasa</b>" postType="Event" featuredImage="/uploads/post.jpg" eventDate="2026-11-10" eventTime="09:00" location="Bandung" tags={['uji']} />)
  expect(screen.getByText('<b>teks biasa</b>')).not.toBeNull()
  expect(screen.getByText('Bandung')).not.toBeNull()
  expect(screen.getByText('09:00')).not.toBeNull()
  expect(screen.getByText('#uji')).not.toBeNull()
  expect(screen.getByAltText('Acara').getAttribute('src')).toBe('/uploads/post.jpg')
})
