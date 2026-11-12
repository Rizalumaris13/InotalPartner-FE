import { useState, useEffect } from 'react'
import {
  Save,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  X,
} from 'lucide-react'
import {
  getAboutVideoSettingApi,
  saveAboutVideoSettingApi,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

const DEFAULT_VIDEO_SETTING = {
  section_label: 'VIDEO PROFIL',
  section_title: 'Lihat sendiri bagaimana kolaborasi bekerja.',
  section_description: 'Keripitannya kami tampilkan apa adanya: ruang kerja nyata, interaksi harian, dan energi tim yang menghidupkan setiap ide.',
}

export default function FormVideoSettingPage() {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [sectionLabel, setSectionLabel] = useState(DEFAULT_VIDEO_SETTING.section_label)
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_VIDEO_SETTING.section_title)
  const [sectionDescription, setSectionDescription] = useState(DEFAULT_VIDEO_SETTING.section_description)
  const [isActive, setIsActive] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadSetting = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAboutVideoSettingApi()
        if (isMounted && data) {
          setSectionLabel(data.section_label ?? DEFAULT_VIDEO_SETTING.section_label)
          setSectionTitle(data.section_title ?? DEFAULT_VIDEO_SETTING.section_title)
          setSectionDescription(data.section_description ?? DEFAULT_VIDEO_SETTING.section_description)
          setIsActive(data.is_active !== false)
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Gagal memuat pengaturan section video:', err)
          // Biarkan default fallback tetap tampil
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSetting()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) return

    const trimmedTitle = sectionTitle.trim()
    if (!trimmedTitle) {
      setError('Judul section video profil wajib diisi.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        section_label: sectionLabel.trim(),
        section_title: trimmedTitle,
        section_description: sectionDescription.trim(),
        is_active: isActive,
      }

      await saveAboutVideoSettingApi(payload)
      setSuccess('Pengaturan section video profil berhasil disimpan.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan pengaturan section video profil.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Pengaturan Video Tentang
          </h1>
        </div>
      </div>

      {/* Role Warning jika bukan Admin */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Akses Dibatasi</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Anda hanya memiliki akses melihat. Role Anda saat ini tidak diizinkan mengubah pengaturan ini.
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

      {/* Alert Success */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-emerald-800 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={19} />
            <p className="text-sm font-medium">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 hover:text-emerald-700 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Memuat pengaturan section video profil...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Label Section */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Label Section
                </label>
                <input
                  type="text"
                  value={sectionLabel}
                  onChange={(e) => setSectionLabel(e.target.value)}
                  disabled={!isAdmin || saving}
                  placeholder="Contoh: VIDEO PROFIL"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60"
                />
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

            {/* Judul Section */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Judul Utama Section <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                disabled={!isAdmin || saving}
                placeholder="Contoh: Lihat sendiri bagaimana kolaborasi bekerja."
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60"
              />
            </div>

            {/* Deskripsi Section */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Deskripsi Pengantar
              </label>
              <textarea
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                disabled={!isAdmin || saving}
                rows={4}
                placeholder="Tuliskan deskripsi pengantar video profil..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60 resize-y"
              />
            </div>

            {/* Action Buttons */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Simpan Pengaturan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
