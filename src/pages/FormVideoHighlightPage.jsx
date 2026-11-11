import React, { useState, useEffect } from 'react'
import {
  Save,
  List,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react'
import {
  createAboutVideoHighlightApi,
  getAboutVideoHighlightByIdApi,
  updateAboutVideoHighlightApi,
} from '../api/about'
import {
  HIGHLIGHT_ICON_OPTIONS,
  DynamicHighlightIcon,
  normalizeIconName,
} from '../components/HighlightIconHelper'
import { useAuth } from '../hooks/useAuth'

export default function FormVideoHighlightPage({
  editingHighlight = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingHighlight

  // Form states
  const [icon, setIcon] = useState('Video')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const [loadingDetail, setLoadingDetail] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Inisialisasi data form saat mode tambah atau edit
  useEffect(() => {
    let isMounted = true

    if (!isEditing) {
      setIcon('Video')
      setTitle('')
      setDescription('')
      setDisplayOrder(0)
      setIsActive(true)
      setError('')
      setLoadingDetail(false)
      return
    }

    const loadDetail = async () => {
      setLoadingDetail(true)
      setError('')

      const applyData = (data) => {
        const itemIcon = normalizeIconName(data.icon || 'Video')
        setIcon(itemIcon)
        setTitle(data.title || '')
        setDescription(data.description || '')
        setDisplayOrder(typeof data.display_order === 'number' ? data.display_order : 0)
        setIsActive(data.is_active !== false)
      }

      if (editingHighlight) {
        applyData(editingHighlight)
      }

      if (editingHighlight?.id) {
        try {
          const freshData = await getAboutVideoHighlightByIdApi(editingHighlight.id)
          if (isMounted && freshData) {
            applyData(freshData)
          }
        } catch (err) {
          console.warn('Gagal memuat detail terbaru poin video:', err)
        }
      }

      if (isMounted) {
        setLoadingDetail(false)
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [editingHighlight, isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Judul poin video wajib diisi.')
      return
    }

    const trimmedDesc = description.trim()
    if (!trimmedDesc) {
      setError('Deskripsi poin video wajib diisi.')
      return
    }

    const orderNum = parseInt(displayOrder, 10)
    if (isNaN(orderNum) || orderNum < 0) {
      setError('Urutan tampil tidak boleh bernilai negatif.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const normalizedIcon = normalizeIconName(icon || 'Video')
      const payload = {
        icon: normalizedIcon,
        title: trimmedTitle,
        description: trimmedDesc,
        display_order: orderNum,
        is_active: isActive,
      }

      if (isEditing) {
        await updateAboutVideoHighlightApi(editingHighlight.id, payload)
      } else {
        await createAboutVideoHighlightApi(payload)
      }

      onFinish?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menyimpan poin video.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Cek apakah ikon yang tersimpan ada di opsi preset, jika tidak tambahkan secara dinamis agar tetap bisa dipilih/dilihat
  const hasSelectedInOptions = HIGHLIGHT_ICON_OPTIONS.some((opt) => opt.value === icon)

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-sky-500" size={26} />
            {isEditing ? 'Edit Poin Video Profil' : 'Tambah Poin Video Profil'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenList}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer"
        >
          <List size={16} />
          <span>Kembali ke Daftar</span>
        </button>
      </div>

      {/* Role Warning jika bukan Admin */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Akses Dibatasi</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Anda hanya memiliki izin melihat. Role Anda saat ini tidak dapat menyimpan perubahan.
            </p>
          </div>
        </div>
      )}

      {/* Alert Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-700 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5 text-rose-500" size={19} />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8">
        {loadingDetail ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Memuat detail poin video...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pilihan Ikon */}
            <div className="p-5 rounded-2xl bg-sky-50/40 border border-sky-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Ikon Poin Video
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Pilih ikon representasi yang sesuai dari daftar pilihan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8">
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    disabled={!isAdmin || saving}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60 cursor-pointer"
                  >
                    {!hasSelectedInOptions && icon && (
                      <option value={icon}>
                        {icon} (Ikon Saat Ini)
                      </option>
                    )}
                    {HIGHLIGHT_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview Box */}
                <div className="sm:col-span-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200">
                  <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-sky-600 flex items-center justify-center shrink-0">
                    <DynamicHighlightIcon name={icon} size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preview Ikon</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">{icon || 'Video'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Judul Poin Video */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Judul Poin Video <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isAdmin || saving}
                placeholder="Contoh: Transparansi Penuh"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60"
              />
            </div>

            {/* Deskripsi Poin Video */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Deskripsi Singkat <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || saving}
                rows={3}
                placeholder="Tuliskan penjelasan singkat poin video ini..."
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60 resize-y"
              />
            </div>

            {/* Grid 2 Kolom: Urutan & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Urutan Tampil */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Urutan Tampil (Display Order)
                </label>
                <input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  disabled={!isAdmin || saving}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Urutan lebih kecil (misal 1, 2, 3) akan ditampilkan lebih dulu.
                </p>
              </div>

              {/* Status Publikasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Status Publikasi
                </label>
                <div className="flex items-center gap-3 h-[46px] px-4 rounded-xl border border-gray-200 bg-gray-50/50">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={!isAdmin || saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-700">
                    {isActive ? (
                      <span className="text-emerald-600">Aktif (Ditampilkan)</span>
                    ) : (
                      <span className="text-gray-400">Nonaktif (Disembunyikan)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onOpenList}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Poin Video'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
