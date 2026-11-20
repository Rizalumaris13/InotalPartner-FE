import { useState } from 'react'
import {
  Building2,
  CircleCheck,
  Eye,
  LockKeyhole,
  Mail,
  MapPin,
  RotateCcw,
  X,
} from 'lucide-react'
import CompanyIcon from './CompanyIcon'
import { formatCompanyValue, validateCompanyDraft } from '../utils/companyInputs'

function CompanyField({ field, menuKey, value, error, onChange }) {
  const id = `company-${menuKey}-${field.key}`
  const inputProps = {
    id,
    name: field.key,
    value,
    required: field.required,
    maxLength: field.maxLength || (field.type === 'number' ? 16 : undefined),
    'aria-invalid': error ? true : undefined,
    'aria-describedby':
      [field.hint && `${id}-hint`, error && `${id}-error`]
        .filter(Boolean)
        .join(' ') || undefined,
    onChange: (event) => onChange(field.key, event.target.value),
    className: `w-full min-w-0 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
      error
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : 'border-gray-200 focus:border-sky-400 focus:ring-sky-100'
    } ${field.suffix ? 'pr-16' : ''}`,
  }
  return (
    <div className={`min-w-0 ${field.wide ? 'sm:col-span-2' : ''}`}>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold text-gray-700"
      >
        {field.label}
        {field.required && (
          <span className="ml-1 text-sky-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative min-w-0">
        {field.type === 'textarea' ? (
          <textarea
            {...inputProps}
            rows={4}
            placeholder={field.placeholder}
            className={`${inputProps.className} resize-y`}
          />
        ) : field.type === 'select' ? (
          <select {...inputProps}>
            <option value="">Pilih {field.label.toLowerCase()}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...inputProps}
            type={field.type === 'number' ? 'text' : field.type}
            inputMode={field.type === 'number' ? 'numeric' : undefined}
            placeholder={
              field.placeholder || (field.type === 'number' ? '0' : undefined)
            }
          />
        )}
        {field.suffix && (
          <span className="pointer-events-none absolute right-3 top-3 text-xs text-gray-500">
            {field.suffix}
          </span>
        )}
      </div>
      {field.hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-gray-500">
          {field.hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function CompanyPreview({ menu, draft }) {
  const fields = menu.sections.flatMap((section) => section.fields)
  const detailFields = fields.filter((field) =>
    menu.previewFacts.includes(field.key),
  )
  return (
    <aside
      className="editor-preview min-w-0 rounded-2xl border border-sky-100 bg-white shadow-sm"
      role="region"
      aria-label="Pratinjau peluang"
    >
      <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Eye size={16} className="text-sky-500" />
          Pratinjau
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
          Draf lokal
        </span>
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2.5 text-sky-600">
          <span className="rounded-xl bg-sky-50 p-2.5">
            <CompanyIcon kind={menu.icon} />
          </span>
          <span className="text-xs font-semibold">{menu.label}</span>
        </div>
        <h2 className="break-words text-lg font-extrabold leading-snug tracking-tight text-gray-900">
          {draft.title.trim() || menu.previewTitle}
        </h2>
        <div className="mt-4 space-y-2.5 text-xs text-gray-600">
          {[
            [Building2, draft.company, 'Nama perusahaan'],
            [MapPin, draft.location, 'Lokasi perusahaan'],
            [Mail, draft.contact_email, 'Email narahubung'],
          ].map(([Icon, value, fallback]) => (
            <div key={fallback} className="flex min-w-0 items-start gap-2">
              <Icon size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <span className="min-w-0 break-words">
                {value.trim() || fallback}
              </span>
            </div>
          ))}
        </div>
        <dl className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
          {detailFields.map((field) => (
            <div
              key={field.key}
              className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-1 text-xs"
            >
              <dt className="text-gray-500">{field.label}</dt>
              <dd className="min-w-0 max-w-full break-words font-semibold text-gray-700">
                {formatCompanyValue(field, draft[field.key])}
              </dd>
            </div>
          ))}
        </dl>
        {fields
          .filter((field) => field.type === 'textarea')
          .map((field) => (
            <section key={field.key} className="mt-5">
              <h3 className="text-xs font-bold text-gray-800">{field.label}</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-600">
                {draft[field.key].trim() ||
                  'Isi formulir untuk melihat rincian di sini.'}
              </p>
            </section>
          ))}
        <div className="mt-5 flex items-start gap-2 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500">
          <LockKeyhole size={14} className="mt-0.5 shrink-0" />
          <p>Pratinjau saja. Peluang ini belum disimpan atau dipublikasikan.</p>
        </div>
      </div>
    </aside>
  )
}

export default function CompanyForm({
  menu,
  initialDraft,
  editing,
  onSave,
  onCancel,
}) {
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const fields = menu.sections.flatMap((section) => section.fields)
  const completed = fields.filter(
    (field) => field.required && draft[field.key].trim(),
  ).length
  const total = fields.filter((field) => field.required).length

  const updateDraft = (key, value) => {
    const nextDraft = { ...draft, [key]: value }
    setDraft(nextDraft)
    if (submitted) setErrors(validateCompanyDraft(menu, nextDraft))
  }

  const resetDraft = () => {
    setDraft(initialDraft)
    setErrors({})
    setSubmitted(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateCompanyDraft(menu, draft)
    setSubmitted(true)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      const firstError = fields.find((field) => nextErrors[field.key])
      if (firstError)
        event.currentTarget.elements.namedItem(firstError.key)?.focus()
      return
    }
    onSave(draft)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-3 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            <X size={14} aria-hidden="true" />
            Tutup form
          </button>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-sky-600">
            Peluang perusahaan
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            {editing ? 'Ubah' : 'Tambah'} {menu.label}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {menu.description}
          </p>
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          aria-label={`Form ${menu.label}`}
          noValidate
          onSubmit={handleSubmit}
          className="min-w-0 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              <span className="font-semibold text-sky-600">
                {completed}/{total}
              </span>{' '}
              kolom wajib terisi
            </span>
            <span>
              Tanda <span className="text-sky-600">*</span> wajib diisi
            </span>
          </div>
          {menu.sections.map((section, index) => (
            <section
              key={section.title}
              className="rounded-2xl border border-sky-100 bg-white shadow-sm"
            >
              <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <CompanyField
                    key={field.key}
                    field={field}
                    menuKey={menu.key}
                    value={draft[field.key]}
                    error={errors[field.key]}
                    onChange={updateDraft}
                  />
                ))}
              </div>
            </section>
          ))}
          {submitted &&
            (Object.keys(errors).length ? (
              <p
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
              >
                Lengkapi atau perbaiki kolom yang ditandai sebelum menyimpan
                draf.
              </p>
            ) : (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800"
              >
                <CircleCheck size={18} className="mt-0.5 shrink-0" />
                <p>Isian sudah valid. Draf belum disimpan atau dipublikasikan.</p>
              </div>
            ))}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <CircleCheck size={16} aria-hidden="true" />
              Simpan draf
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Kosongkan Form
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Batal
            </button>
            <p className="w-full text-xs text-gray-500">
              Draf hanya tersimpan di halaman ini; penyimpanan ke backend belum
              tersedia.
            </p>
          </div>
        </form>
        <CompanyPreview menu={menu} draft={draft} />
      </div>
    </div>
  )
}
