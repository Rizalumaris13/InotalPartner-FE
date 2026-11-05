import { useEffect, useRef, useState } from 'react'
import { Images, RefreshCw, Save, Upload, X } from 'lucide-react'
import { getJoinImagesApi, saveJoinImagesApi, JOIN_IMAGES_PATH } from '../api/homepageJoinImages'
import { uploadImageApi } from '../api/posts'
import { JoinImageCollage } from '../components/HomepageJoinImages'
import { DEFAULT_JOIN_IMAGES, JOIN_IMAGE_SLOTS } from '../data/homepageJoinImages'
import {
  getJoinImagesErrorMessage, isJoinImageUrl, isJoinImagesRecord, normalizeJoinImageUrl,
  JOIN_IMAGE_MIME_TYPES, MAX_JOIN_IMAGE_URL_LENGTH, toJoinImagesPayload, validateJoinImageFile,
} from '../utils/homepageJoinImages'

export default function HomepageJoinImagesPage({ role }) {
  const currentRole = typeof role === 'object' ? role?.name : role
  const canManage = ['admin', 'super_admin'].includes(currentRole)
  const [form, setForm] = useState(DEFAULT_JOIN_IMAGES)
  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})
  const [uploadProgress, setUploadProgress] = useState('')
  const objectUrls = useRef({})
  const [load, setLoad] = useState({ status: 'loading', record: null, message: '' })
  const [refresh, setRefresh] = useState(0)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null)
  const alive = useRef(false)
  const locked = busy || Boolean(pending)

  useEffect(() => {
    alive.current = true
    const allocated = objectUrls.current
    return () => {
      alive.current = false
      Object.values(allocated).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (!canManage) return undefined
    const controller = new AbortController()
    getJoinImagesApi({ signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setLoad({ status: 'ready', record, message: '' })
        setForm(record ? toJoinImagesPayload(record) : DEFAULT_JOIN_IMAGES)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = err?.response?.status === 404
          ? `Pengaturan kolase belum tersedia di backend. Endpoint GET /api${JOIN_IMAGES_PATH} perlu disediakan; simpan belum diaktifkan.`
          : getJoinImagesErrorMessage(err, 'Gagal memuat gambar kolase. Periksa koneksi lalu Muat Ulang.')
        setLoad({ status: 'error', record: null, message })
      })
    return () => controller.abort()
  }, [canManage, refresh])

  const clearFile = (key) => {
    if (objectUrls.current[key]) {
      URL.revokeObjectURL(objectUrls.current[key])
      delete objectUrls.current[key]
    }
    setFiles((current) => { const next = { ...current }; delete next[key]; return next })
    setPreviews((current) => { const next = { ...current }; delete next[key]; return next })
  }

  const selectFile = (key, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || locked || !canManage) return
    const validation = validateJoinImageFile(file)
    if (validation) { setErrors((current) => ({ ...current, [key]: validation })); return }
    try {
      const url = URL.createObjectURL(file)
      clearFile(key)
      objectUrls.current[key] = url
      setFiles((current) => ({ ...current, [key]: file }))
      setPreviews((current) => ({ ...current, [key]: url }))
      setErrors((current) => ({ ...current, [key]: '' }))
      setNotice('')
      setError('')
    } catch {
      setErrors((current) => ({ ...current, [key]: 'Pratinjau foto tidak dapat dibuat. Coba pilih file lagi.' }))
    }
  }

  const updateUrl = (key, value) => {
    clearFile(key)
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setNotice('')
    setError('')
  }

  // Muat Ulang adalah permintaan data server, jadi draf lokal dibuang utuh.
  const discardDraft = () => {
    Object.keys(objectUrls.current).forEach((key) => {
      URL.revokeObjectURL(objectUrls.current[key])
      delete objectUrls.current[key]
    })
    setFiles({})
    setPreviews({})
    setErrors({})
    setForm(DEFAULT_JOIN_IMAGES)
  }

  const verify = async (payload) => {
    const record = await getJoinImagesApi()
    if (!alive.current) return
    if (!isJoinImagesRecord(record) || JOIN_IMAGE_SLOTS.some(({ key }) => record[key] !== payload[key])) {
      throw new Error('Gambar terkirim, tetapi hasil baca ulang belum sesuai. Pilih Verifikasi Ulang tanpa mengirim ulang.')
    }
    setLoad({ status: 'ready', record, message: '' })
    setForm(toJoinImagesPayload(record))
    setPending(null)
    setNotice('Gambar kolase berhasil disimpan.')
  }

  const save = async (event) => {
    event.preventDefault()
    if (!canManage || locked || load.status !== 'ready') return
    const payload = toJoinImagesPayload(form)
    const invalid = Object.fromEntries(JOIN_IMAGE_SLOTS
      .map(({ key }) => [key, files[key]
        ? validateJoinImageFile(files[key])
        : isJoinImageUrl(payload[key]) ? '' : 'Pilih foto atau isi URL http/https atau path /uploads/ gambar JPG, PNG, atau WEBP.'])
      .filter(([, message]) => message))
    setErrors(invalid)
    const first = Object.keys(invalid)[0]
    if (first) { document.getElementById(`join-${first}`)?.focus(); return }
    setBusy(true)
    setError('')
    setNotice('')
    let accepted = false
    try {
      for (const slot of JOIN_IMAGE_SLOTS) {
        if (!files[slot.key]) continue
        setUploadProgress(`Mengunggah ${slot.label.toLowerCase()}...`)
        const url = normalizeJoinImageUrl(await uploadImageApi(files[slot.key]))
        if (!alive.current) return
        if (!isJoinImageUrl(url)) throw new Error('Backend tidak mengembalikan URL foto yang valid. Pilihan foto tetap dipertahankan.')
        payload[slot.key] = url
        setForm((current) => ({ ...current, [slot.key]: url }))
        clearFile(slot.key)
      }
      setUploadProgress('')
      await saveJoinImagesApi(payload)
      if (!alive.current) return
      accepted = true
      setPending(payload)
      await verify(payload)
    } catch (err) {
      if (alive.current) setError(getJoinImagesErrorMessage(err, accepted
        ? 'Gambar terkirim, tetapi belum dapat diverifikasi. Pilih Verifikasi Ulang.'
        : 'Gagal menyimpan gambar kolase. Isian tetap disimpan di formulir.'))
    } finally {
      if (alive.current) { setBusy(false); setUploadProgress('') }
    }
  }

  const reload = async () => {
    if (busy || !canManage) return
    setError('')
    setNotice('')
    if (!pending) {
      discardDraft()
      setLoad({ status: 'loading', record: null, message: '' })
      setRefresh((value) => value + 1)
      return
    }
    setBusy(true)
    try { await verify(pending) }
    catch (err) {
      if (alive.current) setError(getJoinImagesErrorMessage(err, 'Hasil simpan belum dapat diverifikasi. Coba Verifikasi Ulang.'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  if (!canManage) return <p role="alert" className="text-sm text-red-600">Kamu tidak memiliki akses untuk mengatur gambar kolase.</p>

  const normalizedForm = toJoinImagesPayload(form)
  const preview = Object.fromEntries(JOIN_IMAGE_SLOTS.map(({ key }) => [
    key, previews[key] || (isJoinImageUrl(normalizedForm[key]) ? normalizedForm[key] : DEFAULT_JOIN_IMAGES[key]),
  ]))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">Beranda · Mengapa Bergabung</p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Gambar Kolase</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
            Ganti tiga foto di tengah bagian “Saatnya Bersama Beraksi”. Judul, enam kartu, dan banner halaman tidak berubah.
            Muat Ulang mengambil data server dan membuang draf foto/URL yang belum disimpan.
          </p>
        </div>
        <button type="button" onClick={reload} disabled={busy || load.status === 'loading'}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50">
          <RefreshCw size={16} aria-hidden="true" />{pending ? 'Verifikasi Ulang' : 'Muat Ulang'}
        </button>
      </div>
      {notice && <p role="status" className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {load.status === 'loading' ? (
        <p role="status" className="rounded-2xl border border-sky-100 bg-white p-8 text-sm text-gray-500">Memuat gambar kolase...</p>
      ) : (
        <>
          {load.status === 'error' && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{load.message}</p>}
          {load.status === 'ready' && !load.record && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Kolase belum diatur. Foto bawaan ditampilkan sampai perubahan disimpan.</p>}
          <form aria-label="Gambar kolase Mengapa Bergabung" onSubmit={save} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <fieldset disabled={locked} className="min-w-0 space-y-4">
              {JOIN_IMAGE_SLOTS.map((slot) => (
                <div key={slot.key} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-gray-800">{slot.label}</h2>
                  <div className="mb-4">
                    <input id={`join-file-${slot.key}`} type="file" accept={JOIN_IMAGE_MIME_TYPES.join(',')}
                      aria-label={`Pilih ${slot.label.toLowerCase()}`} onChange={(event) => selectFile(slot.key, event)}
                      aria-invalid={Boolean(errors[slot.key])} aria-describedby={`join-file-help-${slot.key}${errors[slot.key] ? ` join-error-${slot.key}` : ''}`}
                      className="peer sr-only" />
                    <label htmlFor={`join-file-${slot.key}`} className={`inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-xs font-semibold text-sky-700 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 ${locked ? 'opacity-50' : 'cursor-pointer hover:bg-sky-100'}`}>
                      <Upload size={14} aria-hidden="true" />Pilih Foto
                    </label>
                    {files[slot.key] && <button type="button" onClick={() => clearFile(slot.key)} aria-label={`Batal pilih ${slot.label.toLowerCase()}`}
                      className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100">
                      <X size={14} aria-hidden="true" />Batal pilihan
                    </button>}
                    <p id={`join-file-help-${slot.key}`} className="mt-2 text-xs leading-relaxed text-gray-500">JPG, PNG, atau WEBP; maksimal 5 MB. Foto dipratinjau sekarang dan diunggah saat Simpan.</p>
                    {files[slot.key] && <p className="mt-1 break-all text-xs font-medium text-sky-700">{files[slot.key].name} — belum diunggah</p>}
                  </div>
                  <label htmlFor={`join-${slot.key}`} className="text-xs font-semibold text-gray-600">URL {slot.label.toLowerCase()}</label>
                  <input id={`join-${slot.key}`} value={form[slot.key]} onChange={(event) => updateUrl(slot.key, event.target.value)}
                    maxLength={MAX_JOIN_IMAGE_URL_LENGTH} placeholder="https://... atau /uploads/..."
                    aria-invalid={Boolean(errors[slot.key])} aria-describedby={errors[slot.key] ? `join-error-${slot.key}` : undefined}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                  {errors[slot.key] && <p id={`join-error-${slot.key}`} role="alert" className="mt-2 text-xs text-red-600">{errors[slot.key]}</p>}
                </div>
              ))}
              {uploadProgress && <p role="status" className="text-sm text-sky-700">{uploadProgress}</p>}
              <button type="submit" disabled={locked || load.status !== 'ready'} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                <Save size={16} aria-hidden="true" />{busy ? 'Menyimpan...' : 'Simpan Gambar'}
              </button>
            </fieldset>
            <section role="region" aria-label="Pratinjau kolase Mengapa Bergabung" className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"><Images size={16} aria-hidden="true" className="text-sky-500" />Pratinjau kolase</h2>
              <p className="text-xs leading-relaxed text-gray-500">Kiri atas dan kanan bawah berada di belakang foto utama. Posisi foto mengikuti tampilan Beranda.</p>
              <div className="flex min-h-[400px] items-center justify-center px-1 py-6"><JoinImageCollage images={preview} /></div>
            </section>
          </form>
        </>
      )}
    </div>
  )
}
