import { useEffect, useRef, useState } from 'react'
import { Eye, RefreshCw, Save, Trash2 } from 'lucide-react'
import EditorTextField from '../components/EditorTextField'
import ScaledPreview from '../components/ScaledPreview'
import AboutEmpoweringHeader from '../components/AboutEmpoweringHeader'
import PublicAboutCards from '../components/PublicAboutCards'
import { ABOUT_EMPOWERING_PATH, createAboutEmpoweringApi, deleteAboutEmpoweringApi, getAboutEmpoweringApi, updateAboutEmpoweringApi } from '../api/aboutEmpowering'
import { useFeedback } from '../hooks/useFeedback'
import {
  ABOUT_EMPOWERING_FIELDS, ABOUT_EMPOWERING_LABELS, ABOUT_EMPOWERING_ROLES,
  ABOUT_EMPOWERING_RULES, DEFAULT_ABOUT_EMPOWERING,
} from '../data/aboutEmpowering'
import { toAboutEmpoweringPayload, validateAboutEmpowering } from '../utils/aboutEmpowering'
import { getApiErrorMessage } from '../utils/apiErrors'

const SUCCESS_MESSAGES = {
  create: 'Pengaturan berhasil dibuat.',
  update: 'Pengaturan berhasil diperbarui.',
  delete: 'Pengaturan berhasil dihapus. Teks bawaan digunakan kembali.',
}

export default function AboutEmpoweringPage({ role }) {
  const currentRole = typeof role === 'object' ? role?.name : role
  if (!ABOUT_EMPOWERING_ROLES.includes(currentRole)) {
    return <p role="alert" className="text-sm text-red-600">Kamu tidak memiliki akses untuk mengatur Memberdayakan Bisnis.</p>
  }
  return <AboutEmpoweringEditor />
}

function AboutEmpoweringEditor() {
  const { confirmAction, feedback } = useFeedback()
  const [form, setForm] = useState(DEFAULT_ABOUT_EMPOWERING)
  const [load, setLoad] = useState({ status: 'loading', record: null, message: '' })
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const alive = useRef(false)
  const action = useRef(null)
  const locked = busy || Boolean(pending)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      action.current?.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAboutEmpoweringApi({ signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setLoad({ status: 'ready', record, message: '' })
        setForm(record ?? DEFAULT_ABOUT_EMPOWERING)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        const message = error?.response?.status === 404
          ? `Pengaturan belum tersedia di backend. Endpoint GET /api${ABOUT_EMPOWERING_PATH} perlu disediakan; simpan belum diaktifkan.`
          : getApiErrorMessage(error, 'Gagal memuat pengaturan Memberdayakan Bisnis. Periksa koneksi lalu Muat Ulang.')
        setLoad({ status: 'error', record: null, message })
      })
    return () => controller.abort()
  }, [refresh])

  const verify = async (change, signal) => {
    const record = await getAboutEmpoweringApi({ signal })
    if (!alive.current || signal.aborted) return
    const matches = change.kind === 'delete'
      ? record === null
      : record && ABOUT_EMPOWERING_FIELDS.every((key) => record[key] === change.payload[key])
    if (!matches) {
      throw new Error('Perubahan diterima, tetapi hasil baca ulang belum sesuai. Pilih Verifikasi Ulang tanpa mengirim ulang.')
    }
    setLoad({ status: 'ready', record, message: '' })
    setForm(record ?? DEFAULT_ABOUT_EMPOWERING)
    setPending(null)
    setErrors({})
    setNotice(SUCCESS_MESSAGES[change.kind])
  }

  const save = async (event) => {
    event.preventDefault()
    if (action.current || locked || load.status !== 'ready') return
    setError('')
    setNotice('')
    const invalid = validateAboutEmpowering(form)
    setErrors(invalid)
    const first = ABOUT_EMPOWERING_FIELDS.find((key) => invalid[key])
    if (first) {
      document.getElementById(`empowering-${first}`)?.focus()
      return
    }
    const change = { kind: load.record ? 'update' : 'create', payload: toAboutEmpoweringPayload(form) }
    const controller = new AbortController()
    action.current = controller
    setBusy(true)
    let accepted = false
    try {
      const write = load.record ? updateAboutEmpoweringApi : createAboutEmpoweringApi
      await write(change.payload, { signal: controller.signal })
      if (!alive.current || controller.signal.aborted) return
      accepted = true
      setPending(change)
      await verify(change, controller.signal)
    } catch (err) {
      if (alive.current && !controller.signal.aborted) {
        // Respons hilang tidak membuktikan backend menolak perubahan.
        const uncertain = err?.isAxiosError && !err.response
        if (uncertain) setPending(change)
        setError(getApiErrorMessage(err, accepted || uncertain
          ? 'Hasil penyimpanan belum dapat dipastikan. Pilih Verifikasi Ulang tanpa mengirim ulang perubahan.'
          : 'Gagal menyimpan pengaturan. Isian tetap disimpan di formulir.'))
      }
    } finally {
      if (action.current === controller) action.current = null
      if (alive.current && !controller.signal.aborted) setBusy(false)
    }
  }

  const remove = async () => {
    if (action.current || locked || load.status !== 'ready' || !load.record) return
    const change = { kind: 'delete', payload: null }
    const controller = new AbortController()
    action.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    let accepted = false
    try {
      const confirmed = await confirmAction('Label dan judul kembali ke teks bawaan. Kartu tidak ikut dihapus.', {
        title: 'Hapus Pengaturan?', confirmLabel: 'Ya, Hapus Pengaturan', danger: true,
      })
      if (!confirmed || !alive.current || controller.signal.aborted) return
      await deleteAboutEmpoweringApi({ signal: controller.signal })
      if (!alive.current || controller.signal.aborted) return
      accepted = true
      setPending(change)
      await verify(change, controller.signal)
    } catch (err) {
      if (alive.current && !controller.signal.aborted) {
        const uncertain = err?.isAxiosError && !err.response
        if (uncertain) setPending(change)
        setError(getApiErrorMessage(err, accepted || uncertain
          ? 'Hasil penghapusan belum dapat dipastikan. Pilih Verifikasi Ulang tanpa menghapus ulang.'
          : 'Gagal menghapus pengaturan. Isian tetap disimpan di formulir.'))
      }
    } finally {
      if (action.current === controller) action.current = null
      if (alive.current && !controller.signal.aborted) setBusy(false)
    }
  }

  const reload = async () => {
    if (action.current || busy || load.status === 'loading') return
    setError('')
    setNotice('')
    if (!pending) {
      setForm(DEFAULT_ABOUT_EMPOWERING)
      setErrors({})
      setLoad({ status: 'loading', record: null, message: '' })
      setRefresh((value) => value + 1)
      return
    }
    const controller = new AbortController()
    action.current = controller
    setBusy(true)
    try {
      await verify(pending, controller.signal)
    } catch (err) {
      if (alive.current && !controller.signal.aborted) setError(getApiErrorMessage(err, 'Hasil perubahan belum dapat diverifikasi. Coba Verifikasi Ulang.'))
    } finally {
      if (action.current === controller) action.current = null
      if (alive.current && !controller.signal.aborted) setBusy(false)
    }
  }

  const setField = (key, value) => {
    if (action.current || locked) return
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setError('')
    setNotice('')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">Tentang · Pengaturan Bagian</p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Memberdayakan Bisnis</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
            Atur label dan judul bagian di halaman Tentang. Isi, ikon, tautan, dan posisi kartu dikelola melalui submenu Kelola Kartu.
            {' '}Muat Ulang mengambil data server dan membuang draf yang belum disimpan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={reload} disabled={busy || load.status === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50">
            <RefreshCw size={16} aria-hidden="true" />{pending ? 'Verifikasi Ulang' : 'Muat Ulang'}
          </button>
          {load.record && <button type="button" onClick={remove} disabled={locked || load.status !== 'ready'}
            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
            <Trash2 size={16} aria-hidden="true" />Hapus Pengaturan
          </button>}
        </div>
      </div>

      {notice && <p role="status" className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {load.status === 'loading' ? (
        <p role="status" className="rounded-2xl border border-sky-100 bg-white p-8 text-sm text-gray-500">Memuat pengaturan...</p>
      ) : (
        <>
          {load.status === 'error' && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{load.message}</p>}
          {load.status === 'ready' && !load.record && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Bagian belum diatur. Teks bawaan tetap tampil sampai pengaturan dibuat.</p>}
          <form aria-label="Pengaturan Memberdayakan Bisnis" onSubmit={save} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <fieldset disabled={locked} className="min-w-0 space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <legend className="sr-only">Isi Memberdayakan Bisnis</legend>
              <h2 className="text-sm font-bold text-gray-800">Label dan judul</h2>
              {ABOUT_EMPOWERING_FIELDS.map((key) => (
                <EditorTextField key={key} id={`empowering-${key}`} label={ABOUT_EMPOWERING_LABELS[key]}
                  value={form[key]} onChange={(value) => setField(key, value)}
                  error={errors[key]}
                  help={`${Array.from(form[key]).length}/${ABOUT_EMPOWERING_RULES[key].maxLength} karakter${key === 'title_accent' ? ' · Opsional; kosongkan untuk judul tanpa aksen.' : ''}`} />
              ))}
              <button type="submit" disabled={locked || load.status !== 'ready'} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                <Save size={16} aria-hidden="true" />{busy ? 'Memproses...' : load.record ? 'Simpan Perubahan' : 'Buat Pengaturan'}
              </button>
            </fieldset>
            <section aria-label="Pratinjau Memberdayakan Bisnis" className="editor-preview min-w-0 overflow-x-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-sky-50 px-5 py-4">
                <Eye size={16} aria-hidden="true" className="text-sky-500" />
                <h2 className="text-sm font-bold text-gray-800">Pratinjau bagian</h2>
              </div>
              <p className="px-5 pt-3 text-xs leading-relaxed text-gray-500">Label dan judul mengikuti formulir. Isi kartu dikelola melalui Kelola Kartu. Pratinjau diskalakan dari lebar desktop.</p>
              <ScaledPreview>
                <div className="max-w-7xl mx-auto px-6 py-16 text-[#0c4a6e]">
                  <div className="mb-10">
                    <AboutEmpoweringHeader configuration={toAboutEmpoweringPayload(form)} preview />
                  </div>
                  <PublicAboutCards preview />
                </div>
              </ScaledPreview>
            </section>
          </form>
        </>
      )}
      {feedback}
    </div>
  )
}
