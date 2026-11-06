import { useEffect, useRef, useState } from 'react'
import { Eye, RefreshCw, Save, Upload, X } from 'lucide-react'
import { getHomepageServicesApi, saveHomepageServicesApi, HOMEPAGE_SERVICES_PATH } from '../api/homepageServices'
import { uploadImageApi } from '../api/posts'
import HomepageServicesSection from '../components/HomepageServicesSection'
import ScaledPreview from '../components/ScaledPreview'
import { DEFAULT_HOMEPAGE_SERVICES, HOMEPAGE_SERVICES_LIMITS, SERVICE_COUNT } from '../data/homepageServices'
import { SERVICE_ICONS } from '../data/partnershipServiceIcons'
import { isSafeImageUrl, normalizeImageUrl, validateImageFile } from '../utils/imageUrl'
import {
  getHomepageServicesErrorMessage, isHomepageServicesRecord, toHomepageServicesPayload, validateHomepageServices,
} from '../utils/homepageServices'

const PHOTO_KEYS = ['photo_primary', 'photo_secondary']
const PREVIEW_WIDTH = 1280

const inputClass = 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

function Field({ id, label, value, onChange, maxLength, textarea, error, help }) {
  const shared = {
    id, value, onChange: (event) => onChange(event.target.value), maxLength,
    'aria-invalid': Boolean(error),
    'aria-describedby': `${id}-help${error ? ` ${id}-error` : ''}`,
    className: inputClass,
  }
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-gray-600">{label}</label>
      {textarea ? <textarea {...shared} rows={3} /> : <input {...shared} type="text" />}
      {help && <p id={`${id}-help`} className="mt-1 text-xs text-gray-400">{help}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function HomepageServicesPage({ role }) {
  const currentRole = typeof role === 'object' ? role?.name : role
  const canManage = ['admin', 'super_admin'].includes(currentRole)
  const [form, setForm] = useState(DEFAULT_HOMEPAGE_SERVICES)
  const [photoFiles, setPhotoFiles] = useState({})
  const [photoPreviews, setPhotoPreviews] = useState({})
  const [blobUrls, setBlobUrls] = useState({})
  const [load, setLoad] = useState({ status: 'loading', record: null, message: '' })
  const [refresh, setRefresh] = useState(0)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null)
  const [uploadProgress, setUploadProgress] = useState('')
  const alive = useRef(false)
  const blobUrlsRef = useRef({})
  const locked = busy || Boolean(pending)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  // Simpan salinan terbaru tanpa mencabut blob saat daftar berubah: memilih foto
  // kedua tidak boleh mematikan pratinjau foto pertama yang masih dipakai.
  useEffect(() => { blobUrlsRef.current = blobUrls }, [blobUrls])
  useEffect(() => () => {
    Object.values(blobUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    if (!canManage) return undefined
    const controller = new AbortController()
    getHomepageServicesApi({ signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setLoad({ status: 'ready', record, message: '' })
        setForm(record ?? DEFAULT_HOMEPAGE_SERVICES)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = err?.response?.status === 404
          ? `Pengaturan layanan belum tersedia di backend. Endpoint GET /api${HOMEPAGE_SERVICES_PATH} perlu disediakan; simpan belum diaktifkan.`
          : getHomepageServicesErrorMessage(err, 'Gagal memuat layanan Beranda. Periksa koneksi lalu Muat Ulang.')
        setLoad({ status: 'error', record: null, message })
      })
    return () => controller.abort()
  }, [canManage, refresh])

  const clearPhoto = (key) => {
    if (blobUrls[key]) URL.revokeObjectURL(blobUrls[key])
    setBlobUrls((current) => { const next = { ...current }; delete next[key]; return next })
    setPhotoFiles((current) => { const next = { ...current }; delete next[key]; return next })
    setPhotoPreviews((current) => { const next = { ...current }; delete next[key]; return next })
  }

  const selectPhoto = (key, event) => {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen || locked || !canManage) return
    const validation = validateImageFile(chosen)
    if (validation) { setErrors((current) => ({ ...current, [`${key}_url`]: validation })); return }
    try {
      const url = URL.createObjectURL(chosen)
      clearPhoto(key)
      setBlobUrls((current) => ({ ...current, [key]: url }))
      setPhotoFiles((current) => ({ ...current, [key]: chosen }))
      setPhotoPreviews((current) => ({ ...current, [key]: url }))
      setErrors((current) => ({ ...current, [`${key}_url`]: '' }))
      setNotice('')
      setError('')
    } catch {
      setErrors((current) => ({ ...current, [`${key}_url`]: 'Pratinjau foto tidak dapat dibuat. Coba pilih file lagi.' }))
    }
  }

  const setField = (key, value) => {
    if (locked) return
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setNotice('')
    setError('')
  }

  const setService = (index, key, value) => {
    if (locked) return
    setForm((current) => ({
      ...current,
      services: current.services.map((service, i) => (i === index ? { ...service, [key]: value } : service)),
    }))
    setErrors((current) => ({ ...current, [`service-${index}-${key}`]: '' }))
    setNotice('')
    setError('')
  }

  const verify = async (payload) => {
    const record = await getHomepageServicesApi()
    if (!alive.current) return
    if (!isHomepageServicesRecord(record) || JSON.stringify(toHomepageServicesPayload(record)) !== JSON.stringify(payload)) {
      throw new Error('Layanan terkirim, tetapi hasil baca ulang belum sesuai. Pilih Verifikasi Ulang tanpa mengirim ulang.')
    }
    setLoad({ status: 'ready', record, message: '' })
    setForm(toHomepageServicesPayload(record))
    setPending(null)
    setNotice('Layanan Beranda berhasil disimpan.')
  }

  const save = async (event) => {
    event.preventDefault()
    if (!canManage || locked || load.status !== 'ready') return
    const invalid = validateHomepageServices(form)
    PHOTO_KEYS.forEach((key) => { if (photoFiles[key]) delete invalid[`${key}_url`] })
    setErrors(invalid)
    const first = Object.keys(invalid)[0]
    if (first) { document.getElementById(`svc-${first}`)?.focus(); return }
    const payload = toHomepageServicesPayload(form)
    setBusy(true)
    setError('')
    setNotice('')
    let accepted = false
    try {
      for (const key of PHOTO_KEYS) {
        if (!photoFiles[key]) continue
        setUploadProgress(`Mengunggah ${key === 'photo_primary' ? 'foto utama' : 'foto kedua'}...`)
        const url = normalizeImageUrl(await uploadImageApi(photoFiles[key]))
        if (!alive.current) return
        if (!isSafeImageUrl(url)) throw new Error('Backend tidak mengembalikan URL foto yang valid. Pilihan foto tetap dipertahankan.')
        payload[`${key}_url`] = url
        setForm((current) => ({ ...current, [`${key}_url`]: url }))
        clearPhoto(key)
      }
      setUploadProgress('')
      await saveHomepageServicesApi(payload)
      if (!alive.current) return
      accepted = true
      setPending(payload)
      await verify(payload)
    } catch (err) {
      if (alive.current) setError(getHomepageServicesErrorMessage(err, accepted
        ? 'Layanan terkirim, tetapi belum dapat diverifikasi. Pilih Verifikasi Ulang.'
        : 'Gagal menyimpan layanan Beranda. Isian tetap disimpan di formulir.'))
    } finally {
      if (alive.current) { setBusy(false); setUploadProgress('') }
    }
  }

  const reload = async () => {
    if (busy || !canManage) return
    setError('')
    setNotice('')
    if (!pending) {
      PHOTO_KEYS.forEach(clearPhoto)
      setForm(DEFAULT_HOMEPAGE_SERVICES)
      setErrors({})
      setLoad({ status: 'loading', record: null, message: '' })
      setRefresh((value) => value + 1)
      return
    }
    setBusy(true)
    try { await verify(pending) }
    catch (err) {
      if (alive.current) setError(getHomepageServicesErrorMessage(err, 'Hasil simpan belum dapat diverifikasi. Coba Verifikasi Ulang.'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  if (!canManage) return <p role="alert" className="text-sm text-red-600">Kamu tidak memiliki akses untuk mengatur layanan Beranda.</p>

  const previewRecord = {
    ...form,
    photo_primary_url: photoPreviews.photo_primary || normalizeImageUrl(form.photo_primary_url),
    photo_secondary_url: photoPreviews.photo_secondary || normalizeImageUrl(form.photo_secondary_url),
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">Beranda · Layanan Kami</p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Kartu Layanan</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
            Atur label, judul, deskripsi, dua foto, badge, dan empat kartu layanan pada bagian “Layanan Kami” di Beranda.
            Muat Ulang mengambil data server dan membuang draf yang belum disimpan.
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
        <p role="status" className="rounded-2xl border border-sky-100 bg-white p-8 text-sm text-gray-500">Memuat layanan...</p>
      ) : (
        <>
          {load.status === 'error' && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{load.message}</p>}
          {load.status === 'ready' && !load.record && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Belum diatur. Teks bawaan ditampilkan sampai perubahan disimpan.</p>}
          <form aria-label="Kartu layanan Beranda" onSubmit={save} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <fieldset disabled={locked} className="min-w-0 space-y-4">
              <legend className="sr-only">Isi kartu layanan Beranda</legend>

              <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800">Label dan judul</h2>
                <Field id="svc-eyebrow" label="Label kecil" value={form.eyebrow} onChange={(value) => setField('eyebrow', value)}
                  maxLength={HOMEPAGE_SERVICES_LIMITS.eyebrow} error={errors.eyebrow}
                  help={`${form.eyebrow.length}/${HOMEPAGE_SERVICES_LIMITS.eyebrow} karakter`} />
                <Field id="svc-title" label="Judul bagian" value={form.title} onChange={(value) => setField('title', value)}
                  maxLength={HOMEPAGE_SERVICES_LIMITS.title} error={errors.title} />
                <Field id="svc-description" label="Deskripsi bagian" value={form.description} onChange={(value) => setField('description', value)}
                  maxLength={HOMEPAGE_SERVICES_LIMITS.description} error={errors.description} textarea
                  help={`${form.description.length}/${HOMEPAGE_SERVICES_LIMITS.description} karakter`} />
              </div>

              <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800">Badge di atas foto</h2>
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <Field id="svc-badge_value" label="Angka badge" value={form.badge_value} onChange={(value) => setField('badge_value', value)}
                    maxLength={HOMEPAGE_SERVICES_LIMITS.badge_value} error={errors.badge_value} />
                  <Field id="svc-badge_label" label="Label badge" value={form.badge_label} onChange={(value) => setField('badge_label', value)}
                    maxLength={HOMEPAGE_SERVICES_LIMITS.badge_label} error={errors.badge_label} />
                </div>
              </div>

              {PHOTO_KEYS.map((key, index) => (
                <div key={key} className="space-y-3 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-800">{index === 0 ? 'Foto utama (belakang)' : 'Foto kedua (depan)'}</h2>
                  <input id={`svc-${key}-file`} type="file" accept="image/jpeg,image/png,image/webp"
                    aria-label={`Pilih ${index === 0 ? 'foto utama' : 'foto kedua'}`} onChange={(event) => selectPhoto(key, event)}
                    className="peer sr-only" />
                  <label htmlFor={`svc-${key}-file`} className={`inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-xs font-semibold text-sky-700 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 ${locked ? 'opacity-50' : 'cursor-pointer hover:bg-sky-100'}`}>
                    <Upload size={14} aria-hidden="true" />Pilih Foto
                  </label>
                  {photoFiles[key] && (
                    <button type="button" onClick={() => clearPhoto(key)} aria-label={`Batal pilih ${index === 0 ? 'foto utama' : 'foto kedua'}`}
                      className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100">
                      <X size={14} aria-hidden="true" />Batal pilihan
                    </button>
                  )}
                  <p className="text-xs leading-relaxed text-gray-500">JPG, PNG, atau WEBP; maksimal 5 MB. Foto dipratinjau sekarang dan diunggah saat Simpan.</p>
                  {photoFiles[key] && <p className="break-all text-xs font-medium text-sky-700">{photoFiles[key].name} — belum diunggah</p>}
                  <Field id={`svc-${key}_url`} label={`URL ${index === 0 ? 'foto utama' : 'foto kedua'}`} value={form[`${key}_url`]}
                    onChange={(value) => { clearPhoto(key); setField(`${key}_url`, value) }} maxLength={2048}
                    error={errors[`${key}_url`]} help="https://... atau /uploads/..." />
                  <Field id={`svc-${key}_alt`} label={`Teks alternatif ${index === 0 ? 'foto utama' : 'foto kedua'}`} value={form[`${key}_alt`]}
                    onChange={(value) => setField(`${key}_alt`, value)} maxLength={160} error={errors[`${key}_alt`]} />
                </div>
              ))}

              {Array.from({ length: SERVICE_COUNT }, (_, index) => {
                const service = form.services[index] ?? { icon: 'monitor-cog', title: '', description: '' }
                const number = index + 1
                return (
                  <div key={index} className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-800">Kartu {number}</h2>
                    <div>
                      <label htmlFor={`svc-service-${index}-icon`} className="text-xs font-semibold text-gray-600">Ikon kartu {number}</label>
                      <select id={`svc-service-${index}-icon`} value={service.icon}
                        onChange={(event) => setService(index, 'icon', event.target.value)}
                        aria-invalid={Boolean(errors[`service-${index}-icon`])}
                        aria-describedby={errors[`service-${index}-icon`] ? `svc-service-${index}-icon-error` : undefined}
                        className={inputClass}>
                        {SERVICE_ICONS.map((icon) => <option key={icon.value} value={icon.value}>{icon.label}</option>)}
                      </select>
                      {errors[`service-${index}-icon`] && <p id={`svc-service-${index}-icon-error`} role="alert" className="mt-1 text-xs text-red-600">{errors[`service-${index}-icon`]}</p>}
                    </div>
                    <Field id={`svc-service-${index}-title`} label={`Judul kartu ${number}`} value={service.title}
                      onChange={(value) => setService(index, 'title', value)} maxLength={HOMEPAGE_SERVICES_LIMITS.service_title}
                      error={errors[`service-${index}-title`]} />
                    <Field id={`svc-service-${index}-description`} label={`Deskripsi kartu ${number}`} value={service.description}
                      onChange={(value) => setService(index, 'description', value)} maxLength={HOMEPAGE_SERVICES_LIMITS.service_description}
                      error={errors[`service-${index}-description`]} textarea />
                  </div>
                )
              })}

              {uploadProgress && <p role="status" className="text-sm text-sky-700">{uploadProgress}</p>}
              <button type="submit" disabled={locked || load.status !== 'ready'} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                <Save size={16} aria-hidden="true" />{busy ? 'Menyimpan...' : 'Simpan Layanan'}
              </button>
            </fieldset>

            <section aria-label="Pratinjau kartu layanan" className="min-w-0 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-sky-50 px-5 py-4">
                <Eye size={16} aria-hidden="true" className="text-sky-500" />
                <h2 className="text-sm font-bold text-gray-800">Pratinjau bagian</h2>
              </div>
              <p className="px-5 pt-3 text-xs leading-relaxed text-gray-500">Diskalakan dari lebar desktop {PREVIEW_WIDTH}px, jadi proporsinya sama berapa pun lebar panel atau zoom browser.</p>
              <div className="max-h-[560px] overflow-y-auto">
                <ScaledPreview>
                  <HomepageServicesSection services={previewRecord} preview />
                </ScaledPreview>
              </div>
            </section>
          </form>
        </>
      )}
    </div>
  )
}
