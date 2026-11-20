import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { uploadImageApi } from '../src/api/posts'
import { uploadImageApi as aboutUploadImageApi } from '../src/api/about'
import { server } from './setup'

test('about reexports the same upload helper', () => {
  expect(aboutUploadImageApi).toBe(uploadImageApi)
})

test.each([
  [{ data: { url: '/uploads/nested.png' }, url: '/uploads/flat.png' }, '/uploads/nested.png'],
  [{ url: '/uploads/flat.png' }, '/uploads/flat.png'],
  [{ data: { url: '' }, url: '/uploads/fallback.png' }, '/uploads/fallback.png'],
  [{ data: { url: '' } }, ''],
  [{ data: null }, ''],
  [{ image_url: '/uploads/unsupported.png' }, ''],
  [{ data: { file_url: '/uploads/unsupported.png' } }, ''],
  ['unsupported string envelope', ''],
  [{}, ''],
  // The API helper does not validate the type of a truthy URL. Keep caller
  // compatibility branches until that boundary can guarantee a string.
  [{ data: { url: 42 } }, 42],
  [{ data: { url: { url: '/uploads/legacy-object.png' } } }, { url: '/uploads/legacy-object.png' }],
])('upload helper normalizes supported/unsupported envelopes %j', async (response, expected) => {
  server.use(http.post('*/api/uploads/image', async ({ request }) => {
    expect(request.headers.get('content-type')).toContain('multipart/form-data')
    expect(await request.text()).toContain('name="image"')
    return HttpResponse.json(response)
  }))
  expect(await uploadImageApi(new File(['test'], 'test.png', { type: 'image/png' }))).toEqual(expected)
})

test('upload errors preserve backend message for the caller', async () => {
  server.use(http.post('*/api/uploads/image', () => HttpResponse.json({ message: 'Gambar tidak valid' }, { status: 422 })))
  await expect(uploadImageApi(new File(['test'], 'test.png', { type: 'image/png' }))).rejects.toMatchObject({ response: { data: { message: 'Gambar tidak valid' }, status: 422 } })
})
