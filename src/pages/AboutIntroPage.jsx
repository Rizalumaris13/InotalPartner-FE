import { useEffect, useRef, useState } from 'react'
import { Eye, RefreshCw, Save, Upload, X } from 'lucide-react'
import ScaledPreview from '../components/ScaledPreview'
import EditorTextField from '../components/EditorTextField'
import { getAboutIntroApi, saveAboutIntroApi, ABOUT_INTRO_PATH } from '../api/aboutIntro'
import { uploadImageApi } from '../api/posts'
import AboutIntroSection from '../components/AboutIntroSection'
import {
  ABOUT_INTRO_CTA_TARGETS, ABOUT_INTRO_LIMITS, CARD_ITEMS, DEFAULT_ABOUT_INTRO, PROGRESS_ROWS,
} from '../data/aboutIntro'
import { isSafeImageUrl, normalizeImageUrl, validateImageFile } from '../utils/imageUrl'
import {
  getAboutIntroErrorMessage, isAboutIntroRecord, toAboutIntroPayload, validateAboutIntro,
} from '../utils/aboutIntro'

export default function AboutIntroPage({ role }) {
  const currentRole = typeof role === 'object' ? role?.name : role
  const canManage = ['admin', 'super_admin'].includes(currentRole)
  const [form, setForm] = useState(DEFAULT_ABOUT_INTRO)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [load, setLoad] = useState({ status: 'loading', record: null, message: '' })
  const [refresh, setRefresh] = useState(0)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null)
  const [uploadProgress, setUploadProgress] = useState('')
  const alive = useRef(false)
  const previewRef = useRef('')
  const locked = busy || Boolean(pending)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  // Blob pratinjau dibersihkan saat komponen ditutup (pergantian ditangani clearFile).
  useEffect(() => { previewRef.current = preview }, [preview])
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  useEffect(() => {
    if (!canManage) return undefined
    const controller = new AbortController()
    getAboutIntroApi({ signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setLoad({ status: 'ready', record, message: '' })
        setForm(record ?? DEFAULT_ABOUT_INTRO)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = err?.response?.status === 404
          ? `Pengaturan intro belum tersedia di backend. Endpoint GET /api${ABOUT_INTRO_PATH} perlu disediakan; simpan belum diaktifkan.`
          : getAboutIntroErrorMessage(err, 'Gagal memuat intro Tentang. Periksa koneksi lalu Muat Ulang.')
        setLoad({ status: 'error', record: null, message })
      })
    return () => controller.abort()
  }, [canManage, refresh])

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
  }

  const selectFile = (event) => {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen || locked || !canManage) return
    const validation = validateImageFile(chosen)
    if (validation) { setErrors((current) => ({ ...current, photo_url: validation })); return }
    try {
      const url = URL.createObjectURL(chosen)
      clearFile()
      setFile(chosen)
      setPreview(url)
      setErrors((current) => ({ ...current, photo_url: '' }))
      setNotice('')
      setError('')
    } catch {
      setErrors((current) => ({ ...current, photo_url: 'Pratinjau foto tidak dapat dibuat. Coba pilih file lagi.' }))
    }
  }

  const setPhotoUrl = (value) => {
    clearFile()
    setForm((current) => ({ ...current, photo_url: value }))
    setErrors((current) => ({ ...current, photo_url: '' }))
    setNotice('')
    setError('')
  }

  const setField = (key, value) => {
    if (locked) return
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setNotice('')
    setError('')
  }

  const setProgress = (index, key, value) => {
    if (locked) return
    setForm((current) => ({
      ...current,
      progress: current.progress.map((row, rowIndex) => rowIndex === index
        ? { ...row, [key]: key === 'percent' ? value.slice(0, 3) : value }
        : row),
    }))
    setErrors((current) => ({ ...current, [`progress-${index}-${key}`]: '' }))
    setNotice('')
    setError('')
  }

  const setCard = (cardKey, key, value) => {
    if (locked) return
    setForm((current) => ({ ...current, [cardKey]: { ...current[cardKey], [key]: value } }))
    setErrors((current) => ({ ...current, [`${cardKey}-${key}`]: '' }))
    setNotice('')
    setError('')
  }

  const setItem = (cardKey, index, value) => {
    if (locked) return
    setForm((current) => ({
      ...current,
      [cardKey]: { ...current[cardKey], items: current[cardKey].items.map((item, i) => (i === index ? value : item)) },
    }))
    setErrors((current) => ({ ...current, [`${cardKey}-item-${index}`]: '' }))
    setNotice('')
    setError('')
  }

  const verify = async (payload) => {
    const record = await getAboutIntroApi()
    if (!alive.current) return
    if (!isAboutIntroRecord(record) || JSON.stringify(toAboutIntroPayload(record)) !== JSON.stringify(payload)) {
      throw new Error('Intro terkirim, tetapi hasil baca ulang belum sesuai. Pilih Verifikasi Ulang tanpa mengirim ulang.')
    }
    setLoad({ status: 'ready', record, message: '' })
    setForm(toAboutIntroPayload(record))
    setPending(null)
    setNotice('Intro Tentang berhasil disimpan.')
  }

  const save = async (event) => {
    event.preventDefault()
    if (!canManage || locked || load.status !== 'ready') return
    // Validasi memakai nilai mentah form (persentase masih string), lalu
    // payload dibentuk dari angka yang sudah lolos.
    const invalid = validateAboutIntro(form)
    if (file) delete invalid.photo_url
    setErrors(invalid)
    const first = Object.keys(invalid)[0]
    if (first) { document.getElementById(`intro-${first}`)?.focus(); return }
    const payload = toAboutIntroPayload({ ...form, progress: form.progress.map((row) => ({ ...row, percent: Number(row.percent) })) })
    setBusy(true)
    setError('')
    setNotice('')
    let accepted = false
    try {
      if (file) {
        setUploadProgress('Mengunggah foto intro...')
        const url = (await uploadImageApi(file))
        if (!alive.current) return
        const normalized = toAboutIntroPayload({ photo_url: url }).photo_url
        if (!isSafeImageUrl(normalized)) throw new Error('Backend tidak mengembalikan URL foto yang valid. Pilihan foto tetap dipertahankan.')
        payload.photo_url = normalized
        setForm((current) => ({ ...current, photo_url: normalized }))
        clearFile()
      }
      setUploadProgress('')
      await saveAboutIntroApi(payload)
      if (!alive.current) return
      accepted = true
      setPending(payload)
      await verify(payload)
    } catch (err) {
      if (alive.current) setError(getAboutIntroErrorMessage(err, accepted
        ? 'Intro terkirim, tetapi belum dapat diverifikasi. Pilih Verifikasi Ulang.'
        : 'Gagal menyimpan intro Tentang. Isian tetap disimpan di formulir.'))
    } finally {
      if (alive.current) { setBusy(false); setUploadProgress('') }
    }
  }

  const reload = async () => {
    if (busy || !canManage) return
    setError('')
    setNotice('')
    if (!pending) {
      clearFile()
      setForm(DEFAULT_ABOUT_INTRO)
      setErrors({})
      setLoad({ status: 'loading', record: null, message: '' })
      setRefresh((value) => value + 1)
      return
    }
    setBusy(true)
    try { await verify(pending) }
    catch (err) {
      if (alive.current) setError(getAboutIntroErrorMessage(err, 'Hasil simpan belum dapat diverifikasi. Coba Verifikasi Ulang.'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  if (!canManage) return <p role="alert" className="text-sm text-red-600">Kamu tidak memiliki akses untuk mengatur intro Tentang.</p>

  const previewIntro = {
    ...form,
    photo_url: preview || normalizeImageUrl(form.photo_url),
    progress: form.progress.map((row) => ({ ...row, percent: Number(row.percent) || 0 })),
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">Tentang · Kenal Kami Lebih Dekat</p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Intro Tentang</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
            Atur label, judul, foto, kartu progres, Misi & Visi, dan tombol pada bagian “Kenal Kami Lebih Dekat” di halaman Tentang.
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
        <p role="status" className="rounded-2xl border border-sky-100 bg-white p-8 text-sm text-gray-500">Memuat intro Tentang...</p>
      ) : (
        <>
          {load.status === 'error' && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{load.message}</p>}
          {load.status === 'ready' && !load.record && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Intro belum diatur. Teks bawaan ditampilkan sampai perubahan disimpan.</p>}
          <form aria-label="Intro Tentang" onSubmit={save} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <fieldset disabled={locked} className="min-w-0 space-y-4">
              <legend className="sr-only">Isi intro Tentang</legend>

              <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800">Label dan judul</h2>
                <EditorTextField
                  key="intro-eyebrow"
                  id="intro-eyebrow"
                  label="Label kecil"
                  value={form.eyebrow}
                  onChange={(value) => setField('eyebrow', value)}
                  maxLength={ABOUT_INTRO_LIMITS.eyebrow}
                  error={errors.eyebrow}
                  help={`${form.eyebrow.length}/${ABOUT_INTRO_LIMITS.eyebrow} karakter`}
                />
                <EditorTextField
                  key="intro-headline"
                  id="intro-headline"
                  label="Judul utama"
                  value={form.headline}
                  onChange={(value) => setField('headline', value)}
                  maxLength={ABOUT_INTRO_LIMITS.headline}
                  error={errors.headline}
                  textarea
                  help={`${form.headline.length}/${ABOUT_INTRO_LIMITS.headline} karakter`}
                />
                <EditorTextField
                  key="intro-headline_accent"
                  id="intro-headline_accent"
                  label="Judul aksen (warna biru)"
                  value={form.headline_accent}
                  onChange={(value) => setField('headline_accent', value)}
                  maxLength={ABOUT_INTRO_LIMITS.headline_accent}
                  error={errors.headline_accent}
                />
              </div>

              <div className="relative space-y-3 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800">Foto</h2>
                <input id="intro-photo-file" type="file" accept="image/jpeg,image/png,image/webp"
                  aria-label="Pilih foto intro" onChange={selectFile} className="peer sr-only" />
                <label htmlFor="intro-photo-file" className={`inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-2.5 text-xs font-semibold text-sky-700 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 ${locked ? 'opacity-50' : 'cursor-pointer hover:bg-sky-100'}`}>
                  <Upload size={14} aria-hidden="true" />Pilih Foto
                </label>
                {file && (
                  <button type="button" onClick={clearFile} aria-label="Batal pilih foto intro"
                    className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100">
                    <X size={14} aria-hidden="true" />Batal pilihan
                  </button>
                )}
                <p className="text-xs leading-relaxed text-gray-500">JPG, PNG, atau WEBP; maksimal 5 MB. Foto dipratinjau sekarang dan diunggah saat Simpan.</p>
                {file && <p className="break-all text-xs font-medium text-sky-700">{file.name} — belum diunggah</p>}
                <EditorTextField
                  key="intro-photo_url"
                  id="intro-photo_url"
                  label="URL foto intro"
                  value={form.photo_url}
                  onChange={setPhotoUrl}
                  maxLength={2048}
                  error={errors.photo_url}
                  help="https://... atau /uploads/..."
                />
                <EditorTextField
                  key="intro-photo_alt"
                  id="intro-photo_alt"
                  label="Teks alternatif foto"
                  value={form.photo_alt}
                  onChange={(value) => setField('photo_alt', value)}
                  maxLength={ABOUT_INTRO_LIMITS.photo_alt}
                  error={errors.photo_alt}
                />
              </div>

              <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800">Kartu progres</h2>
                <EditorTextField
                  key="intro-progress_title"
                  id="intro-progress_title"
                  label="Judul kartu progres"
                  value={form.progress_title}
                  onChange={(value) => setField('progress_title', value)}
                  maxLength={ABOUT_INTRO_LIMITS.progress_title}
                  error={errors.progress_title}
                />
                {Array.from({ length: PROGRESS_ROWS }, (_, index) => (
                  <div key={`progress-${index}`} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
                    <EditorTextField
                      key={`intro-progress-${index}-label`}
                      id={`intro-progress-${index}-label`}
                      label={`Label progres ${index + 1}`}
                      value={form.progress[index]?.label ?? ''}
                      onChange={(value) => setProgress(index, 'label', value)}
                      maxLength={ABOUT_INTRO_LIMITS.progress_label}
                      error={errors[`progress-${index}-label`]}
                    />
                    <EditorTextField
                      key={`intro-progress-${index}-percent`}
                      id={`intro-progress-${index}-percent`}
                      label={`Persentase progres ${index + 1}`}
                      value={String(form.progress[index]?.percent ?? '')}
                      onChange={(value) => setProgress(index, 'percent', value)}
                      maxLength={3}
                      error={errors[`progress-${index}-percent`]}
                    />
                  </div>
                ))}
              </div>

              {[['mission', 'Misi'], ['vision', 'Visi']].map(([cardKey, name]) => (
                <div key={cardKey} className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-800">Kartu {name}</h2>
                  <EditorTextField
                    key={`intro-${cardKey}-title`}
                    id={`intro-${cardKey}-title`}
                    label={`Judul ${name.toLowerCase()}`}
                    value={form[cardKey].title}
                    onChange={(value) => setCard(cardKey, 'title', value)}
                    maxLength={ABOUT_INTRO_LIMITS.card_title}
                    error={errors[`${cardKey}-title`]}
                  />
                  <EditorTextField
                    key={`intro-${cardKey}-description`}
                    id={`intro-${cardKey}-description`}
                    label={`Deskripsi ${name.toLowerCase()}`}
                    value={form[cardKey].description}
                    onChange={(value) => setCard(cardKey, 'description', value)}
                    maxLength={ABOUT_INTRO_LIMITS.card_description}
                    error={errors[`${cardKey}-description`]}
                    textarea
                  />
                  {Array.from({ length: CARD_ITEMS }, (_, index) => <EditorTextField
                    key={`intro-${cardKey}-item-${index}`}
                    id={`intro-${cardKey}-item-${index}`}
                    label={`Poin ${name.toLowerCase()} ${index + 1}`}
                    value={form[cardKey].items[index] ?? ''}
                    onChange={(value) => setItem(cardKey, index, value)}
                    maxLength={ABOUT_INTRO_LIMITS.item}
                    error={errors[`${cardKey}-item-${index}`]}
                  />)}
                </div>
              ))}

              <div className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800">Tombol</h2>
                <EditorTextField
                  key="intro-cta_label"
                  id="intro-cta_label"
                  label="Label tombol"
                  value={form.cta_label}
                  onChange={(value) => setField('cta_label', value)}
                  maxLength={ABOUT_INTRO_LIMITS.cta_label}
                  error={errors.cta_label}
                />
                <div>
                  <label htmlFor="intro-cta_target" className="text-xs font-semibold text-gray-600">Halaman tujuan tombol</label>
                  <select id="intro-cta_target" value={form.cta_target} onChange={(event) => setField('cta_target', event.target.value)}
                    aria-invalid={Boolean(errors.cta_target)} aria-describedby={errors.cta_target ? 'intro-cta_target-error' : undefined}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                    {ABOUT_INTRO_CTA_TARGETS.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
                  </select>
                  {errors.cta_target && <p id="intro-cta_target-error" role="alert" className="mt-1 text-xs text-red-600">{errors.cta_target}</p>}
                </div>
              </div>

              {uploadProgress && <p role="status" className="text-sm text-sky-700">{uploadProgress}</p>}
              <button type="submit" disabled={locked || load.status !== 'ready'} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                <Save size={16} aria-hidden="true" />{busy ? 'Menyimpan...' : 'Simpan Intro'}
              </button>
            </fieldset>

            <section aria-label="Pratinjau intro Tentang" className="editor-preview min-w-0 overflow-x-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-sky-50 px-5 py-4">
                <Eye size={16} aria-hidden="true" className="text-sky-500" />
                <h2 className="text-sm font-bold text-gray-800">Pratinjau bagian</h2>
              </div>
              <p className="px-5 pt-3 text-xs leading-relaxed text-gray-500">Diskalakan dari lebar desktop 1280px, jadi proporsinya sama berapa pun lebar panel atau zoom browser.</p>
              <div className="max-h-[560px] overflow-y-auto">
                <ScaledPreview>
                  <AboutIntroSection intro={previewIntro} animate={false} preview />
                </ScaledPreview>
              </div>
            </section>
          </form>
        </>
      )}
    </div>
  )
}
