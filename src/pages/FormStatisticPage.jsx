import React, { useState, useEffect, useRef } from 'react'
import {
  Save,
  List,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  BarChart3,
  X,
  HelpCircle,
} from 'lucide-react'
import {
  createStatisticApi,
  getStatisticByIdApi,
  updateStatisticApi,
} from '../api/statistics'
import {
  STATISTIC_ICON_OPTIONS,
  DynamicStatisticIcon,
  normalizeStatisticIcon,
} from '../components/StatisticIconHelper'
import { useAuth } from '../hooks/useAuth'

export default function FormStatisticPage({
  editingStatistic = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = Boolean(editingStatistic)

  // Form states
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('BarChart3')
  const [statisticValue, setStatisticValue] = useState('')
  const [statisticSuffix, setStatisticSuffix] = useState('')
  const [description, setDescription] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false)
  const iconDropdownRef = useRef(null)

  const [loadingDetail, setLoadingDetail] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(e.target)) {
        setIsIconDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    let isMounted = true

    if (!isEditing) {
      setTitle('')
      setIcon('BarChart3')
      setStatisticValue('')
      setStatisticSuffix('')
      setDescription('')
      setDisplayOrder(0)
      setIsActive(true)
      setError('')
      setLoadingDetail(false)
      return
    }

    const applyData = (data) => {
      setTitle(data.title || '')
      setIcon(normalizeStatisticIcon(data.icon || 'BarChart3'))
      setStatisticValue(data.statistic_value || '')
      setStatisticSuffix(data.statistic_suffix || '')
      setDescription(data.description || '')
      setDisplayOrder(typeof data.display_order === 'number' ? data.display_order : 0)
      setIsActive(data.is_active !== false)
    }

    if (editingStatistic) {
      applyData(editingStatistic)
    }

    if (editingStatistic?.id) {
      setLoadingDetail(true)
      getStatisticByIdApi(editingStatistic.id)
        .then((fresh) => {
          if (isMounted && fresh) {
            applyData(fresh)
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.response?.data?.message ||
                err.message ||
                'Gagal memuat detail data statistik terkini.'
            )
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoadingDetail(false)
          }
        })
    } else {
      setLoadingDetail(false)
    }

    return () => {
      isMounted = false
    }
  }, [editingStatistic, isEditing])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      setError('Hanya admin atau super admin yang memiliki izin mengelola statistik.')
      return
    }

    const cleanTitle = title.trim()
    const cleanValue = statisticValue.trim()
    const cleanSuffix = statisticSuffix.trim()
    const cleanDesc = description.trim()
    const cleanIcon = icon.trim()

    if (!cleanTitle) {
      setError('Judul / Label statistik wajib diisi (contoh: ALUMNI, PARTNERSHIP).')
      return
    }

    if (!cleanIcon) {
      setError('Ikon statistik wajib dipilih.')
      return
    }

    if (!cleanValue) {
      setError('Nilai / Angka statistik wajib diisi (contoh: 2021, 95, 7, 19).')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title: cleanTitle,
      icon: cleanIcon,
      statistic_value: cleanValue,
      statistic_suffix: cleanSuffix,
      description: cleanDesc,
      display_order: parseInt(displayOrder, 10) || 0,
      is_active: isActive,
    }

    try {
      if (isEditing && editingStatistic?.id) {
        await updateStatisticApi(editingStatistic.id, payload)
      } else {
        await createStatisticApi(payload)
      }
      if (typeof onFinish === 'function') {
        onFinish()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan data statistik. Silakan periksa kembali input Anda.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span>About</span>
            <ChevronRight size={12} />
            <span>Statistik Beranda</span>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-semibold">{isEditing ? 'Edit Statistik' : 'Tambah Statistik'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-sky-600" size={24} />
            {isEditing ? 'Edit Statistik Beranda' : 'Tambah Statistik Beranda'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Atur angka, label, dan ikon statistik yang muncul mengambang pada hero Beranda publik.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenList}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition self-start sm:self-auto shadow-sm"
        >
          <List size={16} />
          Daftar Statistik
        </button>
      </div>

      {/* Role Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Perhatian Akses</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Anda masuk dengan role <strong>{currentRole}</strong>. Hanya admin atau super admin yang dapat menyimpan perubahan.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-xs">Terjadi Kesalahan</p>
              <p className="text-xs mt-0.5 text-red-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-6">
          {loadingDetail ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Memuat detail statistik...
            </div>
          ) : (
            <>
              {/* Pratinjau Tampilan Floating Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1">
                    <BarChart3 size={14} />
                    Pratinjau Kartu Hero
                  </span>
                  <p className="text-xs text-gray-300">
                    Bentuk kartu mengambang yang akan dilihat oleh pengunjung di landing page.
                  </p>
                </div>
                <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl px-6 py-4 min-w-[130px] border border-white/20">
                  <span className="text-sky-500 text-3xl font-extrabold leading-none flex items-baseline">
                    {statisticValue || '0'}
                    {statisticSuffix && (
                      <span className="text-sky-400 text-2xl font-bold ml-0.5">{statisticSuffix}</span>
                    )}
                  </span>
                  <span className="text-gray-600 text-xs font-semibold tracking-wide mt-2 text-center flex items-center gap-1.5">
                    <DynamicStatisticIcon name={icon} size={13} className="text-sky-500" />
                    {title ? title.toUpperCase() : 'LABEL STATISTIK'}
                  </span>
                </div>
              </div>

              {/* Grid Baris 1: Judul & Ikon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Judul / Label Statistik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: ALUMNI, PARTNERSHIP, TAHUN BERDIRI"
                    maxLength={150}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Label singkat yang mendeskripsikan angka (maksimal 150 karakter).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Pilihan Ikon Lucide <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={iconDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsIconDropdownOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between pl-3 pr-4 py-2.5 rounded-xl border bg-white text-left transition focus:ring-2 focus:ring-sky-100 outline-none ${
                        isIconDropdownOpen ? 'border-sky-500 ring-2 ring-sky-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                          <DynamicStatisticIcon name={icon} size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {STATISTIC_ICON_OPTIONS.find((opt) => opt.value === icon)?.label || icon}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${
                          isIconDropdownOpen ? 'rotate-180 text-sky-600' : ''
                        }`}
                      />
                    </button>

                    {isIconDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                        {STATISTIC_ICON_OPTIONS.map((opt) => {
                          const isSelected = opt.value === icon
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setIcon(opt.value)
                                setIsIconDropdownOpen(false)
                              }}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition ${
                                isSelected
                                  ? 'bg-sky-50/80 text-sky-900 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-sky-500 text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <DynamicStatisticIcon name={opt.value} size={17} />
                              </div>
                              <span className="truncate">{opt.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Pilih ikon dari daftar ikon Lucide yang mewakili statistik ini.
                  </p>
                </div>
              </div>

              {/* Grid Baris 2: Nilai Angka & Suffix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Nilai / Angka Statistik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={statisticValue}
                    onChange={(e) => setStatisticValue(e.target.value)}
                    placeholder="Contoh: 2021, 95, 7, 19, 25.5"
                    maxLength={30}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Angka utama yang ditampilkan berukuran besar.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Suffix / Satuan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={statisticSuffix}
                    onChange={(e) => setStatisticSuffix(e.target.value)}
                    placeholder="Contoh: +, %, K, Thn (kosongkan jika tidak ada)"
                    maxLength={20}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Karakter yang melekat setelah angka (misal tanda '+' pada '95+').
                  </p>
                </div>
              </div>

              {/* Baris 3: Deskripsi / Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Keterangan / Deskripsi (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan atau rincian tambahan terkait pencapaian ini..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition resize-y"
                />
              </div>

              {/* Grid Baris 4: Urutan & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Urutan Tampilan (Display Order)
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    min={0}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Angka lebih kecil tampil lebih dulu (0, 1, 2, ...).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Status Publikasi
                  </label>
                  <div className="flex items-center gap-3 mt-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                    <span className="text-sm font-semibold text-gray-700">
                      {isActive ? 'Aktif (Tampil di Publik)' : 'Nonaktif (Disembunyikan)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Hanya data dengan status aktif yang akan ditampilkan di halaman publik Beranda.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form Actions Footer */}
        <div className="px-6 md:px-8 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onOpenList}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || loadingDetail || !isAdmin}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0284c7] text-white text-sm font-bold hover:bg-[#0369a1] transition shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Statistik'}
          </button>
        </div>
      </form>
    </div>
  )
}

