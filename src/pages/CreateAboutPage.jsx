import React, { useState, useEffect, useRef } from 'react'
import {
  Save,
  List,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Upload,
  Trash2,
  X,
  Edit3,
} from 'lucide-react'
import {
  getAboutSettingApi,
  saveAboutSettingApi,
  getTeamMembersApi,
  getTeamMemberByIdApi,
  createTeamMemberApi,
  updateTeamMemberApi,
  uploadImageApi,
  resolveImageUrl,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

export default function CreateAboutPage({
  editingMember = null,
  onFinishEdit,
  onCancelEdit,
  onAddNew,
  onEdit,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole = (typeof user?.role === 'object' ? user?.role?.name : user?.role) || role || 'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  // ─── State Pengaturan Judul Tim Kami ───────────────────────────────────────
  const [teamTitle, setTeamTitle] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loadingTitle, setLoadingTitle] = useState(true)
  const [savingTitle, setSavingTitle] = useState(false)
  const [titleSuccess, setTitleSuccess] = useState('')
  const [titleError, setTitleError] = useState('')

  // ─── State Form Input Satu Anggota Tim ──────────────────────────────────────
  const [currentEditingMember, setCurrentEditingMember] = useState(editingMember)
  const isEditing = !!currentEditingMember
  const memberSectionRef = useRef(null)

  const [memberName, setMemberName] = useState('')
  const [memberPosition, setMemberPosition] = useState('')
  const [memberOrder, setMemberOrder] = useState(1)
  const [memberIsActive, setMemberIsActive] = useState(true)
  const [memberPhotoUrl, setMemberPhotoUrl] = useState('')
  const [memberImageFile, setMemberImageFile] = useState(null)
  const [memberImagePreview, setMemberImagePreview] = useState('')
  const fileInputRef = useRef(null)

  const [existingMembers, setExistingMembers] = useState([])
  const [savingMember, setSavingMember] = useState(false)
  const [uploadingMember, setUploadingMember] = useState(false)
  const [memberSuccess, setMemberSuccess] = useState('')
  const [memberError, setMemberError] = useState('')

  // Helper: Ambil nomor urut pertama yang belum terpakai oleh anggota AKTIF di database
  const getNextAvailableOrder = (membersList) => {
    const usedOrders = new Set(
      (membersList || [])
        .filter((m) => m.is_active)
        .map((m) => m.display_order)
    )
    let candidate = 1
    while (usedOrders.has(candidate)) {
      candidate++
    }
    return candidate
  }

  // Sinkronisasi data ketika prop editingMember berubah (misal tombol Edit di List About ditekan)
  useEffect(() => {
    let isMounted = true

    if (editingMember) {
      setCurrentEditingMember(editingMember)
      setMemberName(editingMember.name || '')
      setMemberPosition(editingMember.position || '')
      setMemberOrder(
        typeof editingMember.display_order === 'number'
          ? editingMember.display_order
          : 1
      )
      setMemberIsActive(
        editingMember.is_active !== undefined ? editingMember.is_active : true
      )
      setMemberPhotoUrl(editingMember.photo_url || '')
      setMemberImagePreview(
        editingMember.photo_url ? resolveImageUrl(editingMember.photo_url) : ''
      )
      setMemberImageFile(null)
      setMemberError('')

      // Scroll halus ke form anggota tim agar user langsung fokus
      setTimeout(() => {
        memberSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)

      // Ambil data anggota terbaru dari server jika id tersedia
      if (editingMember.id) {
        getTeamMemberByIdApi(editingMember.id)
          .then((fresh) => {
            if (isMounted && fresh) {
              setCurrentEditingMember(fresh)
              setMemberName(fresh.name || '')
              setMemberPosition(fresh.position || '')
              setMemberOrder(
                typeof fresh.display_order === 'number'
                  ? fresh.display_order
                  : 1
              )
              setMemberIsActive(
                fresh.is_active !== undefined ? fresh.is_active : true
              )
              setMemberPhotoUrl(fresh.photo_url || '')
              setMemberImagePreview(
                fresh.photo_url ? resolveImageUrl(fresh.photo_url) : ''
              )
            }
          })
          .catch((err) => {
            console.warn('Gagal fetch data anggota terbaru:', err)
          })
      }
    } else {
      setCurrentEditingMember(null)
    }

    return () => {
      isMounted = false
    }
  }, [editingMember])

  // Load awal: Ambil data konfigurasi judul & data anggota tersimpan (untuk urutan unik)
  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      // 1. Ambil setting judul
      setLoadingTitle(true)
      setTitleError('')
      try {
        const setting = await getAboutSettingApi()
        if (isMounted && setting) {
          setTeamTitle(setting.team_title || '')
          setIsActive(setting.is_active !== undefined ? setting.is_active : true)
        }
        // Jika setting === null, artinya belum ada konfigurasi di database.
        // Form dimulai kosong — admin bisa langsung mengisi dan menyimpan judul baru.
      } catch (err) {
        if (isMounted) {
          const status = err.response?.status
          if (status === 401) {
            setTitleError('Sesi login telah habis. Silakan login ulang untuk mengelola judul About.')
          } else if (status === 403) {
            setTitleError('Anda tidak memiliki izin untuk mengelola judul About.')
          } else {
            setTitleError(err.response?.data?.message || 'Gagal mengambil konfigurasi judul.')
          }
        }
      } finally {
        if (isMounted) setLoadingTitle(false)
      }

      // 2. Ambil data anggota tim untuk mendeteksi nomor urut yang sudah terpakai
      try {
        const members = await getTeamMembersApi()
        if (isMounted) {
          const list = Array.isArray(members) ? members : []
          setExistingMembers(list)
          if (!editingMember) {
            setMemberOrder(getNextAvailableOrder(list))
          }
        }
      } catch (err) {
        console.warn('Gagal mengambil daftar anggota tim:', err)
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  // Cleanup blob preview saat unmount
  useEffect(() => {
    return () => {
      if (memberImagePreview && memberImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(memberImagePreview)
      }
    }
  }, [memberImagePreview])

  // Guard Akses
  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert size={42} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold text-red-700">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-red-600">
            Hanya admin dan super_admin yang dapat mengakses fitur pengelolaan About.
          </p>
        </div>
      </div>
    )
  }

  // ─── Handler Bagian 1: Simpan Pengaturan Judul Tim Kami ─────────────────────
  const handleSaveTitle = async (e) => {
    e.preventDefault()
    setTitleError('')
    setTitleSuccess('')

    setSavingTitle(true)
    try {
      const trimmedTeam = teamTitle.trim()
      const payload = {
        team_title: trimmedTeam,
        is_active: isActive,
      }
      const updated = await saveAboutSettingApi(payload)
      if (updated) {
        setTeamTitle(updated.team_title !== undefined ? updated.team_title : trimmedTeam)
        setIsActive(updated.is_active !== undefined ? updated.is_active : true)
      } else {
        setTeamTitle(trimmedTeam)
      }
      setTitleSuccess('Pengaturan judul Tim Kami berhasil disimpan!')
      setTimeout(() => setTitleSuccess(''), 4000)
    } catch (err) {
      const status = err.response?.status
      const serverMsg = err.response?.data?.message
      if (status === 401) {
        setTitleError('Sesi login telah habis. Silakan login ulang.')
      } else if (status === 403) {
        setTitleError('Anda tidak memiliki izin untuk mengubah judul Tim Kami.')
      } else {
        setTitleError(serverMsg || 'Gagal menyimpan pengaturan judul.')
      }
    } finally {
      setSavingTitle(false)
    }
  }


  // ─── Handler Upload & Preview Foto Anggota ──────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMemberError('Format file tidak didukung. Gunakan file JPEG, PNG, atau WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMemberError('Ukuran file foto melebihi 5MB.')
      return
    }

    setMemberError('')
    if (memberImagePreview && memberImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(memberImagePreview)
    }

    setMemberImageFile(file)
    setMemberImagePreview(URL.createObjectURL(file))
    setMemberPhotoUrl('')
  }

  const handleRemoveImage = () => {
    if (memberImagePreview && memberImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(memberImagePreview)
    }
    setMemberImageFile(null)
    setMemberImagePreview('')
    setMemberPhotoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cek duplikasi nomor urut secara realtime dengan data anggota AKTIF di database (kecualikan anggota yang sedang diedit)
  const orderNumber = parseInt(memberOrder, 10)
  const duplicateOrderMember =
    !isNaN(orderNumber) &&
    existingMembers.find((m) => {
      // Hanya anggota berstatus Aktif yang memblokir nomor urut
      if (!m.is_active) {
        return false
      }
      if (currentEditingMember && m.id === currentEditingMember.id) {
        return false
      }
      return m.display_order === orderNumber
    })

  // Batalkan mode edit dan kembalikan form ke mode tambah
  const handleCancelEdit = () => {
    setCurrentEditingMember(null)
    setMemberName('')
    setMemberPosition('')
    setMemberIsActive(true)
    handleRemoveImage()
    setMemberError('')
    setMemberOrder(getNextAvailableOrder(existingMembers))
    onCancelEdit?.()
  }

  // ─── Handler Bagian 2: Simpan Satu Anggota Tim (Tambah / Edit) ──────────────
  const handleSaveMember = async (e) => {
    e.preventDefault()
    setMemberError('')
    setMemberSuccess('')

    // 1. Validasi Nama
    const trimmedName = memberName.trim()
    if (!trimmedName) {
      setMemberError('Nama anggota tim wajib diisi.')
      return
    }

    // 2. Validasi Urutan Tampil
    if (isNaN(orderNumber) || orderNumber < 0) {
      setMemberError('Urutan tampil harus berupa angka dan tidak boleh bernilai negatif.')
      return
    }

    if (duplicateOrderMember) {
      setMemberError(
        `Nomor urut tampil ${orderNumber} sudah digunakan oleh anggota aktif "${duplicateOrderMember.name || 'anggota lain'}". Silakan gunakan nomor urut lain.`
      )
      return
    }

    setSavingMember(true)
    let finalPhotoUrl = memberPhotoUrl

    // 3. Upload file foto jika dipilih file baru
    if (memberImageFile) {
      setUploadingMember(true)
      try {
        const uploadRes = await uploadImageApi(memberImageFile)
        let uploadedUrl = ''
        if (typeof uploadRes === 'string') {
          uploadedUrl = uploadRes.trim()
        } else if (uploadRes && typeof uploadRes === 'object') {
          uploadedUrl =
            uploadRes.url ||
            uploadRes.data?.url ||
            uploadRes.image_url ||
            uploadRes.file_url ||
            ''
        }

        if (!uploadedUrl) {
          throw new Error('Gagal mendapatkan URL foto dari server.')
        }

        finalPhotoUrl = uploadedUrl
      } catch (uploadErr) {
        setMemberError(
          uploadErr.response?.data?.message ||
            uploadErr.message ||
            'Gagal mengunggah foto anggota. Periksa ukuran dan format gambar.'
        )
        setSavingMember(false)
        setUploadingMember(false)
        return
      } finally {
        setUploadingMember(false)
      }
    }

    // 4. Kirim request penambahan atau update anggota tim
    try {
      const payload = {
        name: trimmedName,
        position: memberPosition.trim(),
        photo_url: finalPhotoUrl || '',
        display_order: orderNumber,
        is_active: memberIsActive,
      }

      if (currentEditingMember && currentEditingMember.id) {
        // Mode Edit: Update data yang ada
        await updateTeamMemberApi(currentEditingMember.id, payload)
        setMemberSuccess(
          `Perubahan data anggota tim "${trimmedName}" berhasil disimpan!`
        )
      } else {
        // Mode Tambah: Buat data baru
        await createTeamMemberApi(payload)
        setMemberSuccess(
          `Anggota tim "${trimmedName}" berhasil ditambahkan dengan status ${
            memberIsActive ? 'Aktif' : 'Tidak Aktif'
          }!`
        )
      }
      setTimeout(() => setMemberSuccess(''), 5000)

      // Kosongkan form agar siap untuk input anggota berikutnya
      setCurrentEditingMember(null)
      setMemberName('')
      setMemberPosition('')
      setMemberIsActive(true)
      handleRemoveImage()

      // Refresh data anggota tersimpan untuk alokasi nomor urut baru yang otomatis unik
      try {
        const updatedMembers = await getTeamMembersApi()
        const list = Array.isArray(updatedMembers) ? updatedMembers : []
        setExistingMembers(list)
        setMemberOrder(getNextAvailableOrder(list))
      } catch {
        setMemberOrder((prev) => (parseInt(prev, 10) || 1) + 1)
      }

      if (currentEditingMember) {
        onFinishEdit?.()
      }
    } catch (saveErr) {
      const errMsg =
        saveErr.response?.data?.message ||
        saveErr.message ||
        'Gagal menyimpan data anggota tim.'
      setMemberError(errMsg)
    } finally {
      setSavingMember(false)
    }
  }

  return (
    <div className="flex flex-col pb-12">
      {/* ── HEADER HALAMAN ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            About Us
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola judul utama dan tambahkan anggota tim untuk ditampilkan pada halaman Tentang Kami.
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

      {/* ── BAGIAN 1: PENGATURAN JUDUL ABOUT ──────────────────────────────── */}
      <section className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900">
            Pengaturan Judul
          </h2>
        </div>

        {titleSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{titleSuccess}</span>
          </div>
        )}

        {titleError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{titleError}</span>
          </div>
        )}

        <form onSubmit={handleSaveTitle} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Judul Section Tim Kami
            </label>
            <input
              type="text"
              value={teamTitle}
              onChange={(e) => setTeamTitle(e.target.value)}
              placeholder="Orang-orang di Balik Ekosistem Ini."
              disabled={loadingTitle}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-gray-50"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-400"
              />
              <span className="text-sm font-medium text-gray-700">
                Aktifkan konfigurasi judul ini di publik
              </span>
            </label>

            <button
              type="submit"
              disabled={savingTitle || loadingTitle}
              className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
            >
              {savingTitle ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Judul
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ── BAGIAN 2: FORM ANGGOTA TIM (TAMBAH / EDIT DI HALAMAN YANG SAMA) ── */}
      <section
        ref={memberSectionRef}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                {isEditing ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}
              </h2>
            </div>
            {/* <p className="mt-1 text-xs text-gray-500">
              {isEditing
                ? `Mengubah data untuk "${currentEditingMember?.name || 'anggota tim'}". Klik "Simpan Perubahan" untuk menyimpan atau "Batal" untuk membatalkan.`
                : 'Form input satu anggota tim di bawah ini langsung siap digunakan. Setelah data berhasil disimpan, form akan otomatis dikosongkan agar Anda dapat menginput anggota berikutnya.'}
            </p> */}
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 shadow-xs cursor-pointer"
            >
              <X size={14} />
              Batal Edit
            </button>
          )}
        </div>

        {memberSuccess && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{memberSuccess}</span>
          </div>
        )}

        {memberError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong>Gagal menyimpan: </strong>
              <span>{memberError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveMember}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Nama, Jabatan, dan Status Keaktifan (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Nama Anggota <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Contoh: Dr. Budi Santoso"
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
                  value={memberPosition}
                  onChange={(e) => setMemberPosition(e.target.value)}
                  placeholder="Contoh: Chief Executive Officer / Founder"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Status Anggota: Dropdown */}
              <div className="pt-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Status Anggota
                </label>
                <select
                  id="status-anggota"
                  value={memberIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setMemberIsActive(e.target.value === 'active')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 cursor-pointer"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  {memberIsActive
                    ? 'Aktif: anggota ditampilkan pada halaman Tentang Kami publik.'
                    : 'Tidak Aktif: anggota tetap tersimpan di database, tetapi tidak ditampilkan pada halaman publik.'}
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Foto dan Urutan Tampil (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Foto Anggota
                </label>
                {memberImagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={memberImagePreview}
                      alt="Preview Foto Anggota"
                      className="h-44 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute right-2.5 top-2.5 rounded-lg bg-white/90 p-1.5 text-red-500 shadow-md backdrop-blur-xs transition hover:bg-white hover:text-red-700"
                      title="Hapus foto"
                    >
                      <Trash2 size={16} />
                    </button>
                    {memberImageFile && (
                      <div className="border-t border-gray-100 bg-white px-3 py-1.5">
                        <p className="truncate text-[11px] font-medium text-gray-600">
                          {memberImageFile.name}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4 transition hover:border-sky-400 hover:bg-sky-50/40"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sky-500 shadow-xs">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">
                      Upload Foto Anggota
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      PNG, JPG, WEBP — Maks. 5MB
                    </p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
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
                  value={memberOrder}
                  onChange={(e) => setMemberOrder(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
                    duplicateOrderMember
                      ? 'border-red-300 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                  }`}
                  required
                />
                {duplicateOrderMember ? (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Nomor urut {memberOrder} sudah digunakan oleh anggota aktif{' '}
                    <span className="font-semibold">{duplicateOrderMember.name || 'anggota lain'}</span>.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Menentukan urutan kemunculan di halaman publik (nomor urut kecil tampil lebih awal).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── BAGIAN 3: TOMBOL SIMPAN & BATAL ─────────────────────────────── */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingMember || uploadingMember}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <X size={16} />
                <span>Batal</span>
              </button>
            )}

            <button
              type="submit"
              disabled={savingMember || uploadingMember}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-sky-500 hover:bg-sky-600'
              }`}
            >
              {savingMember || uploadingMember ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {isEditing ? 'Menyimpan Perubahan...' : 'Menyimpan Anggota...'}
                  </span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>
                    {isEditing ? 'Simpan Perubahan' : 'Simpan Anggota Tim'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
