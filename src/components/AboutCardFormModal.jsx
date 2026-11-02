import { useRef, useState } from 'react'
import { Save, X } from 'lucide-react'
import PartnerDialog from './PartnerDialog'
import AboutCard from './AboutCard'
import { ABOUT_CARD_ICONS } from '../data/aboutCardIcons'
import {
  createAboutCardApi,
  listAboutCardsApi,
  updateAboutCardApi,
} from '../api/aboutCards'
import {
  ABOUT_CARD_RULES,
  getAboutCardErrorMessage,
  sameAboutCardPayload,
  toAboutCardPayload,
  validateAboutCardForm,
} from '../utils/aboutCards'

const inputClass =
  'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
const fieldIds = {
  title: 'about-card-title',
  description: 'about-card-description',
  icon: 'about-card-icon',
  url: 'about-card-url',
  sort_order: 'about-card-position',
}

function FieldError({ field, message }) {
  return message ? (
    <p
      id={`${fieldIds[field]}-error`}
      role="alert"
      className="mt-2 text-xs text-red-600"
    >
      {message}
    </p>
  ) : null
}

export default function AboutCardFormModal({
  card,
  maxPosition,
  canSave,
  onClose,
  onSaved,
}) {
  const titleRef = useRef(null)
  const operationRef = useRef(false)
  const [form, setForm] = useState(() => ({
    title: card?.title ?? '',
    description: card?.description ?? '',
    icon: card?.icon ?? ABOUT_CARD_ICONS[0].value,
    url: card?.url ?? '',
    sort_order: String(card?.sort_order ?? maxPosition),
  }))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [savedRecord, setSavedRecord] = useState(null)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    setError('')
  }
  const close = () => {
    if (!operationRef.current) onClose(Boolean(savedRecord))
  }
  const verify = async (saved) => {
    const cards = await listAboutCardsApi()
    const observed = cards.find((item) => item.id === saved.id)
    if (!observed || !sameAboutCardPayload(observed, saved))
      throw new Error(
        'Kartu yang disimpan belum sesuai pada daftar backend. Muat ulang atau hubungi pengelola backend.',
      )
    onSaved(cards)
  }
  const save = async (event) => {
    event.preventDefault()
    if (operationRef.current || !canSave) return
    if (!savedRecord) {
      const validation = validateAboutCardForm(form, maxPosition)
      setErrors(validation)
      const firstError = Object.keys(validation)[0]
      if (firstError) {
        document.getElementById(fieldIds[firstError])?.focus()
        return
      }
    }
    operationRef.current = true
    setSaving(true)
    setError('')
    let accepted = savedRecord
    try {
      if (!accepted) {
        const payload = toAboutCardPayload(form)
        accepted = card
          ? await updateAboutCardApi(card.id, payload)
          : await createAboutCardApi(payload)
        setSavedRecord(accepted)
      }
      await verify(accepted)
    } catch (err) {
      const message = getAboutCardErrorMessage(
        err,
        err.response?.status === 404
          ? `Endpoint ${card ? 'PUT' : 'POST'} /api/about/cards${card ? `/${card.id}` : ''} belum tersedia atau kartu tidak ditemukan.`
          : 'Gagal menyimpan kartu. Periksa koneksi backend.',
      )
      setError(
        accepted
          ? `Perubahan diterima, tetapi belum terverifikasi: ${message} Coba verifikasi ulang tanpa mengirim perubahan lagi.`
          : message,
      )
    } finally {
      operationRef.current = false
      setSaving(false)
    }
  }
  const fieldProps = (field) => ({
    id: fieldIds[field],
    value: form[field],
    onChange: (event) => updateField(field, event.target.value),
    required: true,
    'aria-required': true,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': `${fieldIds[field]}-help${errors[field] ? ` ${fieldIds[field]}-error` : ''}`,
    className: inputClass,
  })
  const previewCard = {
    title: form.title.trim() || 'Judul kartu',
    description:
      form.description.trim() || 'Deskripsi kartu akan terlihat di sini.',
    icon: form.icon,
    url: form.url.trim(),
    sort_order:
      Number.isSafeInteger(Number(form.sort_order)) &&
      Number(form.sort_order) > 0
        ? Number(form.sort_order)
        : 1,
  }

  return (
    <PartnerDialog
      labelledBy="about-form-title"
      busy={saving}
      initialFocusRef={titleRef}
      onClose={close}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={save} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-sky-100 px-6 py-5">
          <div>
            <h2
              id="about-form-title"
              className="text-lg font-extrabold text-gray-900"
            >
              {card ? 'Edit Kartu' : 'Tambah Kartu'}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Konten dan urutan untuk bagian “Pilih yang Terbaik”.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup form kartu"
            onClick={close}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 px-6 pt-5">
          {!canSave && (
            <p
              role="status"
              className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"
            >
              Form ini dapat ditinjau. Muat daftar dari backend terlebih dahulu
              sebelum menyimpan.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
            >
              {error}
            </p>
          )}
        </div>
        <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
          <fieldset
            disabled={saving || Boolean(savedRecord)}
            className="min-w-0 space-y-5"
          >
            <div>
              <label
                htmlFor={fieldIds.title}
                className="text-sm font-semibold text-gray-700"
              >
                Judul
              </label>
              <input
                ref={titleRef}
                {...fieldProps('title')}
                autoComplete="off"
              />
              <p
                id="about-card-title-help"
                className="mt-2 text-xs text-gray-500"
              >
                {ABOUT_CARD_RULES.title.minLength}–
                {ABOUT_CARD_RULES.title.maxLength} karakter, bukan HTML.
              </p>
              <FieldError field="title" message={errors.title} />
            </div>
            <div>
              <label
                htmlFor={fieldIds.description}
                className="text-sm font-semibold text-gray-700"
              >
                Deskripsi
              </label>
              <textarea {...fieldProps('description')} rows={4} />
              <p
                id="about-card-description-help"
                className="mt-2 text-xs text-gray-500"
              >
                {ABOUT_CARD_RULES.description.minLength}–
                {ABOUT_CARD_RULES.description.maxLength} karakter.
              </p>
              <FieldError field="description" message={errors.description} />
            </div>
            <div>
              <label
                htmlFor={fieldIds.icon}
                className="text-sm font-semibold text-gray-700"
              >
                Ikon
              </label>
              <select {...fieldProps('icon')}>
                {ABOUT_CARD_ICONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p
                id="about-card-icon-help"
                className="mt-2 text-xs text-gray-500"
              >
                Ikon dipilih dari katalog; lihat hasilnya di pratinjau.
              </p>
              <FieldError field="icon" message={errors.icon} />
            </div>
            <div>
              <label
                htmlFor={fieldIds.url}
                className="text-sm font-semibold text-gray-700"
              >
                URL Tujuan
              </label>
              <input
                {...fieldProps('url')}
                type="text"
                placeholder="#program atau https://..."
              />
              <p
                id="about-card-url-help"
                className="mt-2 text-xs leading-relaxed text-gray-500"
              >
                Route publik seperti #program dibuka di halaman yang sama. URL
                http/https dibuka di tab baru.
              </p>
              <FieldError field="url" message={errors.url} />
            </div>
            <div>
              <label
                htmlFor={fieldIds.sort_order}
                className="text-sm font-semibold text-gray-700"
              >
                Posisi Tampil
              </label>
              <input
                {...fieldProps('sort_order')}
                type="number"
                min={1}
                max={maxPosition}
                step={1}
              />
              <p
                id="about-card-position-help"
                className="mt-2 text-xs leading-relaxed text-gray-500"
              >
                Pilih posisi 1–{maxPosition}. Kartu lainnya bergeser otomatis;
                angka 01, 02, dan seterusnya mengikuti posisi.
              </p>
              <FieldError field="sort_order" message={errors.sort_order} />
            </div>
          </fieldset>
          <section aria-labelledby="about-preview-title" className="min-w-0">
            <h3
              id="about-preview-title"
              className="mb-3 text-sm font-semibold text-gray-700"
            >
              Pratinjau kartu
            </h3>
            <div className="max-h-[520px] overflow-y-auto rounded-xl bg-sky-50/30 p-2 text-[#0c4a6e]">
              <AboutCard card={previewCard} preview />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Pratinjau tidak membuka tautan dan belum menyimpan data.
            </p>
          </section>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-sky-100 px-6 py-4">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {savedRecord ? 'Tutup dan Muat Ulang' : 'Batal'}
          </button>
          <button
            type="submit"
            disabled={saving || !canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Save size={16} aria-hidden="true" />
            {saving
              ? 'Memverifikasi...'
              : savedRecord
                ? 'Coba Verifikasi'
                : card
                  ? 'Simpan Perubahan'
                  : 'Simpan Kartu'}
          </button>
        </div>
      </form>
    </PartnerDialog>
  )
}
