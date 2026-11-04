import React, { useState, useEffect, useRef } from 'react'
import { X, Upload, Trash2, User, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { createTeamMemberApi, updateTeamMemberApi, getTeamMembersApi, uploadImageApi, resolveImageUrl } from '../api/about'

export default function TeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
  member = null,
}) {
  const isEditing = !!member

  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const [photoUrl, setPhotoUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (member) {
      setName(member.name || '')
      setPosition(member.position || '')
      setDisplayOrder(typeof member.display_order === 'number' ? member.display_order : 0)
      setIsActive(member.is_active !== undefined ? member.is_active : true)
      setPhotoUrl(member.photo_url || '')
      setImagePreview(resolveImageUrl(member.photo_url) || '')
      setImageFile(null)
      setError('')
    } else {
      setName('')
      setPosition('')
      setDisplayOrder(0)
      setIsActive(true)
      setPhotoUrl('')
      setImageFile(null)
      setImagePreview('')
      setError('')
    }
  }, [member, isOpen])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WebP, dsb)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal adalah 5MB')
      return
    }

    setError('')
    setImageFile(file)
    const localUrl = URL.createObjectURL(file)
    setImagePreview(localUrl)
  }

  const handleRemovePhoto = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview('')
    setPhotoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Nama anggota tidak boleh kosong.')
      return
    }

    const orderNum = parseInt(displayOrder, 10)
    if (isNaN(orderNum) || orderNum < 0) {
      setError('Urutan tampil tidak boleh bernilai negatif.')
      return
    }

    // Validasi display_order sebelum request
    let currentMembers = []
    try {
      const fetched = await getTeamMembersApi()
      if (Array.isArray(fetched)) currentMembers = fetched
    } catch {
      // ignore
    }

    const currentId = member?.id
    const duplicate = currentMembers.find(
      (m) => m.is_active && m.display_order === orderNum && (!currentId || m.id !== currentId)
    )

    if (duplicate) {
      setError(`Nomor urut tampil ${orderNum} sudah digunakan oleh anggota aktif "${duplicate.name || 'lain'}". Silakan gunakan nomor lain.`)
      return
    }

    setIsSubmitting(true)

    try {
      let finalPhotoUrl = photoUrl

      // 1. Upload foto baru jika ada file yang dipilih
      if (imageFile) {
        try {
          const uploadedUrl = await uploadImageApi(imageFile)
          finalPhotoUrl = uploadedUrl || ''
        } catch (uploadErr) {
          throw new Error(uploadErr.response?.data?.message || 'Gagal mengupload foto anggota.')
        }
      }

      // 2. Kirim payload sesuai kontrak API
      const payload = {
        name: trimmedName,
        position: position.trim(),
        photo_url: finalPhotoUrl,
        display_order: orderNum,
        is_active: Boolean(isActive),
      }

      let savedMember
      if (isEditing) {
        savedMember = await updateTeamMemberApi(member.id, payload)
      } else {
        savedMember = await createTeamMemberApi(payload)
      }

      onSuccess?.(savedMember)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              {isEditing ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing
                ? 'Perbarui informasi dan foto profil anggota tim.'
                : 'Lengkapi data anggota untuk ditampilkan di halaman Tentang Kami.'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Foto Anggota
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-slate-400" size={32} />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    {imagePreview ? 'Ganti Foto' : 'Pilih Foto'}
                  </button>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-400">
                  Format: JPG, PNG, atau WebP (maks. 5MB).
                </p>
              </div>
            </div>
          </div>

          {/* Field Nama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Anggota <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dr. Budi Santoso, M.Kom"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-gray-900 transition-colors"
              required
            />
          </div>

          {/* Field Jabatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Jabatan / Posisi
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Contoh: Chief Executive Officer"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-gray-900 transition-colors"
            />
          </div>

          {/* Urutan Tampil & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Urutan Tampil
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-gray-900 transition-colors"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                0 = urutan terdepan.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Publikasi
              </label>
              <div className="h-[42px] flex items-center">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isActive ? (
                      <span className="text-emerald-600 font-semibold">Aktif</span>
                    ) : (
                      <span className="text-gray-400">Nonaktif</span>
                    )}
                  </span>
                </label>
              </div>
              <span className="text-[11px] text-gray-400 block">
                Nonaktif tidak akan tampil di publik.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : isEditing ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Anggota'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
