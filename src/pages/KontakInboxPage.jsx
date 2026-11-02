import React, { useState, useEffect, useMemo } from 'react'
import {
  Search, Trash2, RefreshCw, Inbox, AlertCircle, X,
  Phone, Calendar, MessageSquare, CheckCheck,
} from 'lucide-react'
import { listContactsApi, markContactReadApi, deleteContactApi } from '../api/contacts'

const PAGE_SIZE = 10

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'read', label: 'Sudah Dibaca' },
]

// "Pesan baru wajib paling atas" — urutkan created_at terbaru dulu.
// Backend juga mengembalikan DESC; ini jaring pengaman di sisi klien.
const sortNewestFirst = (list) =>
  [...list].sort((a, b) => {
    const diff = new Date(b.created_at) - new Date(a.created_at)
    return diff !== 0 ? diff : (b.id || 0) - (a.id || 0)
  })

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '-'

// Waktu relatif buat daftar pesan: "5 menit lalu" lebih enak dibaca daripada tanggal penuh
const timeAgo = (iso) => {
  if (!iso) return '-'
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return formatDateTime(iso)
}

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

const isUnread = (c) => c.status === 'unread'

export default function KontakInboxPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState(null) // pesan yang dibuka di modal
  const [deleteConfirm, setDeleteConfirm] = useState(null) // id yang mau dihapus → popup konfirmasi
  const [busyId, setBusyId] = useState(null) // id yang lagi diproses (read)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        // Kontrak BE: GET /api/contacts → { data: Contact[] } urut created_at DESC
        const data = await listContactsApi({ page: 1, limit: 100 })
        const list = Array.isArray(data) ? data : data?.items || []
        if (isMounted) setContacts(sortNewestFirst(list))
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            'Gagal memuat pesan. Pastikan endpoint GET /api/contacts sudah tersedia di backend.'
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [refreshKey])

  useEffect(() => { setPage(1) }, [filter, search])

  const counts = useMemo(() => ({
    total: contacts.length,
    unread: contacts.filter(isUnread).length,
    read: contacts.filter((c) => !isUnread(c)).length,
  }), [contacts])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return contacts.filter((c) => {
      const matchStatus =
        filter === 'all' || (filter === 'unread' ? isUnread(c) : !isUnread(c))
      const matchSearch =
        !keyword ||
        c.name?.toLowerCase().includes(keyword) ||
        c.email?.toLowerCase().includes(keyword) ||
        c.subject?.toLowerCase().includes(keyword) ||
        c.message?.toLowerCase().includes(keyword)
      return matchStatus && matchSearch
    })
  }, [contacts, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Actions ────────────────────────────────────────────────────────
  const updateLocal = (id, patch) =>
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const setRead = async (id) => {
    setBusyId(id)
    try {
      await markContactReadApi(id, true)
      updateLocal(id, { status: 'read' })
      setSelected((prev) => (prev?.id === id ? { ...prev, status: 'read' } : prev))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menandai pesan sudah dibaca')
    } finally {
      setBusyId(null)
    }
  }

  // Buka detail: klik satu kali langsung buka modal + tandai read
  const openDetail = (contact) => {
    const { id } = contact
    if (isUnread(contact)) setRead(id)
    setSelected(contact)
  }

  const handleDelete = (contact) => {
    // jangan panggil API langsung — buka popup konfirmasi dulu
    setDeleteConfirm(contact)
  }

  const deleteNow = async () => {
    setBusyId(deleteConfirm.id)
    try {
      await deleteContactApi(deleteConfirm.id)
      setContacts((prev) => prev.filter((c) => c.id !== deleteConfirm.id))
      setSelected((prev) => (prev?.id === deleteConfirm.id ? null : prev))
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pesan')
    } finally {
      setBusyId(null)
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Kontak</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Pesan masuk dari formulir “Tinggalkan Pesan” di halaman Hubungi Kami. Pesan terbaru selalu di paling atas.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors shrink-0"
          title="Muat ulang pesan"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Muat Ulang
        </button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Pesan', value: counts.total, icon: MessageSquare, cls: 'text-sky-600 bg-sky-50' },
          { label: 'Belum Dibaca', value: counts.unread, icon: AlertCircle, cls: 'text-amber-600 bg-amber-50' },
          { label: 'Sudah Dibaca', value: counts.read, icon: CheckCheck, cls: 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3.5 flex items-center gap-3">
            <span className={`inline-flex w-9 h-9 rounded-lg items-center justify-center ${cls}`}>
              <Icon size={17} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-gray-900 leading-none">{value}</p>
              <p className="text-[11px] text-gray-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kartu daftar pesan */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, subjek, atau isi pesan..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  filter === f.key
                    ? 'bg-sky-50 text-sky-600 border-sky-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.label}
                {f.key === 'unread' && counts.unread > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                    {counts.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-500 gap-2 px-6 text-center">
              <AlertCircle size={32} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2 px-6 text-center">
              <Inbox size={32} />
              <p className="text-sm">
                {contacts.length === 0
                  ? 'Belum ada pesan masuk. Pesan dari formulir Hubungi Kami akan muncul di sini.'
                  : 'Tidak ada pesan yang cocok dengan filter atau pencarian.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {pageItems.map((c) => (
                <li
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className={`flex items-start gap-3.5 px-4 sm:px-5 py-4 cursor-pointer transition-colors ${
                    isUnread(c) ? 'bg-sky-500/10 hover:bg-sky-500/20' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {/* Avatar */}
                  <span
                    className={`inline-flex w-10 h-10 rounded-full items-center justify-center text-xs font-bold shrink-0 ${
                      isUnread(c) ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {initialsOf(c.name)}
                  </span>

                  {/* Isi */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isUnread(c) && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" title="Belum dibaca" />}
                      <p className={`text-sm truncate ${isUnread(c) ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {c.name}
                      </p>
                      <span className="text-xs text-gray-400 truncate hidden sm:inline">{c.email}</span>
                    </div>
                    <p className={`text-[13px] mt-0.5 truncate ${isUnread(c) ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {c.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.message}</p>
                  </div>

                  {/* Waktu + aksi */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[11px] text-gray-400 whitespace-nowrap" title={formatDateTime(c.created_at)}>
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} pesan
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-gray-500 px-1">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal detail pesan */}
      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3.5">
              <span className="inline-flex w-11 h-11 rounded-full items-center justify-center text-sm font-bold bg-sky-500 text-white shrink-0">
                {initialsOf(selected.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{selected.name}</p>
                <p className="text-xs text-gray-400 truncate">{selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body modal */}
            <div className="px-6 py-5 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400" />
                  {formatDateTime(selected.created_at)}
                </span>
                {selected.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />
                    {selected.phone}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isUnread(selected) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isUnread(selected) ? 'Belum Dibaca' : 'Sudah Dibaca'}
                </span>
              </div>

              <p className="text-[13px] font-semibold text-gray-900 mb-1">{selected.subject}</p>
              <div className="rounded-xl bg-slate-50 border border-gray-100 px-4 py-3.5">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
            </div>

            {/* Footer modal detail */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                disabled={busyId === selected.id}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              >
                Tutup
              </button>
              <button
                onClick={() => handleDelete(selected)}
                disabled={busyId === selected.id}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} />
                Hapus Pesan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup konfirmasi hapus */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Hapus Pesan?</p>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Kamu akan menghapus pesan dari
                <span className="font-semibold text-gray-900"> "{deleteConfirm.name}"</span>
                dengan subjek "{deleteConfirm.subject}".
                <br />
                <span className="text-red-600 font-semibold">Tindakan ini tidak bisa dibatalkan.</span>
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={busyId !== null}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={deleteNow}
                disabled={busyId === deleteConfirm.id}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busyId === deleteConfirm.id ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
