import { useState, useRef, useEffect } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicPageBanner from '../../components/PublicPageBanner'
import { submitContactApi } from '../../api/contacts'
import {
  MapPin, Phone, Mail,
  Send, CheckCircle2, AlertCircle, Loader2, MessageSquare,
} from 'lucide-react'
import PublicFooter from '../../components/PublicFooter'

// Data kontak — samakan dengan footer halaman lain.
// Ganti dengan data resmi INOTAL kalau sudah ada.
const contactInfo = [
  {
    icon: MapPin,
    title: 'Address',
    lines: ['Bandung, West Java', 'Indonesia'],
  },
  {
    icon: Phone,
    title: 'Phone',
    lines: ['(022) 1234 5678', 'Monday – Friday, 08:30 – 17:00 WIB'],
  },
  {
    icon: Mail,
    title: 'Email',
    lines: ['halo@inotalpartner.id', 'Responded within 1×24 business hours'],
  },
]

// Pilihan topik pesan (menggantikan "department" di referensi Sandbox)
const topics = [
  'Partnership & Collaboration',
  'Programs & Initiatives',
  'Events & Community',
  'Media & Press',
  'General Inquiry',
]

// Peta Bandung (OpenStreetMap, tanpa API key)
const MAP_EMBED_URL =
  'https://www.openstreetmap.org/export/embed.html' +
  '?bbox=107.5691%2C-6.9575%2C107.6691%2C-6.8775' +
  '&layer=mapnik&marker=-6.9175%2C107.6191'

// Angka sementara — ganti dengan data resmi INOTAL kalau sudah ada
const stats = [
  { value: '120+', label: 'Registered Partners' },
  { value: '24', label: 'Collaborative Programs' },
  { value: '15+', label: 'Cities in Indonesia' },
]

const initialForm = { firstName: '', lastName: '', email: '', topic: '', message: '' }

// Validasi sisi klien — nama digabung (first + last) jadi satu field "name"
// buat kontrak API, aturan panjang mengikuti SubmitContactRequest di BE.
function validate(form) {
  const errors = {}
  if (form.firstName.trim().length < 2) errors.firstName = 'First name must be at least 2 characters'
  if (form.lastName.trim().length < 2) errors.lastName = 'Last name must be at least 2 characters'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Invalid email address'
  if (!form.topic) errors.topic = 'Please select a topic'
  if (form.message.trim().length < 10) errors.message = 'Message must be at least 10 characters'
  return errors
}

// satu tempat buat "element ini udah keliatan di layar" — Reveal butuh
// observer + jaring pengaman kalau observer-nya nggak kepicu
function useInView({ threshold = 0.1, fallbackMs = 700 } = {}) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { threshold }
    )
    io.observe(el)
    const t = setTimeout(() => setSeen(true), fallbackMs)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [threshold, fallbackMs])

  return [ref, seen]
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, seen] = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${seen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] text-[#0c4a6e] placeholder:text-gray-400 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function KontakPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    // hapus error field ini begitu user ngetik ulang
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setStatus('submitting')
    setServerError('')
    try {
      // Kontrak API: name = gabungan first + last, subject = topik pesan
      await submitContactApi({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email,
        phone: '',
        subject: form.topic,
        message: form.message,
      })
      setStatus('success')
      setForm(initialForm)
    } catch (err) {
      setStatus('error')
      const msg = err.response?.data?.message
      setServerError(msg || 'Failed to send message. Please try again shortly.')
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#0c4a6e]" style={{ fontFamily: "'Mona Sans', system-ui, sans-serif" }}>

      <div className="h-[68px]">
        <PublicNavbar onNavigate={onNavigate} activePage="kontak" scrolled={scrolled} />
      </div>

      {/* Page header */}
      <PublicPageBanner pageKey="kontak" breadcrumb="Contact Us" onNavigate={onNavigate} />

      {/* Kartu: peta (kiri) + info kontak (kanan) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mt-6">
        <div className="rounded-2xl overflow-hidden shadow-xl shadow-[#0c4a6e]/10 border border-sky-100 bg-white grid md:grid-cols-2">
          <div className="min-h-[280px] md:min-h-[440px]">
            <iframe
              title="INOTAL Partner location map — Bandung"
              src={MAP_EMBED_URL}
              className="w-full h-full block"
              loading="lazy"
            />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center gap-8">
            {contactInfo.map(({ icon: Icon, title, lines }) => (
              <div key={title} className="flex items-start gap-5">
                <span className="inline-flex w-11 h-11 rounded-xl bg-sky-50 text-sky-500 items-center justify-center shrink-0">
                  <Icon size={21} />
                </span>
                <div>
                  <h3 className="font-bold text-[15.5px] mb-1">{title}</h3>
                  {lines.map((line) => (
                    <p key={line} className="text-[14px] text-gray-500 leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form — "Drop Us a Line" versi INOTAL */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-[42px] font-extrabold tracking-tight text-center mb-3">
              Drop Us a Line
            </h2>
            <p className="text-[15px] text-gray-500 text-center mb-12">
              Fill out the form below and our team will get in touch with you shortly.
            </p>
          </Reveal>

          <Reveal delay={120}>
            {status === 'success' ? (
              <div className="rounded-2xl border border-green-100 bg-green-50/50 p-10 md:p-14 text-center">
                <span className="inline-flex w-16 h-16 rounded-full bg-green-50 text-green-500 items-center justify-center mb-5">
                  <CheckCircle2 size={32} />
                </span>
                <h3 className="text-2xl font-extrabold mb-2">Message sent!</h3>
                <p className="text-[14.5px] text-gray-500 leading-relaxed max-w-sm mx-auto mb-7">
                  Thank you for reaching out. The INOTAL Partner team
                  will respond within 1×24 business hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-6 py-3 transition-colors"
                >
                  <MessageSquare size={16} />
                  Send another message
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-sky-100 bg-[#F8FAFC] p-8 md:p-10 shadow-sm">
                {status === 'error' && (
                  <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3.5 mb-6 text-[13.5px] text-red-600">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{serverError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="firstName" className="block text-[13px] font-semibold mb-1.5">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={form.firstName}
                        onChange={update('firstName')}
                        placeholder="Your first name"
                        className={`${inputClass} ${errors.firstName ? 'border-red-300' : 'border-sky-100'}`}
                      />
                      {errors.firstName && <p className="text-[12.5px] text-red-500 mt-1.5">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-[13px] font-semibold mb-1.5">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={form.lastName}
                        onChange={update('lastName')}
                        placeholder="Your last name"
                        className={`${inputClass} ${errors.lastName ? 'border-red-300' : 'border-sky-100'}`}
                      />
                      {errors.lastName && <p className="text-[12.5px] text-red-500 mt-1.5">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="email" className="block text-[13px] font-semibold mb-1.5">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        placeholder="name@email.com"
                        className={`${inputClass} ${errors.email ? 'border-red-300' : 'border-sky-100'}`}
                      />
                      {errors.email && <p className="text-[12.5px] text-red-500 mt-1.5">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="topic" className="block text-[13px] font-semibold mb-1.5">
                        Topic <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="topic"
                        value={form.topic}
                        onChange={update('topic')}
                        className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px] bg-[right_0.9rem_center] bg-no-repeat pr-10 ${errors.topic ? 'border-red-300' : 'border-sky-100'}`}
                      >
                        <option value="">Select a topic</option>
                        {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.topic && <p className="text-[12.5px] text-red-500 mt-1.5">{errors.topic}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-[13px] font-semibold mb-1.5">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={update('message')}
                      placeholder="Tell us about your needs or questions..."
                      className={`${inputClass} resize-y ${errors.message ? 'border-red-300' : 'border-sky-100'}`}
                    />
                    {errors.message && <p className="text-[12.5px] text-red-500 mt-1.5">{errors.message}</p>}
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="inline-flex items-center justify-center gap-2.5 rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white text-[15px] font-semibold px-9 py-3.5 transition-colors"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                    <p className="text-[12.5px] text-gray-400 mt-4">
                      <span className="text-red-400">*</span> required fields. Your information will only be used to respond to this inquiry.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-sky-100 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-10">
            Trusted by 120+ partners.{' '}
            <span className="text-[#0284c7]">Join us and accelerate your growth.</span>
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0284c7] tabular-nums mb-1.5">{value}</p>
                <p className="text-[13px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <PublicFooter onNavigate={onNavigate} />

    </div>
  )
}
