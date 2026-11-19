import api from './axios'

// ── User Self-Service Profile ──────────────────────────────────────────

// GET /api/users/me
// Returns current logged-in user profile with full details from database
export const getMyProfileApi = async () => {
  const res = await api.get('/users/me')
  return res.data.data
}

// PATCH /api/users/me
// Updates full_name, phone_number, avatar_url
export const updateMyProfileApi = async ({ fullName, phoneNumber, avatarUrl }) => {
  const res = await api.patch('/users/me', {
    full_name: fullName,
    phone_number: phoneNumber,
    avatar_url: avatarUrl,
  })
  return res.data.data
}

// ── Company Profile (Guest Only) ───────────────────────────────────────

// GET /api/companies/me
// Returns company profile belonging to logged-in guest (or null if not created yet)
export const getMyCompanyApi = async () => {
  const res = await api.get('/companies/me')
  return res.data.data
}

// PUT /api/companies/me
// Creates or updates company profile for the logged-in guest
export const upsertMyCompanyApi = async ({
  companyName,
  logoUrl,
  address,
  email,
  phoneNumber,
  website,
  description,
}) => {
  const res = await api.put('/companies/me', {
    company_name: companyName,
    logo_url: logoUrl,
    address,
    email,
    phone_number: phoneNumber,
    website,
    description,
  })
  return res.data.data
}

// ── Upload Image ───────────────────────────────────────────────────────

// POST /api/uploads/image
// Form field: "image", max 5 MB, JPEG/PNG/WebP
// Returns the uploaded image URL (e.g. "/uploads/xxxx.ext")
export const uploadProfileImageApi = async (file) => {
  const formData = new FormData()
  formData.append('image', file)

  const res = await api.post('/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000,
  })

  return res.data.url || res.data.data?.url || ''
}

