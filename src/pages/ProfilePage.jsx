import React, { useState, useEffect, useRef } from 'react'
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  MapPin,
  ChevronRight,
  Shield,
  Edit3,
  X,
  Save,
  AlertCircle,
  Camera,
  UploadCloud,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { resolveImageUrl } from '../api/posts'
import {
  getMyProfileApi,
  updateMyProfileApi,
  getMyCompanyApi,
  upsertMyCompanyApi,
  uploadProfileImageApi,
} from '../api/profile'

export default function ProfilePage() {
  const { user: authUser, role: authRole, updateSessionUser } = useAuth()

  // State Fetching & Submitting
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [personalErrorMessage, setPersonalErrorMessage] = useState('')
  const [companyErrorMessage, setCompanyErrorMessage] = useState('')

  // State Profile User
  const [profileUser, setProfileUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // State Form User
  const [formFullName, setFormFullName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('')
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState('')
  const [newAvatarFile, setNewAvatarFile] = useState(null)
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef(null)

  // State Company (Khusus Guest)
  const [companyData, setCompanyData] = useState(null)
  const [formCompanyName, setFormCompanyName] = useState('')
  const [formCompanyEmail, setFormCompanyEmail] = useState('')
  const [formCompanyPhone, setFormCompanyPhone] = useState('')
  const [formCompanyAddress, setFormCompanyAddress] = useState('')
  const [formCompanyWebsite, setFormCompanyWebsite] = useState('')
  const [formCompanyDescription, setFormCompanyDescription] = useState('')
  const [currentLogoUrl, setCurrentLogoUrl] = useState('')
  const [previewLogoUrl, setPreviewLogoUrl] = useState('')
  const [newLogoFile, setNewLogoFile] = useState(null)
  const [isLogoRemoved, setIsLogoRemoved] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef(null)

  // Normalisasi Role
  const roleName =
    profileUser?.role ||
    (typeof authUser?.role === 'object' ? authUser?.role?.name : authUser?.role) ||
    authRole ||
    'guest'
  const isGuest = roleName === 'guest'

  // Badge role mapping
  const getRoleBadge = (r) => {
    switch (r) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          bg: 'bg-red-50 text-red-700 border-red-200/80',
        }
      case 'admin':
        return {
          label: 'Admin',
          bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
        }
      case 'operator':
        return {
          label: 'Operator',
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        }
      case 'guest':
      default:
        return {
          label: 'Guest',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
        }
    }
  }
  const roleBadge = getRoleBadge(roleName)

  // Inisial avatar user
  const effectiveFullName = isEditing ? formFullName : (profileUser?.full_name || authUser?.full_name || '')
  const userInitials = effectiveFullName
    ? effectiveFullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  // Inisial company logo
  const effectiveCompanyName = isEditing
    ? formCompanyName
    : (companyData?.company_name || profileUser?.company || authUser?.company || '')
  const companyInitials = effectiveCompanyName
    ? effectiveCompanyName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CO'

  // ── Fetch Profile & Company Data ─────────────────────────────────────
  const loadProfileData = async () => {
    setLoading(true)
    setPersonalErrorMessage('')
    setCompanyErrorMessage('')
    try {
      // 1. Ambil data profil user terbaru
      let userData = null
      try {
        userData = await getMyProfileApi()
        setProfileUser(userData)
        setFormFullName(userData.full_name || '')
        setFormPhone(userData.phone_number || '')
        setCurrentAvatarUrl(userData.avatar_url || '')
        setPreviewAvatarUrl(userData.avatar_url || '')
        setNewAvatarFile(null)
        setIsAvatarRemoved(false)

        // Sync ke auth session agar nama/avatar di Topbar konsisten
        updateSessionUser?.({
          id: userData.id,
          full_name: userData.full_name,
          email: userData.email,
          phone_number: userData.phone_number,
          avatar_url: userData.avatar_url,
          company: userData.company,
          role: userData.role,
        })
      } catch (userErr) {
        console.error('Failed to load user profile:', userErr)
        const uMsg = userErr.response?.data?.message || userErr.message || 'Failed to load personal profile.'
        setPersonalErrorMessage(`Personal Profile: ${uMsg}`)
      }

      // 2. Ambil data company jika user adalah guest
      const currentRole = (typeof userData?.role === 'object' ? userData?.role?.name : userData?.role) ||
        (typeof authUser?.role === 'object' ? authUser?.role?.name : authUser?.role) ||
        authRole
      if (currentRole === 'guest') {
        try {
          const compData = await getMyCompanyApi()
          if (compData) {
            setCompanyData(compData)
            setFormCompanyName(compData.company_name || '')
            setFormCompanyEmail(compData.email || '')
            setFormCompanyPhone(compData.phone_number || '')
            setFormCompanyAddress(compData.address || '')
            setFormCompanyWebsite(compData.website || '')
            setFormCompanyDescription(compData.description || '')
            setCurrentLogoUrl(compData.logo_url || '')
            setPreviewLogoUrl(compData.logo_url || '')
          } else {
            setCompanyData(null)
            setFormCompanyName(userData?.company || authUser?.company || '')
            setFormCompanyEmail('')
            setFormCompanyPhone('')
            setFormCompanyAddress('')
            setFormCompanyWebsite('')
            setFormCompanyDescription('')
            setCurrentLogoUrl('')
            setPreviewLogoUrl('')
          }
        } catch (compErr) {
          console.error('Failed to load company profile:', compErr)
          const compMsg = compErr.response?.data?.message || compErr.message || 'Failed to load company profile.'
          if (compErr.response?.status === 403) {
            setCompanyErrorMessage('Company Profile (403): Akses ditolak: hak akses tidak mencukupi. Pastikan token sesi memiliki role guest (coba logout dan login kembali).')
          } else {
            setCompanyErrorMessage(`Company Profile (${compErr.response?.status || 'Error'}): ${compMsg}`)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [])

  // ── Validasi File Gambar ──────────────────────────────────────────────
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type.toLowerCase())) {
      return 'Only JPEG, PNG, and WebP image formats are allowed.'
    }
    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      return 'File size exceeds maximum limit of 5 MB.'
    }
    return null
  }

  // ── Handle Photo File Selection ───────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')

    const errorMsg = validateFile(file)
    if (errorMsg) {
      setPhotoError(errorMsg)
      e.target.value = ''
      return
    }

    setNewAvatarFile(file)
    setIsAvatarRemoved(false)
    const objectUrl = URL.createObjectURL(file)
    setPreviewAvatarUrl(objectUrl)
  }

  const handleRemovePhoto = () => {
    setNewAvatarFile(null)
    setIsAvatarRemoved(true)
    setPreviewAvatarUrl('')
    setPhotoError('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  // ── Handle Logo File Selection ────────────────────────────────────────
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')

    const errorMsg = validateFile(file)
    if (errorMsg) {
      setLogoError(errorMsg)
      e.target.value = ''
      return
    }

    setNewLogoFile(file)
    setIsLogoRemoved(false)
    const objectUrl = URL.createObjectURL(file)
    setPreviewLogoUrl(objectUrl)
  }

  const handleRemoveLogo = () => {
    setNewLogoFile(null)
    setIsLogoRemoved(true)
    setPreviewLogoUrl('')
    setLogoError('')
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  // ── Handle Cancel Edit ────────────────────────────────────────────────
  const handleCancel = () => {
    // Reset form user ke data aktual
    setFormFullName(profileUser?.full_name || '')
    setFormPhone(profileUser?.phone_number || '')
    setPreviewAvatarUrl(currentAvatarUrl)
    setNewAvatarFile(null)
    setIsAvatarRemoved(false)
    setPhotoError('')

    // Reset form company ke data aktual
    if (companyData) {
      setFormCompanyName(companyData.company_name || '')
      setFormCompanyEmail(companyData.email || '')
      setFormCompanyPhone(companyData.phone_number || '')
      setFormCompanyAddress(companyData.address || '')
      setFormCompanyWebsite(companyData.website || '')
      setFormCompanyDescription(companyData.description || '')
      setPreviewLogoUrl(currentLogoUrl)
    } else {
      setFormCompanyName(profileUser?.company || '')
      setFormCompanyEmail('')
      setFormCompanyPhone('')
      setFormCompanyAddress('')
      setFormCompanyWebsite('')
      setFormCompanyDescription('')
      setPreviewLogoUrl('')
    }
    setNewLogoFile(null)
    setIsLogoRemoved(false)
    setLogoError('')

    setSuccessMessage('')
    setPersonalErrorMessage('')
    setCompanyErrorMessage('')
    setIsEditing(false)
  }

  // ── Handle Save Changes ───────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()

    // Validasi field wajib
    if (!formFullName.trim()) {
      setPersonalErrorMessage('Full name is required.')
      return
    }

    setSaving(true)
    setSuccessMessage('')
    setPersonalErrorMessage('')
    setCompanyErrorMessage('')

    try {
      // 1. Tangani Upload Avatar jika ada file baru, atau hapus jika dipilih remove
      let finalAvatarUrl = currentAvatarUrl
      if (isAvatarRemoved) {
        finalAvatarUrl = ''
      } else if (newAvatarFile) {
        try {
          finalAvatarUrl = await uploadProfileImageApi(newAvatarFile)
        } catch (uploadErr) {
          const upMsg = uploadErr.response?.data?.message || uploadErr.message || 'Failed to upload profile photo.'
          throw new Error(`Profile Photo Upload: ${upMsg}`)
        }
      }

      // 2. Simpan Personal Profile via PATCH /api/users/me
      let userUpdatedSuccess = false
      try {
        const updatedUser = await updateMyProfileApi({
          fullName: formFullName.trim(),
          phoneNumber: formPhone.trim(),
          avatarUrl: finalAvatarUrl,
        })
        setProfileUser(updatedUser)
        setCurrentAvatarUrl(updatedUser.avatar_url || '')
        setPreviewAvatarUrl(updatedUser.avatar_url || '')
        setNewAvatarFile(null)
        setIsAvatarRemoved(false)

        // Sync user ke auth context / local storage
        updateSessionUser?.({
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          phone_number: updatedUser.phone_number,
          avatar_url: updatedUser.avatar_url,
          company: updatedUser.company,
          role: updatedUser.role,
        })
        userUpdatedSuccess = true
      } catch (userErr) {
        const userMsg = userErr.response?.data?.message || userErr.message || 'Failed to update personal profile.'
        throw new Error(`Personal Profile (PATCH /api/users/me): ${userMsg}`)
      }

      // 3. Jika Role Guest, Tangani Company Profile (Logo Upload & PUT /api/companies/me)
      if (isGuest) {
        let finalLogoUrl = currentLogoUrl
        if (isLogoRemoved) {
          finalLogoUrl = ''
        } else if (newLogoFile) {
          try {
            finalLogoUrl = await uploadProfileImageApi(newLogoFile)
          } catch (logoErr) {
            const logoMsg = logoErr.response?.data?.message || logoErr.message || 'Failed to upload company logo.'
            throw new Error(`Personal profile was saved, but company logo upload failed: ${logoMsg}. You can try re-saving company information.`)
          }
        }

        try {
          const updatedCompany = await upsertMyCompanyApi({
            companyName: formCompanyName.trim(),
            logoUrl: finalLogoUrl,
            address: formCompanyAddress.trim(),
            email: formCompanyEmail.trim(),
            phoneNumber: formCompanyPhone.trim(),
            website: formCompanyWebsite.trim(),
            description: formCompanyDescription.trim(),
          })
          setCompanyData(updatedCompany)
          setCurrentLogoUrl(updatedCompany.logo_url || '')
          setPreviewLogoUrl(updatedCompany.logo_url || '')
          setNewLogoFile(null)
          setIsLogoRemoved(false)
        } catch (compErr) {
          const compMsg = compErr.response?.data?.message || compErr.message || 'Failed to save company profile.'
          throw new Error(`Personal profile was successfully saved, but company profile failed (PUT /api/companies/me): ${compMsg}. You can edit and re-save the company information.`)
        }
      }

      setSuccessMessage('Profile and organization details successfully updated.')
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save profile changes:', err)
      const msg = err.message || err.response?.data?.message || 'Failed to save changes. Please check your network and try again.'
      setPersonalErrorMessage(msg)
    } finally {
      setSaving(false)
    }
  }

  // Tampilan gambar avatar & logo efektif
  const effectiveAvatar = isEditing
    ? (isAvatarRemoved ? '' : previewAvatarUrl)
    : currentAvatarUrl
  const effectiveLogo = isEditing
    ? (isLogoRemoved ? '' : previewLogoUrl)
    : currentLogoUrl

  // ── Loading Skeleton State ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200 pb-16">
      {/* ── Breadcrumb & Top Action Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium">Profile</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Account Profile
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your personal identity, contact details, and organization profile.
          </p>
        </div>

        {/* Action Button: Edit Profile / Cancel */}
        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setSuccessMessage('')
              setPersonalErrorMessage('')
              setCompanyErrorMessage('')
              setIsEditing(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* ── Feedback Banner: Success ──────────────────────────────────────── */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-emerald-950 mb-0.5">Success</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* ── Feedback Banner: Personal Error ───────────────────────────────── */}
      {personalErrorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-red-950 mb-0.5">Personal Profile Error</span>
            <span>{personalErrorMessage}</span>
          </div>
        </div>
      )}

      {/* ── Feedback Banner: Company Error ────────────────────────────────── */}
      {companyErrorMessage && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold block text-amber-950 mb-0.5">Company Profile Error</span>
            <span>{companyErrorMessage}</span>
          </div>
        </div>
      )}

      {/* ── Main Unified Profile Container ───────────────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* ── 1. Profile Hero Header ─────────────────────────────────────── */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-sky-50/80 via-white to-slate-50/60 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Visual Avatar Focus */}
            <div className="relative shrink-0">
              {effectiveAvatar ? (
                <img
                  src={resolveImageUrl(effectiveAvatar)}
                  alt={effectiveFullName || 'Profile Photo'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white shadow-md ring-4 ring-sky-100"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-sky-500 to-[#0c4a6e] text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-md border-2 border-white ring-4 ring-sky-100">
                  {userInitials}
                </div>
              )}
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {effectiveFullName || 'Account User'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadge.bg}`}
                >
                  <Shield size={11} />
                  {roleBadge.label}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{profileUser?.email || authUser?.email || 'No email registered'}</span>
              </p>

              {isGuest && (companyData?.company_name || formCompanyName || profileUser?.company) && (
                <p className="text-xs text-sky-700 font-semibold flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                  <Building2 size={14} className="text-sky-500 shrink-0" />
                  <span>{companyData?.company_name || formCompanyName || profileUser?.company}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Unified Content Body (View / Edit Form) ────────────────── */}
        <form onSubmit={handleSave}>
          <div className="p-6 sm:p-8 space-y-10">
            {/* ── Two-Column Layout (Desktop) or Stacked (Mobile) ───────────── */}
            <div className={`grid grid-cols-1 ${isGuest ? 'lg:grid-cols-2' : ''} gap-8 lg:gap-10 items-start`}>
              
              {/* ── COLUMN 1: Personal Information ──────────────────────────── */}
              <section className="space-y-6">
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <User size={16} className="text-[#0284c7]" />
                    Personal Information
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your personal identity, profile avatar photo, and contact details.
                  </p>
                </div>

                {/* Photo Upload Area in Edit Mode */}
                {isEditing && (
                  <div className="p-4 sm:p-5 rounded-xl border border-gray-200/80 bg-slate-50/70 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {previewAvatarUrl ? (
                          <img
                            src={resolveImageUrl(previewAvatarUrl)}
                            alt="Photo Preview"
                            className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 to-[#0c4a6e] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                            {userInitials}
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-gray-800">
                            Profile Photo
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Supported: JPEG, PNG, WebP (Max 5 MB).
                          </p>
                        </div>
                      </div>

                      {/* Action buttons for photo */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <input
                          type="file"
                          ref={photoInputRef}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <UploadCloud size={14} className="text-sky-600" />
                          <span>{previewAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        </button>

                        {previewAvatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 transition cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {photoError && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 pt-1">
                        <AlertCircle size={13} />
                        {photoError}
                      </p>
                    )}
                  </div>
                )}

                {/* Grid Fields: Personal Information */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        disabled={saving}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs font-medium text-gray-800">
                        {profileUser?.full_name || authUser?.full_name || '-'}
                      </div>
                    )}
                  </div>

                  {/* Email Address (Read-only) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        Email Address
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Read-only
                      </span>
                    </div>
                    <input
                      type="email"
                      value={profileUser?.email || authUser?.email || ''}
                      disabled
                      readOnly
                      className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-200/60 rounded-xl text-xs text-gray-500 cursor-not-allowed select-all"
                    />
                    <p className="text-[10.5px] text-gray-400">
                      Email address is tied to your login identity and cannot be altered.
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="e.g. +62 812 3456 7890"
                        disabled={saving}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-gray-700">
                        {profileUser?.phone_number ? profileUser.phone_number : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Role (Read-only) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        Role & Permissions
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Read-only
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/70 border border-slate-200/60 rounded-xl text-xs text-gray-700 cursor-not-allowed">
                      <span className="font-semibold">{roleBadge.label}</span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {roleName}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-400">
                      Determined by administrative system governance.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── COLUMN 2: Company Information (GUEST ONLY) ─────────────── */}
              {isGuest && (
                <section className="space-y-6">
                  <div className="pb-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Building2 size={16} className="text-[#0284c7]" />
                      Company Information
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Official organizational profile for registered partner companies.
                    </p>
                  </div>

                  {/* Company Logo Display & Upload Area */}
                  <div className="p-4 sm:p-5 rounded-xl border border-gray-200/80 bg-slate-50/70 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {effectiveLogo ? (
                          <img
                            src={resolveImageUrl(effectiveLogo)}
                            alt="Company Logo Preview"
                            className="w-16 h-16 rounded-xl object-contain bg-white p-1.5 border border-gray-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 to-[#0c4a6e] text-white flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0">
                            {companyInitials}
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-gray-800">
                            Company Logo
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                            {effectiveCompanyName || 'Organization Brand Logo'}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            Supported: JPEG, PNG, WebP (Max 5 MB).
                          </span>
                        </div>
                      </div>

                      {/* Logo upload buttons when editing */}
                      {isEditing && (
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <input
                            type="file"
                            ref={logoInputRef}
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleLogoSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <UploadCloud size={14} className="text-sky-600" />
                            <span>{effectiveLogo ? 'Change Logo' : 'Upload Logo'}</span>
                          </button>

                          {effectiveLogo && (
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 transition cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {logoError && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 pt-1">
                        <AlertCircle size={13} />
                        {logoError}
                      </p>
                    )}
                  </div>

                  {/* Fields: Company Information */}
                  <div className="space-y-4">
                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Company Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formCompanyName}
                          onChange={(e) => setFormCompanyName(e.target.value)}
                          placeholder="e.g. PT Inovasi Talenta Digital"
                          disabled={saving}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs font-semibold text-gray-800">
                          {companyData?.company_name || profileUser?.company || authUser?.company || (
                            <span className="text-gray-400 font-normal italic">Not set</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Company Email & Phone (Grid 2 Kolom) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Company Email */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">
                          Company Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formCompanyEmail}
                            onChange={(e) => setFormCompanyEmail(e.target.value)}
                            placeholder="contact@company.com"
                            disabled={saving}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-gray-700 truncate">
                            {companyData?.email ? companyData.email : (
                              <span className="text-gray-400 italic">Not set</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Company Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">
                          Company Phone
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formCompanyPhone}
                            onChange={(e) => setFormCompanyPhone(e.target.value)}
                            placeholder="+62 21 555 1234"
                            disabled={saving}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-gray-700">
                            {companyData?.phone_number ? companyData.phone_number : (
                              <span className="text-gray-400 italic">Not set</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Company Website */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Company Website
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          value={formCompanyWebsite}
                          onChange={(e) => setFormCompanyWebsite(e.target.value)}
                          placeholder="https://www.company.com"
                          disabled={saving}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-gray-700">
                          {companyData?.website ? (
                            <a
                              href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <span className="truncate max-w-[280px]">{companyData.website}</span>
                              <Globe size={13} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Not set</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Company Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Company Address
                      </label>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={formCompanyAddress}
                          onChange={(e) => setFormCompanyAddress(e.target.value)}
                          placeholder="Enter the official business headquarters address..."
                          disabled={saving}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors resize-y"
                        />
                      ) : (
                        <div className="px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                          {companyData?.address ? companyData.address : (
                            <span className="text-gray-400 italic">Not set</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Company Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Company Description
                      </label>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={formCompanyDescription}
                          onChange={(e) => setFormCompanyDescription(e.target.value)}
                          placeholder="Brief overview of company business domain, products, and partnership focus..."
                          disabled={saving}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors resize-y"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                          {companyData?.description ? companyData.description : (
                            <span className="text-gray-400 italic">No description provided yet</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* ── Form Action Footer (Save & Cancel) ──────────────────────── */}
            {isEditing && (
              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
