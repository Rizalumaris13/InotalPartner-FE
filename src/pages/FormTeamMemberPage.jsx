import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Trash2,
  List,
  ShieldAlert,
  AlertCircle,
  Save,
  ChevronRight,
} from 'lucide-react'
import {
  getTeamMemberByIdApi,
  getTeamMembersApi,
  updateTeamMemberApi,
  uploadImageApi,
  resolveImageUrl,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'
import TeamMemberMultiForm from '../components/TeamMemberMultiForm'

export default function FormTeamMemberPage({
  editingMember = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole = (typeof user?.role === 'object' ? user?.role?.name : user?.role) || role || ''
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingMember

  // ─── STATE MODE EDIT (1 ANGGOTA) ──────────────────────────────────────────
  const [editName, setEditName] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editDisplayOrder, setEditDisplayOrder] = useState(0)
  const [editIsActive, setEditIsActive] = useState(true)
  const [editPhotoUrl, setEditPhotoUrl] = useState('')
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const editFileInputRef = useRef(null)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [existingMembers, setExistingMembers] = useState([])

  // Load data anggota saat edit
  useEffect(() => {
    let isMounted = true

    if (!isEditing) {
      setLoading(false)
      return
    }

    const loadMemberDetail = async () => {
      setLoading(true)
      setError('')
      try {
        const all = await getTeamMembersApi()
        if (isMounted && Array.isArray(all)) {
          setExistingMembers(all)
        }

        let memberData = editingMember
        if (editingMember.id) {
          try {
            const fetched = await getTeamMemberByIdApi(editingMember.id)
            if (fetched) memberData = fetched
          } catch (fetchErr) {
            console.warn('Gagal fetch detail anggota, menggunakan props:', fetchErr)
          }
        }

        if (isMounted) {
          setEditName(memberData.name || '')
          setEditPosition(memberData.position || '')
          setEditDisplayOrder(
            typeof memberData.display_order === 'number'
              ? memberData.display_order
              : 0
          )
          setEditIsActive(
            memberData.is_active !== undefined ? memberData.is_active : true
          )
          setEditPhotoUrl(memberData.photo_url || '')
          setEditImagePreview(resolveImageUrl(memberData.photo_url) || '')
          setEditImageFile(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Gagal memuat data anggota tim.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMemberDetail()

    return () => {
      isMounted = false
    }
  }, [editingMember, isEditing])

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert size={42} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold text-red-700">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-red-600">
            Hanya admin dan super_admin yang dapat mengelola data anggota tim.
          </p>
        </div>
      </div>
    )
  }

  // ─── HANDLERS FOTO SAAT EDIT ──────────────────────────────────────────────
  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG, JPG, atau WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB.')
      return
    }

    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview)
    }

    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
    if (error) setError('')
  }

  const handleRemoveEditImage = () => {
    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview)
    }
    setEditImageFile(null)
    setEditImagePreview('')
    setEditPhotoUrl('')
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''
    }
  }

  // ─── SUBMIT HANDLER: EDIT ANGGOTA ─────────────────────────────────────────
  const handleSubmitEdit = async () => {
    setError('')

    const trimmedName = editName.trim()
    if (!trimmedName) {
      setError('Nama anggota tidak boleh kosong.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const orderNum = parseInt(editDisplayOrder, 10)
    if (isNaN(orderNum) || orderNum < 0) {
      setError('Urutan tampil tidak boleh bernilai negatif.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Validasi keunikan urutan terhadap anggota lain
    let currentMembers = existingMembers
    try {
      const fresh = await getTeamMembersApi()
      if (Array.isArray(fresh)) {
        currentMembers = fresh
        setExistingMembers(fresh)
      }
    } catch {}

    const duplicate = currentMembers.find(
      (m) => m.is_active && m.display_order === orderNum && m.id !== editingMember?.id
    )
    if (duplicate) {
      setError(
        `Nomor urut tampil ${orderNum} sudah digunakan oleh anggota aktif "${duplicate.name || 'lain'}". Silakan pilih nomor urut lain.`
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    try {
      let finalPhotoUrl = editPhotoUrl
      if (editImageFile) {
        setUploading(true)
        try {
          finalPhotoUrl = await uploadImageApi(editImageFile)
        } catch (uploadErr) {
          throw new Error(
            uploadErr.response?.data?.message || 'Gagal mengunggah foto anggota.'
          )
        } finally {
          setUploading(false)
        }
      }

      const payload = {
        name: trimmedName,
        position: editPosition.trim(),
        photo_url: finalPhotoUrl || '',
        display_order: orderNum,
        is_active: Boolean(editIsActive),
      }

      await updateTeamMemberApi(editingMember.id, payload)
      alert('Data anggota tim berhasil diperbarui.')
      onFinish?.()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menyimpan data anggota tim.'
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    )
  }

  // ─── JIKA MODE EDIT: TAMPILKAN FORM EDIT SINGLE ANGGOTA ───────────────────
  if (isEditing) {
    const editOrderNum = parseInt(editDisplayOrder, 10)
    const duplicateMember = !isNaN(editOrderNum)
      ? existingMembers.find(
          (m) => m.is_active && m.display_order === editOrderNum && m.id !== editingMember?.id
        )
      : null

    return (
      <div className="flex flex-col pb-12">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
              <span>About</span>
              <ChevronRight size={12} />
              <span className="text-gray-700 font-medium">Edit Anggota Tim</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              Edit Anggota Tim
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Perbarui profil, jabatan, foto, dan urutan tampil anggota tim.
            </p>
          </div>

          {onOpenList && (
            <button
              type="button"
              onClick={onOpenList}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 self-start sm:self-auto shadow-sm"
            >
              <List size={17} />
              Lihat List About
            </button>
          )}
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong>Error: </strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* FORM GRID — sama dengan CreateAboutPage: lg:grid-cols-12 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Nama, Jabatan, Status (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Nama Anggota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Dr. Budi Santoso, M.Kom"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder="Contoh: Chief Executive Officer"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Status Anggota — sama dengan CreateAboutPage: select dropdown */}
              <div className="pt-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Status Anggota
                </label>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  {editIsActive
                    ? 'Aktif: anggota ditampilkan pada halaman Tentang Kami publik.'
                    : 'Tidak Aktif: anggota tetap tersimpan di database, tetapi tidak ditampilkan pada halaman publik.'}
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Foto & Urutan Tampil (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Foto Anggota
                </label>
                {editImagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={editImagePreview}
                      alt="Preview Anggota"
                      className="h-44 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveEditImage}
                      className="absolute right-2.5 top-2.5 rounded-lg bg-white/90 p-1.5 text-red-500 shadow-md backdrop-blur-xs transition hover:bg-white hover:text-red-700"
                      title="Hapus foto"
                    >
                      <Trash2 size={16} />
                    </button>
                    {editImageFile && (
                      <div className="border-t border-gray-100 bg-white px-3 py-1.5">
                        <p className="truncate text-[11px] font-medium text-gray-600">
                          {editImageFile.name}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4 transition hover:border-sky-400 hover:bg-sky-50/40"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sky-500 shadow-xs">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Upload Foto Anggota</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">PNG, JPG, WEBP — Maks. 5MB</p>
                  </button>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleEditImageChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Urutan Tampil <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
                    duplicateMember
                      ? 'border-red-300 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                  required
                />
                {duplicateMember ? (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Nomor urut {editDisplayOrder} sudah digunakan oleh anggota aktif{' '}
                    <span className="font-semibold">{duplicateMember.name || 'anggota lain'}</span>.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Menentukan urutan kemunculan di halaman publik (nomor urut kecil tampil lebih awal).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            {onOpenList && (
              <button
                type="button"
                onClick={onOpenList}
                disabled={saving || uploading}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmitEdit}
              disabled={saving || uploading}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving || uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    )
  }

  // ─── JIKA MODE TAMBAH: REUSE TeamMemberMultiForm ───────────────────────────
  return (
    <div className="flex flex-col pb-12">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
            <span>About</span>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Tambah Anggota Tim</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            Tambah Anggota Tim
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tersedia 4 form anggota tim sekaligus. Anda dapat mengisi sebagian atau seluruh form. Form yang dikosongkan akan diabaikan secara otomatis.
          </p>
        </div>

        {onOpenList && (
          <button
            type="button"
            onClick={onOpenList}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 self-start sm:self-auto shadow-sm"
          >
            <List size={17} />
            Lihat List About
          </button>
        )}
      </div>

      <TeamMemberMultiForm
        onSuccess={onFinish}
        onOpenList={onOpenList}
        buttonLabel="Simpan Perubahan"
      />
    </div>
  )
}
