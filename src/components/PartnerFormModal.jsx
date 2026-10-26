import { useRef, useState } from 'react'
import PartnerDialog from './PartnerDialog'
import PartnerLogo from './PartnerLogo'
import { uploadImageApi } from '../api/posts'
import { Save, Upload, X } from 'lucide-react'
import { createPartnerApi, updatePartnerApi } from '../api/partners'
import {
  getPartnerErrorMessage,
  isLogoUrl,
  toPartnerPayload,
  validateLogoFile,
  validatePartnerForm,
} from '../utils/partners'

const inputClass =
  'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
const fieldIds = {
  name: 'partner-name',
  logo_url: 'partner-logo',
  website_url: 'partner-website',
  sort_order: 'partner-order',
}

function FieldError({ id, message }) {
  return message ? (
    <p id={id} role="alert" className="mt-2 text-xs text-red-600">
      {message}
    </p>
  ) : null
}

export default function PartnerFormModal({
  partner,
  nextOrder,
  onClose,
  onSaved,
}) {
  const nameRef = useRef(null)
  const [form, setForm] = useState(() => ({
    name: partner?.name || '',
    logo_url: partner?.logo_url || '',
    website_url: partner?.website_url || '',
    sort_order: String(partner?.sort_order ?? nextOrder),
    is_active: partner?.is_active ?? false,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const busy = saving || uploading

  const updateField = (key, value) => {
    if (key === 'logo_url') setUploadError('')
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    const validationError = validateLogoFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadImageApi(file)
      if (!isLogoUrl(url))
        throw new Error('Backend tidak mengembalikan URL logo yang valid.')
      updateField('logo_url', url)
    } catch (err) {
      setUploadError(
        getPartnerErrorMessage(err, 'Gagal mengunggah logo. Coba lagi.'),
      )
    } finally {
      setUploading(false)
    }
  }

  const save = async (event) => {
    event.preventDefault()
    if (busy) return
    const validationErrors = validatePartnerForm(form)
    setErrors(validationErrors)
    const firstError = Object.keys(validationErrors)[0]
    if (firstError) {
      document.getElementById(fieldIds[firstError])?.focus()
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = toPartnerPayload(form)
      if (partner?.id != null) await updatePartnerApi(partner.id, payload)
      else await createPartnerApi(payload)
      onSaved()
    } catch (err) {
      const fallback =
        err.response?.status === 404
          ? partner
            ? `Mitra tidak ditemukan atau endpoint PUT /api/homepage/partners/${partner.id} belum tersedia. Muat ulang daftar mitra.`
            : 'Endpoint POST /api/homepage/partners belum tersedia di backend.'
          : 'Gagal menyimpan mitra. Coba lagi.'
      // Pesan JSON backend membedakan record hilang dari route yang belum dibuat.
      setError(getPartnerErrorMessage(err, fallback))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PartnerDialog
      labelledBy="partner-form-title"
      busy={busy}
      onClose={onClose}
      initialFocusRef={nameRef}
    >
      <form onSubmit={save} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-sky-100 px-6 py-5">
          <div>
            <h2
              id="partner-form-title"
              className="text-lg font-extrabold text-gray-900"
            >
              {partner ? 'Edit Mitra' : 'Tambah Mitra'}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Atur identitas dan tampilan mitra di beranda.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup form mitra"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        <fieldset disabled={busy} className="space-y-5 px-6 py-5">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="partner-name"
              className="text-sm font-semibold text-gray-700"
            >
              Nama Mitra
            </label>
            <input
              ref={nameRef}
              id="partner-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'partner-name-error' : undefined}
              autoComplete="organization"
              className={inputClass}
            />
            <FieldError id="partner-name-error" message={errors.name} />
          </div>
          <div>
            <label
              htmlFor="partner-logo"
              className="text-sm font-semibold text-gray-700"
            >
              URL Logo
            </label>
            <input
              id="partner-logo"
              value={form.logo_url}
              onChange={(event) => updateField('logo_url', event.target.value)}
              placeholder="https://... atau /uploads/..."
              aria-invalid={Boolean(errors.logo_url)}
              aria-describedby={`partner-logo-help${errors.logo_url ? ' partner-logo-error' : ''}`}
              className={inputClass}
            />
            <p id="partner-logo-help" className="mt-2 text-xs text-gray-500">
              Opsional. Tanpa logo, nama mitra tetap ditampilkan.
            </p>
            <FieldError id="partner-logo-error" message={errors.logo_url} />
            <div className="mt-3">
              <input
                id="partner-logo-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadLogo}
                aria-invalid={Boolean(uploadError)}
                aria-describedby={`partner-upload-help${uploadError ? ' partner-upload-error' : ''}`}
                className="peer sr-only"
              />
              <label
                htmlFor="partner-logo-file"
                className={`inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-xs font-semibold text-sky-700 peer-focus:ring-2 peer-focus:ring-sky-400 ${busy ? 'opacity-50' : 'cursor-pointer hover:bg-sky-100'}`}
              >
                <Upload size={15} />
                Unggah Logo
              </label>
              <p
                id="partner-upload-help"
                className="mt-2 text-xs text-gray-500"
              >
                JPG, PNG, atau WEBP. Maksimal 5 MB.
              </p>
              {uploading && (
                <p role="status" className="mt-2 text-xs text-sky-700">
                  Mengunggah logo...
                </p>
              )}
              <FieldError id="partner-upload-error" message={uploadError} />
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-sky-100 bg-sky-50/30 p-4">
              <div className="h-20 w-20 shrink-0 rounded-xl border border-sky-100 bg-white p-3">
                <PartnerLogo
                  name={form.name.trim() || 'Nama Mitra'}
                  url={form.logo_url}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Pratinjau logo</p>
                <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                  {form.name.trim() || 'Nama Mitra'}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="partner-website"
              className="text-sm font-semibold text-gray-700"
            >
              Tautan Situs
            </label>
            <input
              id="partner-website"
              type="url"
              value={form.website_url}
              onChange={(event) =>
                updateField('website_url', event.target.value)
              }
              placeholder="https://..."
              aria-invalid={Boolean(errors.website_url)}
              aria-describedby={`partner-website-help${errors.website_url ? ' partner-website-error' : ''}`}
              className={inputClass}
            />
            <p id="partner-website-help" className="mt-2 text-xs text-gray-500">
              Opsional. Dibuka di tab baru saat mitra diklik.
            </p>
            <FieldError
              id="partner-website-error"
              message={errors.website_url}
            />
          </div>
          <div>
            <label
              htmlFor="partner-order"
              className="text-sm font-semibold text-gray-700"
            >
              Urutan Tampil
            </label>
            <input
              id="partner-order"
              type="number"
              min="0"
              step="1"
              value={form.sort_order}
              onChange={(event) =>
                updateField('sort_order', event.target.value)
              }
              required
              aria-required="true"
              aria-invalid={Boolean(errors.sort_order)}
              aria-describedby={`partner-order-help${errors.sort_order ? ' partner-order-error' : ''}`}
              className={inputClass}
            />
            <p id="partner-order-help" className="mt-2 text-xs text-gray-500">
              Angka lebih kecil ditampilkan lebih dulu.
            </p>
            <FieldError id="partner-order-error" message={errors.sort_order} />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <input
              type="checkbox"
              aria-labelledby="partner-active-label"
              aria-describedby="partner-active-help"
              checked={form.is_active}
              onChange={(event) =>
                updateField('is_active', event.target.checked)
              }
              className="mt-0.5 h-4 w-4 accent-sky-600"
            />
            <span>
              <span
                id="partner-active-label"
                className="text-sm font-semibold text-gray-800"
              >
                Tampilkan di beranda
              </span>
              <span
                id="partner-active-help"
                className="mt-1 block text-xs text-gray-500"
              >
                Mitra nonaktif hanya terlihat di dashboard admin.
              </span>
            </span>
          </label>
        </fieldset>
        <div className="flex justify-end gap-3 border-t border-sky-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving
              ? 'Menyimpan...'
              : partner
                ? 'Simpan Perubahan'
                : 'Simpan Mitra'}
          </button>
        </div>
      </form>
    </PartnerDialog>
  )
}
