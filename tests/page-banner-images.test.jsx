import { expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import PageBannerPage from '../src/pages/PageBannerPage'
import PublicPageBanner from '../src/components/PublicPageBanner'
import { DEFAULT_PAGE_BANNERS, PAGE_BANNER_PAGES } from '../src/data/pageBanners'
import { server } from './setup'

// Respons API diisolasi oleh MSW: tidak menulis ke backend atau database asli.
test.each(PAGE_BANNER_PAGES)(
  'gambar $name dapat diganti admin dan tampil kembali di halaman publik',
  async ({ key: pageKey, name }) => {
    const records = Object.fromEntries(PAGE_BANNER_PAGES.map(({ key }) => [
      key,
      { page: key, ...DEFAULT_PAGE_BANNERS[key], image_url: `/uploads/${key}-lama.webp` },
    ]))
    const previousRecords = structuredClone(records)
    const imageUrl = `/uploads/${pageKey}-pilihan-admin.png`
    let uploadCount = 0
    let writtenPayload
    const requests = []
    server.use(
      http.get('*/api/page-banners/:page', ({ params }) => {
        requests.push(`GET ${params.page}`)
        return HttpResponse.json({ success: true, data: records[params.page] })
      }),
      http.post('*/api/uploads/image', async ({ request }) => {
        uploadCount += 1
        expect(request.headers.get('content-type')).toContain('multipart/form-data; boundary=')
        expect(await request.text()).toContain(`name="image"; filename="${pageKey}.png"`)
        return HttpResponse.json({ data: { url: imageUrl } }, { status: 201 })
      }),
      http.put('*/api/page-banners/:page', async ({ params, request }) => {
        requests.push(`PUT ${params.page}`)
        writtenPayload = await request.json()
        records[params.page] = { page: params.page, ...writtenPayload }
        return HttpResponse.json({ success: true, data: records[params.page] })
      }),
      http.get('*/api/public/page-banners/:page', ({ params }) => {
        requests.push(`PUBLIC ${params.page}`)
        return HttpResponse.json({ success: true, data: records[params.page] })
      }),
    )

    const user = userEvent.setup()
    const admin = render(<PageBannerPage pageKey={pageKey} role="admin" />)
    const form = await screen.findByRole('form', { name: `Banner ${name}` })
    await user.upload(
      within(form).getByLabelText('Unggah Gambar'),
      new File(['frontend-image-test-fixture'], `${pageKey}.png`, { type: 'image/png' }),
    )
    await waitFor(() => expect(within(form).getByLabelText('URL Gambar').value).toBe(imageUrl))
    await user.click(within(form).getByRole('button', { name: 'Isi Teks Bawaan' }))
    expect(within(form).getByLabelText('URL Gambar').value).toBe(imageUrl)
    expect(within(form).getByRole('region', { name: 'Pratinjau banner' }).querySelector('.bg-cover').style.backgroundImage).toContain(imageUrl)
    await user.click(within(form).getByRole('button', { name: 'Simpan Banner' }))
    expect(await screen.findByText('Banner berhasil disimpan.')).not.toBeNull()
    expect(writtenPayload).toEqual({ ...DEFAULT_PAGE_BANNERS[pageKey], image_url: imageUrl })
    expect(uploadCount).toBe(1)
    admin.unmount()

    const publicView = render(<PublicPageBanner pageKey={pageKey} breadcrumb={name} />)
    await waitFor(() => expect(publicView.container.querySelector('.bg-cover').style.backgroundImage).toContain(imageUrl))
    expect(requests).toEqual([`GET ${pageKey}`, `PUT ${pageKey}`, `GET ${pageKey}`, `PUBLIC ${pageKey}`])
    for (const { key } of PAGE_BANNER_PAGES) {
      if (key !== pageKey) expect(records[key]).toEqual(previousRecords[key])
    }
    expect(Object.keys(localStorage)).toEqual([])
  },
)
