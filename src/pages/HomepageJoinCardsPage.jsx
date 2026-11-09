import { useEffect, useRef, useState } from 'react'
import { LayoutList, RefreshCw, Save } from 'lucide-react'
import { getJoinCardsApi, saveJoinCardsApi, JOIN_CARDS_PATH } from '../api/homepageJoinCards'
import HomepageJoinCard from '../components/HomepageJoinCard'
import { DEFAULT_JOIN_CARDS, JOIN_CARD_FIELDS } from '../data/homepageJoinCards'
import {
  getJoinCardsErrorMessage, isJoinCardsRecord, toJoinCardsPayload, validateJoinCards,
} from '../utils/homepageJoinCards'

function CardTextField({ card, field, error, onChange }) {
  const number = String(card.position).padStart(2, '0')
  const id = `join-card-${card.position}-${field.key}`
  const props = {
    id, value: card[field.key], required: true, maxLength: field.maxLength,
    onChange: (event) => onChange(card.position, field.key, event.target.value),
    'aria-invalid': Boolean(error),
    'aria-describedby': `${id}-help${error ? ` ${id}-error` : ''}`,
    className: 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100',
  }
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-gray-600">{field.label} kartu {number}</label>
      {field.key === 'description' ? <textarea {...props} rows={3} /> : <input {...props} type="text" />}
      <p id={`${id}-help`} className="mt-1 text-xs text-gray-400">{card[field.key].length}/{field.maxLength} karakter</p>
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function HomepageJoinCardsPage({ role }) {
  const currentRole = typeof role === 'object' ? role?.name : role
  const canManage = ['admin', 'super_admin'].includes(currentRole)
  const [form, setForm] = useState(DEFAULT_JOIN_CARDS)
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
    return () => { alive.current = false }
  }, [])

  useEffect(() => {
    if (!canManage) return undefined
    const controller = new AbortController()
    getJoinCardsApi({ signal: controller.signal })
      .then((record) => {
        if (controller.signal.aborted) return
        setLoad({ status: 'ready', record, message: '' })
        setForm(record ? toJoinCardsPayload(record).cards : DEFAULT_JOIN_CARDS)
        setErrors({})
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        const message = err?.response?.status === 404
          ? `Pengaturan kartu belum tersedia di backend. Endpoint GET /api${JOIN_CARDS_PATH} perlu disediakan; simpan belum diaktifkan.`
          : getJoinCardsErrorMessage(err, 'Gagal memuat kartu. Periksa koneksi lalu Muat Ulang.')
        setLoad({ status: 'error', record: null, message })
      })
    return () => controller.abort()
  }, [canManage, refresh])

  const updateField = (position, key, value) => {
    if (!canManage || locked) return
    setForm((current) => current.map((card) => card.position === position ? { ...card, [key]: value } : card))
    setErrors((current) => ({ ...current, [`${position}-${key}`]: '' }))
    setError('')
    setNotice('')
  }

  const verify = async (payload) => {
    const record = await getJoinCardsApi()
    if (!alive.current) return
    if (!isJoinCardsRecord(record) || record.some((card, index) =>
      card.position !== payload.cards[index].position ||
      JOIN_CARD_FIELDS.some((field) => card[field.key] !== payload.cards[index][field.key]))) {
      throw new Error('Kartu terkirim, tetapi hasil baca ulang belum sesuai. Pilih Verifikasi Ulang tanpa mengirim ulang.')
    }
    setLoad({ status: 'ready', record, message: '' })
    setForm(toJoinCardsPayload(record).cards)
    setPending(null)
    setNotice('Keenam kartu berhasil disimpan.')
  }

  const save = async (event) => {
    event.preventDefault()
    if (!canManage || locked || load.status !== 'ready') return
    const payload = toJoinCardsPayload(form)
    const invalid = validateJoinCards(payload.cards)
    setErrors(invalid)
    const first = Object.keys(invalid)[0]
    if (first) { document.getElementById(`join-card-${first}`)?.focus(); return }
    setBusy(true)
    setError('')
    setNotice('')
    let accepted = false
    try {
      await saveJoinCardsApi(payload.cards)
      if (!alive.current) return
      accepted = true
      setPending(payload)
      await verify(payload)
    } catch (err) {
      if (alive.current) setError(getJoinCardsErrorMessage(err, accepted
        ? 'Kartu terkirim, tetapi belum dapat diverifikasi. Pilih Verifikasi Ulang.'
        : 'Gagal menyimpan kartu. Isian tetap disimpan di formulir.'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  const reload = async () => {
    if (busy || !canManage) return
    setError('')
    setNotice('')
    if (!pending) {
      setForm(DEFAULT_JOIN_CARDS)
      setErrors({})
      setLoad({ status: 'loading', record: null, message: '' })
      setRefresh((value) => value + 1)
      return
    }
    setBusy(true)
    try { await verify(pending) }
    catch (err) {
      if (alive.current) setError(getJoinCardsErrorMessage(err, 'Hasil simpan belum dapat diverifikasi. Coba Verifikasi Ulang.'))
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  if (!canManage) return <p role="alert" className="text-sm text-red-600">Kamu tidak memiliki akses untuk mengatur kartu Mengapa Bergabung.</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">Beranda · Mengapa Bergabung</p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Kartu Teks</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">Ubah judul dan deskripsi kartu 01–06 di bagian “Saatnya Bersama Beraksi”. Nomor, posisi, foto, dan judul bagian tetap. Muat Ulang mengambil data server dan membuang draf yang belum disimpan.</p>
        </div>
        <button type="button" onClick={reload} disabled={busy || load.status === 'loading'}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50">
          <RefreshCw size={16} aria-hidden="true" />{pending ? 'Verifikasi Ulang' : 'Muat Ulang'}
        </button>
      </div>
      {notice && <p role="status" className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {load.status === 'loading' ? (
        <p role="status" className="rounded-2xl border border-sky-100 bg-white p-8 text-sm text-gray-500">Memuat kartu...</p>
      ) : (
        <>
          {load.status === 'error' && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{load.message}</p>}
          {load.status === 'ready' && !load.record && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">Kartu belum diatur. Teks bawaan ditampilkan sampai perubahan disimpan.</p>}
          <form aria-label="Kartu teks Mengapa Bergabung" onSubmit={save} noValidate className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <fieldset disabled={locked} className="min-w-0 space-y-4">
              <legend className="sr-only">Isi enam kartu Mengapa Bergabung</legend>
              {form.map((card) => (
                <div key={card.position} className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-800">Kartu {String(card.position).padStart(2, '0')}</h2>
                  {JOIN_CARD_FIELDS.map((field) => <CardTextField key={field.key} card={card} field={field}
                    error={errors[`${card.position}-${field.key}`]} onChange={updateField} />)}
                </div>
              ))}
              <button type="submit" disabled={locked || load.status !== 'ready'} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                <Save size={16} aria-hidden="true" />{busy ? 'Menyimpan...' : 'Simpan Kartu'}
              </button>
            </fieldset>
            <section aria-label="Pratinjau kartu Mengapa Bergabung" className="editor-preview min-w-0 space-y-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <div>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"><LayoutList size={16} aria-hidden="true" className="text-sky-500" />Pratinjau kartu</h2>
                <p className="text-xs leading-relaxed text-gray-500">Di Beranda desktop, kartu 01–03 berada di kiri foto dan 04–06 di kanan. Pratinjau mengikuti isian sebelum disimpan.</p>
              </div>
              {form.map((card) => <HomepageJoinCard key={card.position} card={card} />)}
            </section>
          </form>
        </>
      )}
    </div>
  )
}
