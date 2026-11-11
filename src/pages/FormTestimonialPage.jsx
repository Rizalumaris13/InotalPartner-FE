import React, { useState, useEffect, useRef } from 'react'
import {
  Save,
  List,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  ImageIcon,
  User,
  Quote,
  Upload,
  Trash2,
} from 'lucide-react'
import {
  createTestimonialApi,
  getTestimonialByIdApi,
  updateTestimonialApi,
} from '../api/testimonials'
import { uploadImageApi, resolveImageUrl } from '../api/posts'
import { useAuth } from '../hooks/useAuth'

export default function FormTestimonialPage({
  editingTestimonial = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingTestimonial

  // Form states
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')
  const [content, setContent] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  // Upload photo states
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef(null)

  const [loadingDetail, setLoadingDetail] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Inisialisasi data saat mode edit atau tambah baru
  useEffect(() => {
    let isMounted = true

    // Bersihkan preview blob lama jika ada
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    if (!isEditing) {
      setName('')
      setPosition('')
      setCompany('')
      setContent('')
      setPhotoUrl('')
      setImageFile(null)
      setImagePreview('')
      setDisplayOrder(0)
      setIsActive(true)
      setError('')
      setLoadingDetail(false)
      return
    }

    const loadDetail = async () => {
      setLoadingDetail(true)
      setError('')
      try {
        let data = editingTestimonial
        // Jika hanya ada ID atau data belum lengkap
        if (
          editingTestimonial?.id &&
          (!editingTestimonial.content || !editingTestimonial.name)
        ) {
          data = await getTestimonialByIdApi(editingTestimonial.id)
        }

        if (isMounted && data) {
          setName(data.name || '')
          setPosition(data.position || '')
          setCompany(data.company || '')
          setContent(data.content || '')
          const initialPhoto = data.photo_url || ''
          setPhotoUrl(initialPhoto)
          setImageFile(null)
          setImagePreview(initialPhoto ? resolveImageUrl(initialPhoto) : '')
          setDisplayOrder(data.display_order ?? 0)
          setIsActive(data.is_active ?? true)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal memuat detail testimoni'
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
  }, [editingTestimonial, isEditing])

  // Cleanup object URL saat unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert size={42} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold text-red-700">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-red-600">
            Hanya admin dan super_admin yang dapat mengelola Testimonial.
          </p>
        </div>
      </div>
    )
  }

  // ─── HANDLER PEMILIHAN FOTO ──────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert('Format gambar harus berupa JPG, JPEG, PNG, atau WebP.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      alert('Ukuran gambar maksimal 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    if (error) setError('')
  }

  // Menghapus pilihan foto
  const handleRemoveImage = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview('')
    setPhotoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ─── SUBMIT HANDLER ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedContent = content.trim()
    const parsedOrder = parseInt(displayOrder, 10)

    // Validasi dasar frontend
    if (!trimmedName) {
      setError('Nama pemberi testimoni wajib diisi.')
      return
    }
    if (trimmedName.length > 150) {
      setError('Nama pemberi testimoni maksimal 150 karakter.')
      return
    }

    if (position.trim().length > 100) {
      setError('Jabatan / posisi maksimal 100 karakter.')
      return
    }

    if (company.trim().length > 150) {
      setError('Nama perusahaan / instansi maksimal 150 karakter.')
      return
    }

    if (!trimmedContent) {
      setError('Isi testimoni wajib diisi.')
      return
    }

    if (isNaN(parsedOrder) || parsedOrder < 0) {
      setError('Urutan tampilan harus berupa bilangan bulat nonnegatif (>= 0).')
      return
    }

    setSaving(true)

    try {
      // 1. Upload gambar jika pengguna memilih file baru
      let finalPhotoUrl = photoUrl
      if (imageFile) {
        setUploading(true)
        try {
          const uploadResult = await uploadImageApi(imageFile)
          // Tangani hasil string atau objek response
          if (typeof uploadResult === 'string') {
            finalPhotoUrl = uploadResult
          } else if (uploadResult?.url) {
            finalPhotoUrl = uploadResult.url
          } else if (uploadResult?.data?.url) {
            finalPhotoUrl = uploadResult.data.url
          } else {
            finalPhotoUrl = String(uploadResult || '')
          }
        } catch (uploadErr) {
          throw new Error(
            uploadErr.response?.data?.message ||
              uploadErr.message ||
              'Gagal mengunggah foto testimoni.'
          )
        } finally {
          setUploading(false)
        }
      }

      // 2. Simpan data testimonial
      const payload = {
        name: trimmedName,
        position: position.trim(),
        company: company.trim(),
        content: trimmedContent,
        photo_url: finalPhotoUrl || '',
        display_order: parsedOrder,
        is_active: isActive,
      }

      if (isEditing) {
        await updateTestimonialApi(editingTestimonial.id, payload)
      } else {
        await createTestimonialApi(payload)
      }

      onFinish?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan testimoni.'
      )
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  if (loadingDetail) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  const isProcessing = saving || uploading

  return (
    <div className="flex flex-col pb-12">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            {isEditing ? 'Edit Testimonial' : 'Tambah Testimonial Baru'}
          </h1>
          {/* <p className="mt-1 text-sm text-gray-500">
            {isEditing
              ? 'Perbarui konten testimoni, data partner, dan pengaturan tampilannya.'
              : 'Tambahkan testimoni partner baru untuk ditampilkan di section Beranda.'}
          </p> */}
        </div>
      </div>

      {/* ── ERROR ALERT ───────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong>Error: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── FORM CONTENT ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* KOLOM KIRI: DATA UTAMA */}
          <div className="space-y-6">
            {/* Nama */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Nama Pemberi Testimoni <span className="text-red-500">*</span>
                </h2>
              </div>

              <input
                type="text"
                value={name}
                maxLength={150}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Contoh: Andi Prasetyo"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-base font-semibold outline-none transition placeholder:font-normal focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                required
              />
              <div className="mt-1.5 flex justify-end">
                <span className="text-[11px] text-gray-400">
                  {name.length}/150
                </span>
              </div>
            </section>

            {/* Posisi & Perusahaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-gray-900">
                    Posisi / Jabatan
                  </h2>
                </div>

                <input
                  type="text"
                  value={position}
                  maxLength={100}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: CEO / Direktur"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </section>

              <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-gray-900">
                    Perusahaan / Instansi
                  </h2>
                </div>

                <input
                  type="text"
                  value={company}
                  maxLength={150}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Contoh: TechNusa Ventures"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </section>
            </div>

            {/* Isi Testimoni */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Quote size={18} className="text-sky-500" />
                    Isi Testimoni <span className="text-red-500">*</span>
                  </h2>

                </div>
              </div>

              <textarea
                rows={5}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Tuliskan isi ulasan partner di sini..."
                className="w-full rounded-lg border border-gray-200 p-4 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 placeholder:text-gray-400"
                required
              />
            </section>
          </div>

          {/* KOLOM KANAN: UPLOAD FOTO, URUTAN & STATUS */}
          <aside className="space-y-6">
            {/* Upload Foto Card */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ImageIcon size={19} className="text-gray-500" />
                <h2 className="font-bold text-gray-900 text-sm">
                  Foto Pemberi Testimoni
                </h2>
              </div>

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
                  <img
                    src={imagePreview}
                    alt="Preview Testimoni"
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isProcessing}
                    className="absolute right-3 top-3 rounded-lg bg-white p-2 text-red-500 shadow-md transition hover:bg-red-50 disabled:opacity-50"
                    title="Hapus foto"
                  >
                    <Trash2 size={18} />
                  </button>
                  {imageFile && (
                    <div className="border-t border-gray-100 bg-white px-4 py-3">
                      <p className="truncate text-xs font-medium text-gray-700">
                        {imageFile.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {(imageFile.size / 1024).toFixed(1)} KB (File siap diunggah)
                      </p>
                    </div>
                  )}
                  {!imageFile && photoUrl && (
                    <div className="border-t border-gray-100 bg-white px-4 py-3 flex items-center justify-between">
                      <p className="truncate text-xs font-medium text-gray-700">
                        Foto tersimpan
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="text-xs text-sky-600 font-semibold hover:underline"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 transition hover:border-sky-400 hover:bg-sky-50/40 disabled:cursor-not-allowed"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-sky-500 shadow-sm">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Pilih foto
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    JPG, JPEG, PNG, WebP — maks. 5 MB
                  </p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </section>

            {/* Pengaturan Tampilan */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h2 className="mb-1 text-sm font-bold text-gray-900">
                  Urutan Tampilan
                </h2>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Aktifkan di Halaman Beranda
                  </span>
                </label>
              </div>
            </section>
          </aside>
        </div>

        {/* ── BOTTOM ACTIONS ───────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {onOpenList && (
            <button
              type="button"
              onClick={onOpenList}
              disabled={isProcessing}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {uploading ? 'Mengunggah Foto...' : 'Menyimpan...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? 'Simpan Perubahan' : 'Buat Testimonial'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
