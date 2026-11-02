import api from './axios'

// Kirim pesan dari form Hubungi Kami (publik, tanpa token)
// POST /api/contacts
// Payload: { name, email, phone, subject, message }
// Returns: contact yang tersimpan
export const submitContactApi = async ({ name, email, phone, subject, message }) => {
  const res = await api.post('/contacts', {
    name,
    email,
    phone,
    subject,
    message,
  })
  return res.data
}

// ── Dashboard: kotak masuk pesan (butuh login) ────────────────────────
// Kontrak BE:
//   GET    /api/contacts?page=&limit=  → { data: Contact[] }  (urut created_at DESC — pesan baru di atas)
//   PATCH  /api/contacts/:id/read      → body { is_read: true|false }
//   DELETE /api/contacts/:id
// Bentuk Contact: { id, name, email, phone, subject, message, status: 'unread'|'read', created_at }

export const listContactsApi = ({ page = 1, limit = 100 } = {}) =>
  api.get('/contacts', { params: { page, limit } }).then((res) => res.data.data)

export const markContactReadApi = (id, isRead = true) =>
  api.patch(`/contacts/${id}/read`, { is_read: isRead }).then((res) => res.data.data)

export const deleteContactApi = (id) =>
  api.delete(`/contacts/${id}`).then((res) => res.data.data)
