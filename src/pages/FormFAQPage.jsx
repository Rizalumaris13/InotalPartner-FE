import React, { useState, useEffect } from 'react'
import {
  Save,
  List,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  HelpCircle,
  X,
} from 'lucide-react'
import {
  createAboutFAQApi,
  getAboutFAQByIdApi,
  updateAboutFAQApi,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

export default function FormFAQPage({
  editingFAQ = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingFAQ

  // Form states
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const [loadingDetail, setLoadingDetail] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Inisialisasi data form saat mode tambah atau edit
  useEffect(() => {
    let isMounted = true

    if (!isEditing) {
      setQuestion('')
      setAnswer('')
      setDisplayOrder(0)
      setIsActive(true)
      setError('')
      setLoadingDetail(false)
      return
    }

    const loadDetail = async () => {
      setLoadingDetail(true)
      setError('')

      // Isi dari props jika sudah ada
      if (editingFAQ) {
        setQuestion(editingFAQ.question || '')
        setAnswer(editingFAQ.answer || '')
        setDisplayOrder(
          typeof editingFAQ.display_order === 'number'
            ? editingFAQ.display_order
            : 0
        )
        setIsActive(editingFAQ.is_active !== false)
      }

      // Ambil data fresh dari API jika ada ID
      if (editingFAQ?.id) {
        try {
          const freshData = await getAboutFAQByIdApi(editingFAQ.id)
          if (isMounted && freshData) {
            setQuestion(freshData.question || '')
            setAnswer(freshData.answer || '')
            setDisplayOrder(
              typeof freshData.display_order === 'number'
                ? freshData.display_order
                : 0
            )
            setIsActive(freshData.is_active !== false)
          }
        } catch (err) {
          console.warn('Gagal memuat detail terbaru FAQ:', err)
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
  }, [editingFAQ, isEditing])

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      setError('Hanya admin dan super_admin yang dapat menyimpan data FAQ.')
      return
    }

    const trimmedQuestion = question.trim()
    const trimmedAnswer = answer.trim()

    // Validasi frontend
    if (!trimmedQuestion) {
      setError('Pertanyaan FAQ wajib diisi.')
      return
    }
    if (trimmedQuestion.length > 255) {
      setError('Pertanyaan maksimal 255 karakter.')
      return
    }
    if (!trimmedAnswer) {
      setError('Jawaban FAQ wajib diisi.')
      return
    }

    const parsedOrder = parseInt(displayOrder, 10)
    if (isNaN(parsedOrder) || parsedOrder < 0) {
      setError('Urutan tampil harus berupa angka minimal 0.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      question: trimmedQuestion,
      answer: trimmedAnswer,
      display_order: parsedOrder,
      is_active: isActive,
    }

    try {
      if (isEditing) {
        await updateAboutFAQApi(editingFAQ.id, payload)
      } else {
        await createAboutFAQApi(payload)
      }

      if (onFinish) {
        onFinish()
      } else if (onOpenList) {
        onOpenList()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan data FAQ'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* ── Breadcrumb & Action bar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>About</span>
            <ChevronRight size={12} />
            <button
              type="button"
              onClick={onOpenList}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-semibold">
              {isEditing ? 'Edit FAQ' : 'Tambah FAQ'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="text-sky-600" size={24} />
            {isEditing ? 'Edit Pertanyaan FAQ' : 'Tambah Pertanyaan FAQ Baru'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenList}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <List size={16} />
          Kembali ke Daftar
        </button>
      </div>

      {/* ── Banner Proteksi Non-Admin ──────────────────────────────────── */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <ShieldAlert size={18} className="shrink-0 text-amber-600" />
          <span>
            Hanya <strong>Admin</strong> atau <strong>Super Admin</strong> yang
            diizinkan untuk menambah atau mengedit FAQ.
          </span>
        </div>
      )}

      {/* ── Notifikasi Error ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Form Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-6 sm:p-8">
        {loadingDetail ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Memuat detail data FAQ...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Pertanyaan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Pertanyaan <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    question.length > 255
                      ? 'text-red-500 font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  {question.length}/255 karakter
                </span>
              </div>
              <input
                type="text"
                placeholder="Contoh: Bagaimana mekanisme pengajuan kerja sama atau partnership?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={255}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Input Jawaban */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Jawaban <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={7}
                placeholder="Tuliskan jawaban yang lengkap, jelas, dan informatif untuk pengunjung..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* Grid: Urutan Tampil & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Urutan Tampil */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Urutan Tampil (Display Order)
                </label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  disabled={!isAdmin || saving}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-gray-400">
                  Angka lebih kecil tampil lebih awal (mulai dari 0).
                </p>
              </div>

              {/* Status Aktif / Tidak Aktif */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Status Publikasi
                </label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  disabled={!isAdmin || saving}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="true">Aktif (Tampil di Halaman Publik)</option>
                  <option value="false">Tidak Aktif (Disembunyikan)</option>
                </select>
                <p className="text-[11px] text-gray-400">
                  Pilih apakah FAQ ini langsung dapat dilihat oleh publik.
                </p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onOpenList}
                disabled={saving}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{isEditing ? 'Simpan Perubahan' : 'Simpan FAQ'}</span>
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

