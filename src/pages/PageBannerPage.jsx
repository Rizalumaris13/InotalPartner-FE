import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Save, Trash2, Upload } from 'lucide-react'
import PartnerDialog from '../components/PartnerDialog'
import { resolveImageUrl, uploadImageApi } from '../api/posts'
import {
  createPageBannerApi,
  deletePageBannerApi,
  getPageBannerApi,
  updatePageBannerApi,
} from '../api/pageBanners'
import { DEFAULT_PAGE_BANNERS, getPageBannerMeta } from '../data/pageBanners'
import {
  getPageBannerErrorMessage,
  isPageBannerRecord,
  toPageBannerPayload,
  validateBannerImageFile,
  validatePageBannerForm,
} from '../utils/pageBanners'

const emptyForm = { label: '', title: '', description: '', image_url: '' }
const inputClass =
  'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
const fieldIds = {
  label: 'banner-label',
  title: 'banner-title',
  description: 'banner-description',
  image_url: 'banner-image-url',
}

function FieldError({ id, message }) {
  return message ? (
    <p id={id} role="alert" className="mt-2 text-xs text-red-600">
      {message}
    </p>
  ) : null
}

export default function PageBannerPage({ pageKey, role }) {
  const canManage = ['admin', 'super_admin'].includes(role)
  const meta = getPageBannerMeta(pageKey)
  const pageName = meta?.name || pageKey
  const [result, setResult] = useState({ status: 'loading', record: null, message: '' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const labelRef = useRef(null)
  const busy = saving || uploading || deleting
  const savedRecord = result.record

  useEffect(() => {
    if (!canManage || !meta) return undefined
    const controller = new AbortController()
    const load = async () => {
      try {
        const record = await getPageBannerApi(pageKey, { signal: controller.signal })
        if (controller.signal.aborted) return
        setResult({ status: 'ready', record, message: '' })
        setForm(record ? toPageBannerPayload(record) : emptyForm)
        setErrors({})
      } catch (err) {
        if (controller.signal.aborted) return
        if (err?.response?.status === 404) {
          setResult({ status: 'ready', record: null, message: '' })
          setForm(emptyForm)
          setErrors({})
          return
        }
        const backendMessage = getPageBannerErrorMessage(err, '')
        setResult({
          status: 'error',
          record: null,
          message:
            backendMessage ||
            `Banner ${pageName} belum dapat dimuat. Pastikan backend dan endpoint GET /api/page-banners/${pageKey} tersedia.`,
        })
      }
    }
    load()
    return () => controller.abort()
  }, [canManage, meta, pageKey, pageName, refreshKey])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const reload = useCallback(() => {
    setNotice('')
    setError('')
    setResult({ status: 'loading', record: null, message: '' })
    setRefreshKey((key) => key + 1)
  }, [])

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    const validationError = validateBannerImageFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }
    setUploading(true)
    setUploadError('')
    setError('')
    try {
      const url = await uploadImageApi(file)
      if (!url) throw new Error('Backend tidak mengembalikan URL gambar.')
      updateField('image_url', url)
    } catch (err) {
      setUploadError(getPageBannerErrorMessage(err, 'Gagal mengunggah gambar. Coba lagi.'))
    } finally {
      setUploading(false)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    if (busy || result.status !== 'ready') return
    const validationErrors = validatePageBannerForm({ ...form, page: pageKey })
    setErrors(validationErrors)
    const firstError = Object.keys(validationErrors)[0]
    if (firstError) {
      document.getElementById(fieldIds[firstError])?.focus()
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    const payload = toPageBannerPayload(form)
    try {
      if (savedRecord) await updatePageBannerApi(pageKey, payload)
      else await createPageBannerApi(pageKey, payload)
      // Bukti simpan = baca ulang target yang sama, bukan respons tulis saja.
      const record = await getPageBannerApi(pageKey)
      if (!isPageBannerRecord(record, pageKey)) {
        throw new Error(
          `Banner terkirim, tetapi GET /api/page-banners/${pageKey} belum mengembalikan data yang bisa diverifikasi. Coba Muat Ulang.`,
        )
      }
      setResult({ status: 'ready', record, message: '' })
      setForm(toPageBannerPayload(record))
      setNotice('Banner berhasil disimpan.')
    } catch (err) {
      setError(
        getPageBannerErrorMessage(
          err,
          `Endpoint simpan /api/page-banners/${pageKey} belum tersedia di backend.`,
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const removeBanner = async () => {
    setDeleting(true)
    setError('')
    try {
      await deletePageBannerApi(pageKey)
      const record = await getPageBannerApi(pageKey)
      if (record !== null) throw new Error('Backend masih mengembalikan banner setelah penghapusan.')
      setResult({ status: 'ready', record: null, message: '' })
      setForm(emptyForm)
      setConfirmDelete(false)
      setNotice('Banner berhasil dihapus.')
    } catch (err) {
      setConfirmDelete(false)
      setError(
        getPageBannerErrorMessage(
          err,
          `Gagal menghapus banner ${pageName}. Coba Muat Ulang sebelum mencoba lagi.`,
        ),
      )
    } finally {
      setDeleting(false)
    }
  }

  const preview = useMemo(() => {
    const fallback = DEFAULT_PAGE_BANNERS[pageKey] || emptyForm
    return {
      label: form.label || fallback.label || 'Label banner',
      title: form.title || pageName,
      description: form.description || fallback.description || 'Deskripsi banner halaman.',
      image: resolveImageUrl(form.image_url || ''),
    }
  }, [form, pageKey, pageName])

  if (!meta)
    return (
      <p role="alert" className="text-sm text-red-600">
        Key halaman banner tidak dikenal.
      </p>
    )

  if (!canManage)
    return (
      <p role="alert" className="text-sm text-red-600">
        Kamu tidak memiliki akses untuk mengatur banner {pageName}.
      </p>
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Banner {pageName}</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
            Atur label, judul, deskripsi, dan gambar banner paling atas halaman {pageName}. Perubahan
            hanya berlaku untuk halaman ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={busy || result.status === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Muat Ulang
          </button>
          {savedRecord && (
            <button
              type="button"
              onClick={() => {
                setNotice('')
                setError('')
                setConfirmDelete(true)
              }}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" />
              Hapus Banner
            </button>
          )}
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {notice}
        </p>
      )}

      {result.status === 'loading' ? (
        <p role="status" className="rounded-2xl border border-sky-100 bg-white p-10 text-center text-sm text-gray-500">
          Memuat banner {pageName}...
        </p>
      ) : (
        <>
          {result.status === 'ready' && !savedRecord && (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Banner halaman ini belum diatur. Halaman publik masih memakai teks bawaan.
            </p>
          )}
          <form
            aria-label={`Banner ${pageName}`}
            onSubmit={save}
            noValidate
            className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]"
          >
            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
              <fieldset disabled={busy} className="space-y-5">
                {result.status === 'error' && (
                  <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                    {result.message}
                  </p>
                )}
                {error && (
                  <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <div>
                  <label htmlFor="banner-label" className="text-sm font-semibold text-gray-700">
                    Label
                  </label>
                  <input
                    ref={labelRef}
                    id="banner-label"
                    value={form.label}
                    onChange={(event) => updateField('label', event.target.value)}
                    placeholder={DEFAULT_PAGE_BANNERS[pageKey]?.label}
                    aria-invalid={Boolean(errors.label)}
                    aria-describedby={`banner-label-help${errors.label ? ' banner-label-error' : ''}`}
                    className={inputClass}
                  />
                  <p id="banner-label-help" className="mt-2 text-xs text-gray-500">
                    Teks kecil di atas judul, misalnya “Siapa Kami — Sejak 2019”.
                  </p>
                  <FieldError id="banner-label-error" message={errors.label} />
                </div>
                <div>
                  <label htmlFor="banner-title" className="text-sm font-semibold text-gray-700">
                    Judul
                  </label>
                  <input
                    id="banner-title"
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    placeholder={DEFAULT_PAGE_BANNERS[pageKey]?.title}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={`banner-title-help${errors.title ? ' banner-title-error' : ''}`}
                    className={inputClass}
                  />
                  <p id="banner-title-help" className="mt-2 text-xs text-gray-500">
                    Judul utama banner. Navbar dan breadcrumb mengikuti nama halaman, bukan judul ini.
                  </p>
                  <FieldError id="banner-title-error" message={errors.title} />
                </div>
                <div>
                  <label htmlFor="banner-description" className="text-sm font-semibold text-gray-700">
                    Deskripsi
                  </label>
                  <textarea
                    id="banner-description"
                    rows={4}
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder={DEFAULT_PAGE_BANNERS[pageKey]?.description}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={`banner-description-help${errors.description ? ' banner-description-error' : ''}`}
                    className={`${inputClass} resize-y`}
                  />
                  <p id="banner-description-help" className="mt-2 text-xs text-gray-500">
                    Tampil di kolom kanan banner. Maksimal 600 karakter.
                  </p>
                  <FieldError id="banner-description-error" message={errors.description} />
                </div>
                <div>
                  <label htmlFor="banner-image-url" className="text-sm font-semibold text-gray-700">
                    URL Gambar
                  </label>
                  <input
                    id="banner-image-url"
                    value={form.image_url}
                    onChange={(event) => updateField('image_url', event.target.value)}
                    placeholder="https://... atau /uploads/..."
                    aria-invalid={Boolean(errors.image_url)}
                    aria-describedby={`banner-image-help${errors.image_url ? ' banner-image-error' : ''}`}
                    className={inputClass}
                  />
                  <p id="banner-image-help" className="mt-2 text-xs text-gray-500">
                    JPG, PNG, atau WEBP. Maksimal 5 MB. Rasio lebar disarankan sekitar 1600 × 500.
                  </p>
                  <FieldError id="banner-image-error" message={errors.image_url} />
                  <div className="mt-3">
                    <input
                      id="banner-image-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={uploadImage}
                      aria-label="Unggah Gambar"
                      aria-invalid={Boolean(uploadError)}
                      aria-describedby={`banner-upload-help${uploadError ? ' banner-upload-error' : ''}`}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="banner-image-file"
                      className={`inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-xs font-semibold text-sky-700 peer-focus:ring-2 peer-focus:ring-sky-400 ${busy ? 'opacity-50' : 'cursor-pointer hover:bg-sky-100'}`}
                    >
                      <Upload size={15} aria-hidden="true" />
                      Unggah Gambar
                    </label>
                    <p id="banner-upload-help" className="mt-2 text-xs text-gray-500">
                      File langsung diunggah, lalu URL-nya dipakai saat Simpan.
                    </p>
                    {uploading && (
                      <p role="status" className="mt-2 text-xs text-sky-700">
                        Mengunggah gambar...
                      </p>
                    )}
                    <FieldError id="banner-upload-error" message={uploadError} />
                  </div>
                </div>
              </fieldset>
              <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-sky-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({})
                    setError('')
                    setNotice('')
                    setForm(toPageBannerPayload(DEFAULT_PAGE_BANNERS[pageKey] || emptyForm))
                  }}
                  disabled={busy}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Isi Teks Bawaan
                </button>
                <button
                  type="submit"
                  disabled={busy || result.status !== 'ready'}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <Save size={16} aria-hidden="true" />
                  {saving ? 'Menyimpan...' : 'Simpan Banner'}
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImagePlus size={16} aria-hidden="true" className="text-sky-500" />
                Pratinjau
              </div>
              <div
                role="region"
                aria-label="Pratinjau banner"
                className="overflow-hidden rounded-2xl bg-[#0c4a6e] shadow-sm"
              >
                <div className="relative min-h-[240px]">
                  {preview.image ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-60"
                      style={{ backgroundImage: `url('${preview.image}')` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-700/60 to-[#0c4a6e]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0c4a6e]/85 via-[#0c4a6e]/55 to-[#0c4a6e]/85" />
                  <div className="relative p-5 sm:p-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">
                      {preview.label}
                    </p>
                    <h2 className="mb-4 text-2xl font-extrabold leading-tight tracking-tight text-white break-words">
                      {preview.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-white/70 break-words">{preview.description}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Pratinjau memakai data formulir, termasuk teks bawaan saat kolom masih kosong.
              </p>
            </section>
          </form>
        </>
      )}

      {confirmDelete && (
        <PartnerDialog
          role="alertdialog"
          labelledBy="banner-delete-title"
          describedBy="banner-delete-desc"
          busy={deleting}
          onClose={() => setConfirmDelete(false)}
          maxWidth="max-w-md"
        >
          <div className="p-6">
            <h2 id="banner-delete-title" className="text-lg font-extrabold text-gray-900">
              Hapus Banner?
            </h2>
            <p id="banner-delete-desc" className="mt-2 text-sm leading-relaxed text-gray-600">
              Konfigurasi banner {pageName} akan dihapus dan halaman publik kembali memakai teks
              bawaan. Gambar yang sudah diunggah tidak otomatis dihapus.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={removeBanner}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} aria-hidden="true" />
                {deleting ? 'Menghapus...' : 'Ya, Hapus Banner'}
              </button>
            </div>
          </div>
        </PartnerDialog>
      )}
    </div>
  )
}
