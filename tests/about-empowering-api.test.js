import { afterEach, describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import {
  createAboutEmpoweringApi,
  deleteAboutEmpoweringApi,
  getAboutEmpoweringApi,
  getPublicAboutEmpoweringApi,
  updateAboutEmpoweringApi,
} from '../src/api/aboutEmpowering'
import {
  ABOUT_EMPOWERING_FIELDS,
  ABOUT_EMPOWERING_RULES,
  DEFAULT_ABOUT_EMPOWERING,
} from '../src/data/aboutEmpowering'
import { isAboutEmpoweringRecord, toAboutEmpoweringPayload } from '../src/utils/aboutEmpowering'
import schema from '../src/contracts/aboutEmpowering.schema.json'

// Fixture transport saja; semua assertion memanggil klien/validator produksi asli.
const record = Object.freeze({
  label: 'Mitra Pilihan',
  title: 'Memberdayakan Mitra',
  title_accent: 'dengan Keahlian.',
})
const adminPath = '/api/about/empowering'
const readers = [
  { name: 'GET admin', path: adminPath, read: getAboutEmpoweringApi },
  { name: 'GET publik', path: '/api/public/about/empowering', read: getPublicAboutEmpoweringApi },
]
const writers = [
  { name: 'POST', method: 'post', status: 201, write: createAboutEmpoweringApi },
  { name: 'PUT', method: 'put', status: 200, write: updateAboutEmpoweringApi },
]
const operations = [
  ...readers.map(({ name, path, read }) => ({ name, method: 'get', path, invoke: read })),
  ...writers.map(({ name, method, write }) => ({
    name, method, path: adminPath, invoke: (options) => write(record, options),
  })),
  { name: 'DELETE', method: 'delete', path: adminPath, invoke: deleteAboutEmpoweringApi },
]
const mutations = operations.filter(({ method }) => method !== 'get')
const fields = schema.required.map((field) => ({ field, ...schema.properties[field] }))
const originalUrl = window.location.href

afterEach(() => {
  window.history.replaceState(null, '', originalUrl)
})

function mockReads(body, init) {
  server.use(...readers.map(({ path }) => http.get(`*${path}`, () => HttpResponse.json(body, init))))
}

async function expectAcceptedRecord(input, expected) {
  expect(isAboutEmpoweringRecord(input)).toBe(true)
  expect(toAboutEmpoweringPayload(input)).toEqual(expected)
  mockReads({ success: true, data: input })
  for (const { name, read } of readers) {
    await expect(read(), name).resolves.toEqual(expected)
  }

  const sent = []
  server.use(...writers.map(({ method, status }) => http[method](`*${adminPath}`, async ({ request }) => {
    sent.push({ method: request.method, body: await request.json() })
    return HttpResponse.json({ success: true }, { status })
  })))
  for (const { name, write } of writers) {
    await expect(Promise.resolve().then(() => write(input)), name).resolves.toBeUndefined()
  }
  expect(sent).toEqual(writers.map(({ name }) => ({ method: name, body: expected })))
}

async function expectRejectedRecord(input) {
  expect(isAboutEmpoweringRecord(input)).toBe(false)
  // null sah sebagai hasil GET kosong, tetapi tidak pernah sah sebagai payload tulis.
  if (input !== null) {
    mockReads({ success: true, data: input })
    for (const { name, read } of readers) {
      await expect(read(), name).rejects.toThrow(/kontrak/)
    }
  }

  const sent = []
  server.use(...writers.map(({ method, status }) => http[method](`*${adminPath}`, ({ request }) => {
    sent.push(request.method)
    return HttpResponse.json({ success: true }, { status })
  })))
  for (const { name, write } of writers) {
    await expect(Promise.resolve().then(() => write(input)), name).rejects.toThrow(/belum valid/)
  }
  expect(sent).toEqual([])
}

function seedSession() {
  const session = {
    token: 'unit-test-token-not-a-real-credential',
    user: JSON.stringify({ id: 1, role: 'admin', name: 'Penguji Lokal' }),
  }
  localStorage.setItem('inotal_token', session.token)
  localStorage.setItem('inotal_user', session.user)
  window.history.replaceState(null, '', '#tentang')
  return session
}

function expectSessionPreserved(session) {
  expect(localStorage.getItem('inotal_token')).toBe(session.token)
  expect(localStorage.getItem('inotal_user')).toBe(session.user)
  expect(window.location.hash).toBe('#tentang')
}

test('metadata field dan teks bawaan sesuai schema, bukan data tersimpan', async () => {
  expect(ABOUT_EMPOWERING_FIELDS).toEqual(['label', 'title', 'title_accent'])
  expect(ABOUT_EMPOWERING_RULES).toEqual(schema.properties)
  expect(DEFAULT_ABOUT_EMPOWERING).toEqual(schema.default)
  expect(DEFAULT_ABOUT_EMPOWERING).toEqual({
    label: 'Pilih yang Terbaik',
    title: 'Memberdayakan Bisnis dengan',
    title_accent: 'Keahlian.',
  })
  await expectAcceptedRecord(DEFAULT_ABOUT_EMPOWERING, schema.default)
})

test('normalisasi hanya trim tepi; spasi internal/Unicode dan teks biasa tidak diubah', async () => {
  const input = Object.freeze({
    label: ' \u00a0Mitra  Pilihan\u2003 ',
    title: '\u3000Bisnis e\u0301 & <b>Mitra</b>  ',
    title_accent: ' \ufeffKeahlian 🚀\u00a0 ',
    id: 92,
    updated_at: 'metadata-uji',
    cards: [{ id: 1 }],
    role: 'super_admin',
  })
  await expectAcceptedRecord(input, {
    label: 'Mitra  Pilihan',
    title: 'Bisnis e\u0301 & <b>Mitra</b>',
    title_accent: 'Keahlian 🚀',
  })
  expect(input.label).toBe(' \u00a0Mitra  Pilihan\u2003 ')
  expect(input.id).toBe(92)
})

test.each(['', ' \u00a0\u2003 '])('aksen kosong tetap key eksplisit setelah trim: %j', async (title_accent) => {
  await expectAcceptedRecord({ ...record, title_accent }, { ...record, title_accent: '' })
})

const wrongFieldTypes = [
  { name: 'null', value: null },
  { name: 'undefined', value: undefined },
  { name: 'angka', value: 7 },
  { name: 'boolean', value: false },
  { name: 'array', value: [] },
  { name: 'object', value: {} },
]
const invalidRecords = [
  { name: 'null sebagai payload tulis', value: null },
  { name: 'undefined', value: undefined },
  { name: 'object kosong', value: {} },
  { name: 'array kosong', value: [] },
  { name: 'array record', value: [record] },
  { name: 'string', value: 'bukan record' },
  { name: 'angka', value: 42 },
  { name: 'boolean', value: true },
  ...fields.flatMap(({ field, minLength }) => [
    { name: `${field} hilang`, value: Object.fromEntries(Object.entries(record).filter(([key]) => key !== field)) },
    ...wrongFieldTypes.map(({ name, value }) => ({ name: `${field} berupa ${name}`, value: { ...record, [field]: value } })),
    ...(minLength > 0 ? [
      { name: `${field} kurang dari minimum`, value: { ...record, [field]: 'a'.repeat(minLength - 1) } },
      { name: `${field} hanya whitespace`, value: { ...record, [field]: ' \u00a0\u2003 ' } },
    ] : []),
  ]),
]

test.each(invalidRecords)('validator, GET, dan write menolak nilai invalid sesuai konteks: $name', async ({ value }) => {
  await expectRejectedRecord(value)
})

const controls = [...Array.from({ length: 32 }, (_, code) => code), 0x7f].map((code) => ({
  name: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
  character: String.fromCodePoint(code),
}))

describe.each(fields)('batas schema untuk $field', ({ field, minLength, maxLength }) => {
  test('menerima tepat minimum, termasuk aksen dengan panjang nol', async () => {
    const value = 'a'.repeat(minLength)
    await expectAcceptedRecord({ ...record, [field]: value }, { ...record, [field]: value })
  })

  test('menerima maksimum code point astral setelah trim, tanpa pemotongan', async () => {
    const value = '🚀'.repeat(maxLength)
    expect(value.length).toBeGreaterThan(maxLength)
    await expectAcceptedRecord({ ...record, [field]: ` \u00a0${value}\u3000 ` }, { ...record, [field]: value })
  })

  test.each(['x', '🚀'])('menolak maksimum + 1 code point: %s', async (character) => {
    await expectRejectedRecord({ ...record, [field]: character.repeat(maxLength + 1) })
  })

  test('menghitung combining mark sebagai code point terpisah, bukan grapheme', async () => {
    const value = 'e\u0301'.repeat(Math.floor(maxLength / 2)) + (maxLength % 2 ? 'x' : '')
    await expectAcceptedRecord({ ...record, [field]: value }, { ...record, [field]: value })
    await expectRejectedRecord({ ...record, [field]: `${value}\u0301` })
  })

  test.each(controls)('menolak $name bahkan bila trim dapat membuang kontrol di tepi', async ({ character }) => {
    for (const value of [`${character}Ab`, `A${character}b`, `Ab${character}`]) {
      expect(isAboutEmpoweringRecord({ ...record, [field]: value })).toBe(false)
    }
    await expectRejectedRecord({ ...record, [field]: `Ab${character}` })
  })
})

test('satu emoji bukan dua code point untuk minimum judul', async () => {
  await expectRejectedRecord({ ...record, title: '🚀' })
  await expectAcceptedRecord({ ...record, title: 'e\u0301' }, { ...record, title: 'e\u0301' })
})

const invalidReadEnvelopes = [
  { name: 'null', body: null },
  { name: 'array', body: [] },
  { name: 'string', body: 'bukan envelope' },
  { name: 'boolean', body: true },
  { name: 'angka', body: 1 },
  { name: 'record tanpa envelope', body: record },
  { name: 'success tidak ada dengan record', body: { data: record } },
  { name: 'success tidak ada dengan null', body: { data: null } },
  { name: 'data tidak ada', body: { success: true } },
  { name: 'success false dengan record', body: { success: false, data: record } },
  { name: 'success false dengan null', body: { success: false, data: null } },
  ...['true', 1, null, [], {}].map((success) => ({
    name: `success bukan boolean true: ${JSON.stringify(success)}`, body: { success, data: null },
  })),
]

describe.each(readers)('$name: envelope nullable yang ketat', ({ path, read }) => {
  test('hanya success:true,data:null menandakan belum diatur', async () => {
    server.use(http.get(`*${path}`, () => HttpResponse.json({ success: true, data: null })))
    await expect(read()).resolves.toBeNull()
  })

  test.each(invalidReadEnvelopes)('menolak $name', async ({ body }) => {
    server.use(http.get(`*${path}`, () => HttpResponse.json(body)))
    await expect(read()).rejects.toThrow(/kontrak/)
  })

  test.each([
    { name: '200 kosong', status: 200, body: null },
    { name: '204 tanpa body', status: 204, body: null },
    { name: '200 JSON terpotong', status: 200, body: '{"success":true,"data":' },
    { name: '200 HTML', status: 200, body: '<html>Backend belum siap</html>' },
  ])('menolak $name, bukan mengembalikan null', async ({ body, status }) => {
    server.use(http.get(`*${path}`, () => new HttpResponse(body, {
      status, headers: { 'Content-Type': 'application/json' },
    })))
    await expect(read()).rejects.toThrow(/kontrak/)
  })

  test('mempertahankan pesan error bisnis persis, walaupun data valid', async () => {
    const message = '  Akses pengaturan ditolak penyedia.  '
    server.use(http.get(`*${path}`, () => HttpResponse.json({ success: false, message, data: record })))
    await expect(read()).rejects.toMatchObject({ message })
  })

  test('404 tetap error meskipun body menyerupai status belum diatur', async () => {
    const body = { success: true, data: null }
    server.use(http.get(`*${path}`, () => HttpResponse.json(body, { status: 404 })))
    await expect(read()).rejects.toMatchObject({ response: { status: 404, data: body } })
  })

  test('404 teks route tidak ditutupi nilai bawaan maupun null', async () => {
    server.use(http.get(`*${path}`, () => new HttpResponse('404 page not found', { status: 404 })))
    await expect(read()).rejects.toMatchObject({ response: { status: 404, data: '404 page not found' } })
  })
})

describe.each(writers)('$name: payload singleton', ({ method, status, write }) => {
  test('mengirim tepat tiga key yang dinormalkan, tanpa ID/metadata, dan aksen kosong', async () => {
    const session = seedSession()
    const sent = []
    server.use(http[method](`*${adminPath}`, async ({ request }) => {
      sent.push({
        method: request.method,
        path: new URL(request.url).pathname,
        contentType: request.headers.get('Content-Type'),
        authorization: request.headers.get('Authorization'),
        probe: request.headers.get('X-Contract-Probe'),
        body: await request.json(),
      })
      return HttpResponse.json({ success: true }, { status })
    }))
    await expect(write({
      label: '  Mitra Pilihan  ', title: ' Memberdayakan Mitra ', title_accent: ' ',
      id: 99, created_at: 'metadata-uji', role: 'admin', cards: [],
    }, { headers: { 'X-Contract-Probe': 'uji-lokal' } })).resolves.toBeUndefined()
    expect(sent).toEqual([{
      method: method.toUpperCase(), path: adminPath,
      contentType: 'application/json', authorization: `Bearer ${session.token}`, probe: 'uji-lokal',
      body: { label: 'Mitra Pilihan', title: 'Memberdayakan Mitra', title_accent: '' },
    }])
    expect(Object.keys(sent[0].body).sort()).toEqual([...schema.$defs.payload.required].sort())
  })

  test('204 tanpa acknowledgement tidak membuktikan write diterima', async () => {
    server.use(http[method](`*${adminPath}`, () => new HttpResponse(null, { status: 204 })))
    await expect(write(record)).rejects.toThrow(/mengonfirmasi/)
  })
})

const invalidAcknowledgements = [
  { name: 'null', body: null },
  { name: 'array', body: [] },
  { name: 'boolean', body: true },
  { name: 'angka', body: 1 },
  { name: 'object kosong', body: {} },
  { name: 'hanya data', body: { data: record } },
  { name: 'success false', body: { success: false } },
  { name: 'success string', body: { success: 'true' } },
  { name: 'success angka', body: { success: 1 } },
  { name: 'success null', body: { success: null } },
  { name: 'success object', body: { success: {} } },
  { name: 'success array', body: { success: [] } },
  { name: 'pesan kosong tanpa success', body: { message: '   ' } },
  { name: 'pesan object tanpa success', body: { message: { text: 'diterima' } } },
]

describe.each(mutations)('$name: acknowledgement, bukan bukti persistensi', ({ method, path, invoke }) => {
  test.each([
    { name: 'tanpa data', body: { success: true } },
    { name: 'pesan string kosong', body: { success: true, message: '' } },
    { name: 'pesan string', body: { success: true, message: 'Permintaan diterima.' } },
    { name: 'data null', body: { success: true, data: null } },
    { name: 'data opsional usang/tidak lengkap', body: { success: true, data: { title: 'Lama' } } },
  ])('menerima boolean true $name tanpa mengembalikan data sebagai bukti', async ({ body }) => {
    server.use(http[method](`*${path}`, () => HttpResponse.json(body, { status: method === 'post' ? 201 : 200 })))
    await expect(invoke()).resolves.toBeUndefined()
  })

  test.each(invalidAcknowledgements)('menolak $name', async ({ body }) => {
    server.use(http[method](`*${path}`, () => HttpResponse.json(body)))
    await expect(invoke()).rejects.toThrow(/mengonfirmasi/)
  })

  test.each([
    { name: 'body kosong', body: null },
    { name: 'JSON terpotong', body: '{"success":' },
    { name: 'HTML', body: '<html>OK</html>' },
  ])('menolak 200 dengan $name', async ({ body }) => {
    server.use(http[method](`*${path}`, () => new HttpResponse(body, {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })))
    await expect(invoke()).rejects.toThrow(/mengonfirmasi/)
  })

  test.each(wrongFieldTypes.filter(({ value }) => value !== undefined))(
    'menolak success:true dengan message $name yang melanggar schema acknowledgement', async ({ value }) => {
      server.use(http[method](`*${path}`, () => HttpResponse.json({ success: true, message: value })))
      await expect(invoke()).rejects.toThrow()
    },
  )

  test('error bisnis mempertahankan message asli dan tidak diulang otomatis', async () => {
    let calls = 0
    const message = '  Konflik singleton: muat ulang pengaturan.  '
    server.use(http[method](`*${path}`, () => {
      calls += 1
      return HttpResponse.json({ success: false, message, data: record })
    }))
    await expect(invoke()).rejects.toMatchObject({ message })
    expect(calls).toBe(1)
  })
})

test('DELETE 204 diterima, tanpa body/ID dan tanpa request hapus koleksi kartu', async () => {
  const requests = []
  server.use(http.all('*/api/*', async ({ request }) => {
    requests.push({ method: request.method, path: new URL(request.url).pathname, body: await request.text() })
    return new HttpResponse(null, { status: 204 })
  }))
  await expect(deleteAboutEmpoweringApi()).resolves.toBeUndefined()
  expect(requests).toEqual([{ method: 'DELETE', path: adminPath, body: '' }])
})

describe.each(operations)('$name: error transport dan options', ({ name, method, path, invoke }) => {
  test.each([400, 403, 404, 409, 422, 429, 500, 503])('HTTP %i diteruskan utuh tanpa retry/logout', async (status) => {
    const session = seedSession()
    const body = { success: false, message: 'Pesan asli penyedia.', errors: { title: ['Judul ditolak.'] } }
    let calls = 0
    server.use(http[method](`*${path}`, () => {
      calls += 1
      return HttpResponse.json(body, { status })
    }))
    await expect(invoke()).rejects.toMatchObject({ isAxiosError: true, response: { status, data: body } })
    expect(calls).toBe(1)
    expectSessionPreserved(session)
  })

  test('401 publik mempertahankan sesi; 401 admin mengikuti logout yang ada', async () => {
    const session = seedSession()
    const body = { success: false, message: 'Sesi tidak valid.' }
    server.use(http[method](`*${path}`, () => HttpResponse.json(body, { status: 401 })))
    await expect(invoke()).rejects.toMatchObject({ isAxiosError: true, response: { status: 401, data: body } })
    if (name === 'GET publik') {
      expectSessionPreserved(session)
    } else {
      expect(localStorage.getItem('inotal_token')).toBeNull()
      expect(localStorage.getItem('inotal_user')).toBeNull()
      expect(window.location.hash).toBe('#login')
    }
  })

  test('error jaringan bukan null/acknowledgement dan sesi tidak dihapus', async () => {
    const session = seedSession()
    let calls = 0
    server.use(http[method](`*${path}`, () => {
      calls += 1
      return HttpResponse.error()
    }))
    await expect(invoke()).rejects.toMatchObject({ isAxiosError: true, code: 'ERR_NETWORK' })
    expect(calls).toBe(1)
    expectSessionPreserved(session)
  })

  test('AbortSignal yang sudah dibatalkan mencegah pengiriman request', async () => {
    const session = seedSession()
    let calls = 0
    server.use(http[method](`*${path}`, () => {
      calls += 1
      return HttpResponse.json({ success: true, data: record })
    }))
    const controller = new AbortController()
    controller.abort()
    await expect(invoke({ signal: controller.signal })).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect(calls).toBe(0)
    expectSessionPreserved(session)
  })

  test('AbortSignal saat request berlangsung tetap menjadi pembatalan, bukan error kontrak', async () => {
    const session = seedSession()
    let started
    let release
    const requestStarted = new Promise((resolve) => { started = resolve })
    const responseReleased = new Promise((resolve) => { release = resolve })
    server.use(http[method](`*${path}`, async () => {
      started()
      await responseReleased
      return HttpResponse.json({ success: true, data: record })
    }))
    const controller = new AbortController()
    const rejected = expect(invoke({ signal: controller.signal })).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    try {
      await requestStarted
      controller.abort()
      release()
      await rejected
      expectSessionPreserved(session)
    } finally {
      controller.abort()
      release()
    }
  })
})
