import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Trash2,
  AlertCircle,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react'
import {
  getTeamMembersApi,
  createTeamMemberApi,
  uploadImageApi,
} from '../api/about'

const createEmptyMemberForm = (defaultOrder = 1) => ({
  name: '',
  position: '',
  order: defaultOrder,
  photoUrl: '',
  imageFile: null,
  imagePreview: '',
})

export default function TeamMemberMultiForm({
  onSuccess,
  onOpenList,
  buttonLabel = 'Simpan Perubahan',
}) {
  const [memberForms, setMemberForms] = useState([
    createEmptyMemberForm(1),
    createEmptyMemberForm(2),
    createEmptyMemberForm(3),
    createEmptyMemberForm(4),
  ])
  const [existingMembers, setExistingMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRefs = useRef([])

  // Fungsi untuk mengambil nomor urut berikutnya yang tersedia di database
  const refreshAvailableOrders = async () => {
    try {
      const all = await getTeamMembersApi()
      const membersList = Array.isArray(all) ? all : []
      setExistingMembers(membersList)

      const usedOrders = new Set(
        membersList.filter((m) => m.is_active).map((m) => m.display_order)
      )
      const assignedOrders = []
      let candidate = 1
      while (assignedOrders.length < 4) {
        if (!usedOrders.has(candidate)) {
          assignedOrders.push(candidate)
        }
        candidate++
      }

      setMemberForms((prev) =>
        prev.map((f, idx) => {
          // Hanya ubah urutan jika form belum diisi
          if (isFormEmpty(f)) {
            return { ...f, order: assignedOrders[idx] || idx + 1 }
          }
          return f
        })
      )
    } catch (err) {
      console.warn('Gagal memuat nomor urut tersedia:', err)
    }
  }

  useEffect(() => {
    refreshAvailableOrders()
  }, [])

  const isFormEmpty = (form) => {
    return (
      !form.name?.trim() &&
      !form.position?.trim() &&
      !form.imageFile &&
      !form.photoUrl?.trim()
    )
  }

  const handleUpdateField = (index, field, value) => {
    setMemberForms((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    if (error) setError('')
    if (successMsg) setSuccessMsg('')
  }

  const handleImageChange = (index, e) => {
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

    setMemberForms((prev) => {
      const updated = [...prev]
      if (updated[index].imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(updated[index].imagePreview)
      }
      updated[index] = {
        ...updated[index],
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }
      return updated
    })
    if (error) setError('')
    if (successMsg) setSuccessMsg('')
  }

  const handleRemoveImage = (index) => {
    setMemberForms((prev) => {
      const updated = [...prev]
      if (updated[index].imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(updated[index].imagePreview)
      }
      updated[index] = {
        ...updated[index],
        imageFile: null,
        imagePreview: '',
        photoUrl: '',
      }
      return updated
    })
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = ''
    }
  }

  const handleClearForm = (index) => {
    setMemberForms((prev) => {
      const updated = [...prev]
      if (updated[index].imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(updated[index].imagePreview)
      }
      updated[index] = {
        ...updated[index],
        name: '',
        position: '',
        imageFile: null,
        imagePreview: '',
        photoUrl: '',
      }
      return updated
    })
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = ''
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    setSuccessMsg('')

    // 1. Saring form yang aktif (terisi sebagian atau lengkap)
    const activeFormsWithIndex = memberForms
      .map((form, index) => ({ form, index }))
      .filter(({ form }) => !isFormEmpty(form))

    // Skenario 1: Keempat form kosong -> tolak penyimpanan
    if (activeFormsWithIndex.length === 0) {
      setError(
        'Seluruh form masih kosong. Silakan isi minimal satu form anggota tim untuk disimpan.'
      )
      return
    }

    // 2. Validasi field per form yang aktif
    for (const { form, index } of activeFormsWithIndex) {
      const label = `Anggota Tim ${index + 1}`

      if (!form.name.trim()) {
        setError(`${label}: Nama anggota wajib diisi jika form diisi.`)
        return
      }

      const orderNum = parseInt(form.order, 10)
      if (isNaN(orderNum) || orderNum < 0) {
        setError(`${label}: Nomor urut tampil harus berupa angka minimal 0.`)
        return
      }
    }

    // 3. Validasi duplikasi nomor urut antar form aktif yang akan disimpan
    const seenOrders = new Map()
    for (const { form, index } of activeFormsWithIndex) {
      const orderNum = parseInt(form.order, 10)
      if (seenOrders.has(orderNum)) {
        const prevIndex = seenOrders.get(orderNum)
        setError(
          `Nomor urut tampil ${orderNum} digunakan oleh lebih dari satu form (Anggota Tim ${prevIndex + 1} dan Anggota Tim ${index + 1}). Setiap anggota harus memiliki nomor urut yang unik.`
        )
        return
      }
      seenOrders.set(orderNum, index)
    }

    // 4. Validasi duplikasi nomor urut terhadap anggota tim existing di database
    let currentMembers = existingMembers
    try {
      const fresh = await getTeamMembersApi()
      if (Array.isArray(fresh)) {
        currentMembers = fresh
        setExistingMembers(fresh)
      }
    } catch {}

    for (const { form, index } of activeFormsWithIndex) {
      const orderNum = parseInt(form.order, 10)
      const duplicate = currentMembers.find(
        (m) => m.is_active && m.display_order === orderNum
      )
      if (duplicate) {
        setError(
          `Anggota Tim ${index + 1}: Nomor urut tampil ${orderNum} sudah digunakan oleh anggota aktif existing "${duplicate.name || 'lain'}". Silakan pilih nomor urut lain.`
        )
        return
      }
    }

    // 5. Simpan hanya form yang valid dan terisi
    setSaving(true)
    try {
      let savedCount = 0

      for (const { form, index } of activeFormsWithIndex) {
        let finalPhotoUrl = form.photoUrl

        // Upload foto baru jika ada file yang dipilih
        if (form.imageFile) {
          setUploading(true)
          try {
            finalPhotoUrl = await uploadImageApi(form.imageFile)
          } catch (uploadErr) {
            throw new Error(
              `Anggota Tim ${index + 1}: ` +
                (uploadErr.response?.data?.message || 'Gagal mengunggah foto.')
            )
          } finally {
            setUploading(false)
          }
        }

        const payload = {
          name: form.name.trim(),
          position: form.position.trim(),
          photo_url: finalPhotoUrl || '',
          display_order: parseInt(form.order, 10),
          is_active: true,
        }

        await createTeamMemberApi(payload)
        savedCount++
      }

      setSuccessMsg(`Berhasil menyimpan ${savedCount} anggota tim baru!`)

      // Bersihkan preview blob dan input file
      for (let i = 0; i < 4; i++) {
        if (memberForms[i].imagePreview?.startsWith('blob:')) {
          URL.revokeObjectURL(memberForms[i].imagePreview)
        }
        if (fileInputRefs.current[i]) {
          fileInputRefs.current[i].value = ''
        }
      }

      // Reset form teks dan perbarui urutan default
      await refreshAvailableOrders()

      setMemberForms((prev) =>
        prev.map((f) => ({
          ...f,
          name: '',
          position: '',
          imageFile: null,
          imagePreview: '',
          photoUrl: '',
        }))
      )

      onSuccess?.(savedCount)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menyimpan data anggota tim.'
      )
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ALERT FEEDBACK */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5 shadow-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong>Error: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 4 FORMS SEKALIGUS */}
      <div className="space-y-6">
        {memberForms.map((form, index) => {
          const formEmpty = isFormEmpty(form)
          const orderNum = parseInt(form.order, 10)

          const isDuplicateWithOtherForm =
            !formEmpty &&
            !isNaN(orderNum) &&
            memberForms.some(
              (other, oIndex) =>
                oIndex !== index &&
                !isFormEmpty(other) &&
                parseInt(other.order, 10) === orderNum
            )

          const existingCollision =
            !formEmpty &&
            !isNaN(orderNum) &&
            existingMembers.find((m) => m.is_active && m.display_order === orderNum)

          return (
            <section
              key={index}
              className={`rounded-xl border transition-all ${
                formEmpty
                  ? 'border-gray-200 bg-white shadow-xs opacity-90'
                  : 'border-sky-200 bg-white shadow-sm ring-1 ring-sky-100'
              } p-6`}
            >
              {/* HEADER FORM PER ANGGOTA */}
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      formEmpty
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-sky-500 text-white'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Anggota Tim {index + 1}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formEmpty
                        ? 'Kosong (Akan diabaikan saat penyimpanan)'
                        : 'Aktif (Akan disimpan ke daftar tim)'}
                    </p>
                  </div>
                </div>

                {!formEmpty && (
                  <button
                    type="button"
                    onClick={() => handleClearForm(index)}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Kosongkan form ini"
                  >
                    <X size={14} />
                    Kosongkan Form
                  </button>
                )}
              </div>

              {/* BODY FORM (GRID 2 KOLOM) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                {/* KOLOM KIRI: NAMA, JABATAN, URUTAN */}
                <div className="space-y-4">
                  {/* NAMA */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Nama Anggota{' '}
                      <span className="text-gray-400 font-normal">
                        (wajib jika form diisi)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        handleUpdateField(index, 'name', e.target.value)
                      }
                      placeholder="Contoh: Dr. Budi Santoso, M.Kom"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:font-normal focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  {/* JABATAN & URUTAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* JABATAN */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Jabatan / Posisi
                      </label>
                      <input
                        type="text"
                        value={form.position}
                        onChange={(e) =>
                          handleUpdateField(index, 'position', e.target.value)
                        }
                        placeholder="Contoh: Chief Executive Officer"
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>

                    {/* URUTAN TAMPIL */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Urutan Tampil
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.order}
                        onChange={(e) =>
                          handleUpdateField(index, 'order', e.target.value)
                        }
                        className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                          isDuplicateWithOtherForm || existingCollision
                            ? 'border-red-300 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 focus:border-sky-500 focus:ring-sky-100'
                        }`}
                      />
                      {isDuplicateWithOtherForm ? (
                        <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          Urutan {form.order} bentrok dengan form lain.
                        </p>
                      ) : existingCollision ? (
                        <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          Urutan {form.order} sudah dipakai oleh{' '}
                          {existingCollision.name || 'anggota lain'}.
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-gray-400">
                          Nomor urut tampil anggota di landing page.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN: FOTO ANGGOTA */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Foto Anggota
                  </label>

                  {form.imagePreview ? (
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-50 w-full aspect-square max-w-[200px] mx-auto lg:mx-0">
                      <img
                        src={form.imagePreview}
                        alt={`Preview Anggota ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-500 shadow-sm transition hover:bg-white hover:text-red-600"
                        title="Hapus foto"
                      >
                        <Trash2 size={16} />
                      </button>
                      {form.imageFile && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 text-center">
                          <p className="truncate text-[10px] text-white">
                            {form.imageFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="flex aspect-square w-full max-w-[200px] mx-auto lg:mx-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-3 transition hover:border-sky-400 hover:bg-sky-50/40"
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sky-500 shadow-xs">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">
                        Upload Foto
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 text-center">
                        PNG, JPG, WEBP (maks 5MB)
                      </p>
                    </button>
                  )}

                  <input
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleImageChange(index, e)}
                    className="hidden"
                  />
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* ACTION BUTTON (BOTTOM) */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onOpenList && (
          <button
            type="button"
            onClick={onOpenList}
            disabled={saving || uploading}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Lihat List About
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || uploading}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving || uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan Perubahan...
            </>
          ) : (
            <>
              <Save size={16} />
              {buttonLabel}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
