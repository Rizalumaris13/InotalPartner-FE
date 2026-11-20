import { afterEach, describe, expect, test, vi } from 'vitest'
import api from '../src/api/axios'
import * as statistics from '../src/api/statistics'
import * as invitations from '../src/api/joinInvitation'
import { positiveResourceId } from '../src/utils/resourceId'

const statistic = {
  id: 12, title: 'Mitra', icon: 'Users', statistic_value: '12.5', statistic_suffix: 'K',
  description: 'Mitra aktif', display_order: 0, is_active: true,
}
const invitation = {
  id: 13, section_label: 'Terbuka', title: 'Bergabung dengan tim',
  button_text: 'Hubungi kami', button_url: '/kontak', is_active: true,
}
const resources = [
  { name: 'statistik', record: statistic, list: statistics.getStatisticsApi, detail: statistics.getStatisticByIdApi,
    create: statistics.createStatisticApi, update: statistics.updateStatisticApi, remove: statistics.deleteStatisticApi },
  { name: 'ajakan', record: invitation, list: invitations.getJoinInvitationsApi, detail: invitations.getJoinInvitationByIdApi,
    create: invitations.createJoinInvitationApi, update: invitations.updateJoinInvitationApi, remove: invitations.deleteJoinInvitationApi },
]

afterEach(() => vi.restoreAllMocks())

describe.each(resources)('API $name hasil merge', (resource) => {
  test('GET daftar dan detail hanya menerima envelope sukses yang sesuai kontrak', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: [resource.record] } })
      .mockResolvedValueOnce({ data: { success: true, data: resource.record } })
    expect(await resource.list()).toEqual([resource.record])
    expect(await resource.detail(String(resource.record.id))).toEqual(resource.record)
  })

  test.each([undefined, {}, { success: false, data: [] }, { success: true, data: {} },
    { success: true, data: [{ id: 1, title: {} }] }].map((body) => [body]))('GET daftar malformed ditolak: %#', async (body) => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: body })
    await expect(resource.list()).rejects.toThrow('kontrak')
  })

  test.each(['create', 'update', 'remove'])('%s tidak menganggap success false sebagai write berhasil', async (method) => {
    const response = { data: { success: false, message: 'Write ditolak backend.' } }
    vi.spyOn(api, 'post').mockResolvedValue(response)
    vi.spyOn(api, 'put').mockResolvedValue(response)
    vi.spyOn(api, 'delete').mockResolvedValue(response)
    const promise = method === 'create'
      ? resource.create(resource.record) : resource[method](resource.record.id, resource.record)
    await expect(promise).rejects.toThrow('Write ditolak backend.')
  })

  test.each([null, false, 7, [], {}].map((message) => [message]))('acknowledgement dengan message nonstring ditolak: %#', async (message) => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true, message, data: resource.record } })
    await expect(resource.create(resource.record)).rejects.toThrow('belum mengonfirmasi')
  })

  test.each(['../users/1', '1?role=admin', undefined, 0, -1, true, 1.5])('ID %s ditolak sebelum request detail/update/delete', async (id) => {
    const get = vi.spyOn(api, 'get')
    const put = vi.spyOn(api, 'put')
    const remove = vi.spyOn(api, 'delete')
    await expect(resource.detail(id)).rejects.toThrow('ID record')
    await expect(resource.update(id, resource.record)).rejects.toThrow('ID record')
    await expect(resource.remove(id)).rejects.toThrow('ID record')
    expect(get).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
})

test('endpoint publik mempertahankan signal dan membaca null sebagai konfigurasi kosong', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: null } })
  const options = { signal: new AbortController().signal }
  expect(await statistics.getPublicStatisticsApi(options)).toEqual([])
  expect(await invitations.getPublicJoinInvitationApi(options)).toBeNull()
  expect(get.mock.calls).toEqual([
    ['/public/about/statistics', options], ['/public/home/cta', options],
  ])
})

test('error Ajakan Bergabung mempertahankan sebab aslinya', async () => {
  const failure = new Error('Koneksi terputus.')
  vi.spyOn(api, 'get').mockRejectedValue(failure)
  await expect(invitations.getPublicJoinInvitationApi()).rejects.toMatchObject({ cause: failure })
})

test('ID resource mendukung integer aman tanpa coercion boolean, pecahan, atau path', () => {
  expect(positiveResourceId(1)).toBe(1)
  expect(positiveResourceId('12')).toBe(12)
  expect(positiveResourceId(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER)
  for (const value of [null, [], {}, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '01', '1.0', '1e3']) {
    expect(() => positiveResourceId(value)).toThrow('ID record')
  }
})
