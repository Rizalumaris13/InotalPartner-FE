import { useState, useEffect } from 'react'
import {
  Save,
  List,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import {
  createJoinInvitationApi,
  getJoinInvitationByIdApi,
  updateJoinInvitationApi,
} from '../api/joinInvitation'
import { useAuth } from '../hooks/useAuth'

function toJoinInvitationDraft(data) {
  return {
    sectionLabel: typeof data?.section_label === 'string' ? data.section_label : '',
    title: typeof data?.title === 'string' ? data.title : '',
    buttonText: typeof data?.button_text === 'string' ? data.button_text : '',
    buttonURL: typeof data?.button_url === 'string' ? data.button_url : '',
    isActive: data?.is_active !== false,
  }
}

export default function FormJoinInvitationPage({
  editingCTA = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingCTA

  const [source, setSource] = useState(editingCTA)
  const [draft, setDraft] = useState(() => toJoinInvitationDraft(editingCTA))
  const { sectionLabel, title, buttonText, buttonURL, isActive } = draft

  const [loadingDetail, setLoadingDetail] = useState(!!editingCTA?.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (source !== editingCTA) {
    setSource(editingCTA)
    setDraft(toJoinInvitationDraft(editingCTA))
    setLoadingDetail(!!editingCTA?.id)
    setError('')
  }
  const updateDraft = (changes) => setDraft((previous) => ({ ...previous, ...changes }))

  // Inisialisasi data
  useEffect(() => {
    if (!editingCTA?.id) return
    let isMounted = true

    const loadDetail = async () => {
      try {
        const data = await getJoinInvitationByIdApi(editingCTA.id)
        if (isMounted && data) {
          setDraft(toJoinInvitationDraft(data))
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal memuat detail Ajakan Bergabung'
          )
        }
      } finally {
        if (isMounted) {
          setLoadingDetail(false)
        }
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [editingCTA])

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin || saving) return

    // Validasi
    if (!sectionLabel.trim()) {
      setError('Section label wajib diisi.')
      return
    }
    if (!title.trim()) {
      setError('Title wajib diisi.')
      return
    }
    if (!buttonText.trim()) {
      setError('Button text wajib diisi.')
      return
    }
    if (!buttonURL.trim()) {
      setError('Button URL wajib diisi.')
      return
    }

    setError('')
    setSaving(true)

    try {
      const payload = {
        section_label: sectionLabel.trim(),
        title: title.trim(),
        button_text: buttonText.trim(),
        button_url: buttonURL.trim(),
        is_active: isActive,
      }

      if (isEditing) {
        await updateJoinInvitationApi(editingCTA.id, payload)
      } else {
        await createJoinInvitationApi(payload)
      }

      if (onFinish) {
        onFinish()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan Ajakan Bergabung'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* ── Breadcrumb & Navigation ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {isEditing ? 'Edit Ajakan Bergabung' : 'Tambah Ajakan Bergabung'}
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenList}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition self-start sm:self-auto shadow-sm"
        >
          <List size={16} />
          Daftar Ajakan Bergabung
        </button>
      </div>

      {/* ── Banner Proteksi Non-Admin ──────────────────────────────────── */}
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Akses Terbatas</p>
            <p className="text-xs mt-0.5 text-amber-700">
              Role Anda ({currentRole}) tidak diizinkan untuk menyimpan data Ajakan Bergabung.
              Tombol simpan telah dinonaktifkan.
            </p>
          </div>
        </div>
      )}

      {/* ── Error Banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs">Perhatian</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Form Card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
        {loadingDetail ? (
          <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data Ajakan Bergabung...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Label */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Section Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: KESEMPATAN TERBUKA"
                value={sectionLabel}
                onChange={(e) => updateDraft({ sectionLabel: e.target.value })}
                maxLength={100}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Teks label kecil yang berada tepat di atas judul section (maksimal 100 karakter).
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Judul (Title) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Bangun masa depan bersama kami."
                value={title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Judul utama ajakan bergabung.
              </p>
            </div>

            {/* Grid 2 kolom: Button Text & Button URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Teks Tombol (Button Text) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mulai Sekarang"
                  value={buttonText}
                  onChange={(e) => updateDraft({ buttonText: e.target.value })}
                  maxLength={100}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Teks yang ditampilkan pada tombol action.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Tautan Tombol (Button URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: /register atau https://example.com"
                  value={buttonURL}
                  onChange={(e) => updateDraft({ buttonURL: e.target.value })}
                  maxLength={255}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Rute internal (misal: /register) atau tautan URL eksternal lengkap.
                </p>
              </div>
            </div>

            {/* Is Active Status (Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Status Tampilan
              </label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => updateDraft({ isActive: e.target.value === 'true' })}
                className="w-full sm:w-64 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="true">Aktif (Tampilkan di Halaman)</option>
                <option value="false">Tidak Aktif (Arsipkan / Draft)</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Catatan: Hanya satu Ajakan Bergabung yang aktif pada satu waktu. Mengaktifkan data ini akan otomatis menonaktifkan yang lainnya.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onOpenList}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isAdmin || saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{saving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Ajakan Bergabung'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
