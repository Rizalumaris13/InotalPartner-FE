import { useState, useRef, useEffect, useMemo } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicPageBanner from '../../components/PublicPageBanner'
import {
  ChevronRight, Calendar, MapPin, Clock, Users, ArrowRight,
  ChevronLeft, Video, Ticket, CalendarDays, Sparkles,
} from 'lucide-react'
import { events, eventTypeCounts, upcomingEvents, nextEvent } from '../../data/events'
import PublicFooter from '../../components/PublicFooter'

function useInView({ threshold = 0.1, fallbackMs = 700 } = {}) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { threshold },
    )
    io.observe(el)
    // kalau observer nggak kepicu, munculkan juga — lebih baik telat daripada nggak sama sekali
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

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
function formatDay(iso) {
  return DAYS[new Date(iso).getDay()]
}
function isoParts(iso) {
  const d = new Date(iso)
  return { day: d.getDate(), month: MONTHS[d.getMonth()], weekday: formatDay(iso) }
}

const STATUS_LABEL = { open: 'Pendaftaran dibuka', full: 'Kuota penuh', past: 'Sudah lewat' }

export default function EventPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [type, setType] = useState('Semua')
  const [showPast, setShowPast] = useState(false)
  const [page, setPage] = useState(1)
  const [registered, setRegistered] = useState(() => new Set())
  // filter yang sedang aktif, buat judul banner biar konteks nggak hilang

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // upcoming dulu (yang nearest), event lewat disisihkan — kecuali user minta lihat
  const pool = useMemo(() => {
    const base = showPast ? events : upcomingEvents
    return type === 'Semua' ? base : base.filter(e => e.type === type)
  }, [type, showPast])

  // Event yang tampil di banner: ikut filter yang aktif, jadi konteksnya selalu
  // nyambung dengan daftar di bawahnya.
  const bannerEvent = pool[0] ?? nextEvent

  // Halaman 1 punya slot ekstra untuk kartu featured, jadi jatahanya 5 baris.
  const FEATURED_SLOT = 1
  const perPage = 6
  const totalPages = Math.max(1, Math.ceil((pool.length - FEATURED_SLOT) / perPage))
  const currentPage = Math.min(page, totalPages)

  // Featured cuma di halaman 1; halaman lain mulai dari baris paling atas.
  const featured = currentPage === 1 ? pool[0] : null
  const start = (currentPage - 1) * perPage + (currentPage === 1 ? FEATURED_SLOT : 0)
  const rest = pool.slice(start, start + perPage)

  const pick = (next) => {
    setPage(1)
    setType(next)
    window.requestAnimationFrame(() => {
      const top = document.getElementById('daftar-event')?.offsetTop ?? 0
      window.scrollTo({ top: Math.max(0, top - 90), behavior: 'smooth' })
    })
  }

  const toggleRegister = (id) => {
    const ev = pool.concat(events).find(e => e.id === id)
    // event yang kuotanya habis atau sudah lewat nggak bisa didaftar
    if (ev && (ev.status === 'full' || ev.status === 'past')) return
    setRegistered(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const spotsLeft = (e) => e.quota - e.registered - (registered.has(e.id) ? 1 : 0)

  return (
    <div className="min-h-screen bg-white text-[#0c4a6e]" style={{ fontFamily: "'Mona Sans', system-ui, sans-serif" }}>

      <div className="h-[68px]">
        <PublicNavbar onNavigate={onNavigate} activePage="event" scrolled={scrolled} />
      </div>

      {/* ============ PAGE HEADER ============ */}
      <PublicPageBanner pageKey="event" breadcrumb="Event" onNavigate={onNavigate} />

      {/* ============ NEXT EVENT BANNER ============ */}
      {bannerEvent && (
        <section className="max-w-7xl mx-auto px-6 pt-14 md:pt-16">
          <Reveal>
            <div className="bg-[#0284c7] text-white rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
              {/* dekor lingkaran */}
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/10" />
              <div className="absolute -right-8 -bottom-24 w-56 h-56 rounded-full border border-white/10" />
              <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-8 items-center p-7 md:p-9">
                <div className="flex items-center gap-4">
                  {/* tanggal besar */}
                  <div className="text-center shrink-0">
                    <div className="bg-white text-[#0284c7] rounded-xl px-4 py-3 shadow-sm">
                      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-500">
                        {isoParts(bannerEvent.date).month}
                      </div>
                      <div className="text-3xl font-extrabold leading-none my-0.5">
                        {isoParts(bannerEvent.date).day}
                      </div>
                      <div className="text-[10px] font-semibold text-sky-600/70">
                        {isoParts(bannerEvent.date).weekday.slice(0, 3)}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200 bg-white/10 rounded-full px-3 py-1.5">
                      <Sparkles size={12} />
                      Event Berikutnya
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[19px] md:text-[22px] font-extrabold leading-[1.3] mb-2">
                    {bannerEvent.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} />
                      {bannerEvent.time}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {bannerEvent.online ? <Video size={14} /> : <MapPin size={14} />}
                      {bannerEvent.venue}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} />
                      {spotsLeft(bannerEvent)} kursi tersisa
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleRegister(bannerEvent.id)}
                  className={`shrink-0 inline-flex items-center justify-center gap-2 font-bold text-[13.5px] px-6 py-3.5 rounded-xl transition-all ${
                    registered.has(bannerEvent.id)
                      ? 'bg-white/15 text-white border border-white/30'
                      : 'bg-white text-[#0284c7] hover:shadow-lg hover:shadow-sky-900/20'
                  }`}
                >
                  {registered.has(bannerEvent.id) ? 'Terdaftar ✓' : 'Daftar Sekarang'}
                  {!registered.has(bannerEvent.id) && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ CONTENT: LIST KIRI + SIDEBAR KANAN ============ */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-12">
          <div id="daftar-event" className="scroll-mt-24 min-w-0">

            {/* filter tipe — horizontal pills ala tag-archive, plus toggle event lewat */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {eventTypeCounts.map(c => (
                <button
                  key={c.name}
                  onClick={() => pick(c.name)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    type === c.name
                      ? 'bg-[#0284c7] text-white'
                      : 'bg-[#F0F4F8] text-[#0c4a6e] hover:bg-[#0284c7]/10'
                  }`}
                >
                  {c.name}
                  <span className={`ml-1.5 text-[11px] ${type === c.name ? 'text-white/70' : 'text-gray-400'}`}>
                    {c.count}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowPast(v => !v)}
                className={`ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-semibold border transition-all ${
                  showPast
                    ? 'border-[#0284c7] text-[#0284c7] bg-[#0284c7]/5'
                    : 'border-gray-200 text-gray-500 hover:border-[#0284c7]/40'
                }`}
              >
                <CalendarDays size={13} />
                {showPast ? 'Menampilkan semua' : 'Lihat event lewat'}
              </button>
            </div>

            {pool.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-[#0c4a6e] font-bold text-lg mb-2">Belum ada event di kategori ini</p>
                <p className="text-[14px] text-[#364e52] mb-6">Coba lihat kategori lain atau cek lagi nanti.</p>
                <button
                  onClick={() => pick('Semua')}
                  className="text-[13.5px] font-bold text-[#0284c7] hover:text-[#0c4a6e] transition-colors"
                >
                  Lihat semua event
                </button>
              </div>
            ) : (
              <>
                {/* ---------- FEATURED (kartu pertama, layout split ala tag-archive) ---------- */}
                {currentPage === 1 && featured && (
                  <Reveal className="mb-8">
                    <article className="group bg-white border border-gray-200/80 rounded-2xl overflow-hidden hover:border-[#0284c7]/50 transition-colors">
                      <div className="grid md:grid-cols-2">
                        {/* teks kiri */}
                        <div className="p-7 md:p-9 flex flex-col justify-center order-2 md:order-1">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="bg-[#0284c7] text-white text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded">
                              {featured.type}
                            </span>
                            <span className={`text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded ${
                              featured.status === 'open' ? 'bg-emerald-50 text-emerald-700'
                              : featured.status === 'full' ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                            }`}>
                              {STATUS_LABEL[featured.status]}
                            </span>
                          </div>
                          <h2 className="text-[24px] md:text-[28px] font-extrabold leading-[1.25] mb-4 group-hover:text-[#0284c7] transition-colors">
                            {featured.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-gray-500 mb-4">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0c4a6e]">
                              <Calendar size={14} className="text-[#0284c7]" />
                              {formatDay(featured.date)}, {formatDate(featured.date)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={14} />
                              {featured.time}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-gray-500 mb-5">
                            <span className="inline-flex items-center gap-1.5">
                              {featured.online ? <Video size={14} /> : <MapPin size={14} />}
                              {featured.venue}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={14} />
                              {featured.registered}/{featured.quota} peserta
                            </span>
                          </div>
                          <p className="text-[14.5px] leading-relaxed text-[#364e52] mb-6 line-clamp-3">
                            {featured.excerpt}
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => toggleRegister(featured.id)}
                              disabled={featured.status === 'past'}
                              className={`inline-flex items-center gap-2 font-bold text-[13.5px] px-5 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                registered.has(featured.id)
                                  ? 'bg-[#F0F4F8] text-[#0c4a6e] border border-gray-200'
                                  : 'bg-[#0284c7] text-white hover:bg-[#0c4a6e]'
                              }`}
                            >
                              {featured.status === 'past' ? 'Event sudah lewat'
                                : registered.has(featured.id) ? 'Terdaftar ✓'
                                : featured.status === 'full' ? 'Kuota penuh' : 'Daftar Sekarang'}
                            </button>
                            <span className="text-[13px] font-bold text-[#0c4a6e]">
                              {featured.price}
                            </span>
                          </div>
                        </div>
                        {/* gambar kanan */}
                        <div className="relative order-1 md:order-2 min-h-[240px] md:min-h-0">
                          <img
                            src={featured.image}
                            alt={featured.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                )}

                {/* ---------- LIST (baris horizontal: gambar kanan ala Newspaper) ---------- */}
                {rest.length > 0 && (
                  <div className="divide-y divide-gray-200/80 border-t border-gray-200/80">
                    {rest.map((e, i) => (
                      <Reveal key={e.id} delay={(i % 3) * 70}>
                        <article className="group py-7 flex flex-col sm:flex-row gap-5 sm:gap-7">
                          {/* teks */}
                          <div className="flex-1 min-w-0 sm:order-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="bg-[#0284c7] text-white text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded">
                                {e.type}
                              </span>
                              {e.status === 'past' && (
                                <span className="bg-gray-100 text-gray-500 text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded">
                                  Selesai
                                </span>
                              )}
                              {e.status === 'full' && !showPast && (
                                <span className="bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded">
                                  Kuota penuh
                                </span>
                              )}
                            </div>
                            <h3 className="text-[19px] md:text-[21px] font-extrabold leading-[1.3] mb-2.5 group-hover:text-[#0284c7] transition-colors line-clamp-2">
                              {e.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-gray-500 mb-3">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0c4a6e]">
                                <Calendar size={13} className="text-[#0284c7]" />
                                {formatDate(e.date)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Clock size={13} />
                                {e.time}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                {e.online ? <Video size={13} /> : <MapPin size={13} />}
                                {e.venue}
                              </span>
                            </div>
                            <p className="text-[13.5px] leading-relaxed text-[#364e52] line-clamp-2 mb-3">
                              {e.excerpt}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {e.topics.map(t => (
                                <span key={t} className="bg-[#F0F4F8] text-[11px] font-semibold text-[#0c4a6e] px-2.5 py-1 rounded-md">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                              <button
                                onClick={() => toggleRegister(e.id)}
                                disabled={e.status === 'past' || e.status === 'full'}
                                className={`inline-flex items-center gap-2 font-bold text-[12.5px] px-4 py-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                  registered.has(e.id)
                                    ? 'bg-[#F0F4F8] text-[#0c4a6e] border border-gray-200'
                                    : 'bg-[#0284c7] text-white hover:bg-[#0c4a6e]'
                                }`}
                              >
                                {e.status === 'past' ? 'Sudah lewat'
                                  : registered.has(e.id) ? 'Terdaftar ✓'
                                  : e.status === 'full' ? 'Kuota penuh'
                                  : 'Daftar'}
                              </button>
                              {e.status !== 'past' && (
                                <span className="text-[12.5px] font-bold text-[#0c4a6e]">{e.price}</span>
                              )}
                            </div>
                          </div>
                          {/* gambar kanan */}
                          <div className="relative sm:order-2 w-full sm:w-[260px] shrink-0 rounded-xl overflow-hidden self-start">
                            <img
                              src={e.image}
                              alt={e.title}
                              className="w-full h-[180px] sm:h-[165px] object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            {e.status !== 'past' && (
                              <span className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur rounded-md px-2 py-1 text-[11px] font-bold text-[#0c4a6e]">
                                {spotsLeft(e)} kursi
                              </span>
                            )}
                          </div>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                )}

                {/* ---------- PAGINATION ---------- */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#0c4a6e] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0284c7]/50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-10 h-10 rounded-lg border text-[14px] font-bold transition-all ${
                          n === currentPage
                            ? 'bg-[#0284c7] border-[#0284c7] text-white'
                            : 'border-gray-200 text-[#0c4a6e] hover:border-[#0284c7]/50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#0c4a6e] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0284c7]/50 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                    <span className="ml-3 text-[12.5px] text-gray-400">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---------- SIDEBAR KANAN ---------- */}
          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">

            {/* Mendatang */}
            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">
                <CalendarDays size={16} className="text-sky-400" />
                <h3 className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  Event Mendatang
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingEvents.slice(0, 5).map(e => {
                  const p = isoParts(e.date)
                  return (
                    <button
                      key={e.id}
                      onClick={() => { setShowPast(false); pick(e.type) }}
                      className="w-full text-left px-5 py-4 hover:bg-[#F0F4F8] transition-colors flex gap-3.5 items-start"
                    >
                      <div className="shrink-0 w-12 text-center bg-[#F0F4F8] rounded-lg py-1.5 group-hover:bg-[#0284c7]/10">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                          {p.month.slice(0, 3)}
                        </div>
                        <div className="text-lg font-extrabold leading-none text-[#0c4a6e]">
                          {p.day}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0284c7]">
                          {e.type}
                        </span>
                        <h4 className="text-[13px] font-bold leading-[1.4] text-[#0c4a6e] line-clamp-2 mt-0.5">
                          {e.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5">
                          {e.online ? <Video size={11} /> : <MapPin size={11} />}
                          <span className="truncate">{e.venue}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Kuota terisi */}
            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">
                <Users size={16} className="text-sky-400" />
                <h3 className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  Yang Makin Penuh
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {upcomingEvents
                  .slice()
                  .sort((a, b) => (b.registered / b.quota) - (a.registered / a.quota))
                  .slice(0, 4)
                  .map(e => {
                    const pct = Math.round((e.registered / e.quota) * 100)
                    return (
                      <div key={e.id} className="block w-full text-left group">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-[12.5px] font-bold text-[#0c4a6e] line-clamp-1 group-hover:text-[#0284c7] transition-colors">
                            {e.title}
                          </span>
                          <span className="text-[11px] font-bold text-sky-600 shrink-0 tabular-nums">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#F0F4F8] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              pct >= 100 ? 'bg-sky-300' : pct >= 80 ? 'bg-sky-500' : 'bg-sky-400'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5">
                          {e.registered}/{e.quota} peserta
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* CTA sidebar */}
            <div className="bg-[#0284c7] text-white rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              <div className="relative p-6">
                <Ticket size={22} className="mb-3 text-sky-200" />
                <h3 className="font-extrabold text-lg mb-2">Mau Held di Tempat Lo?</h3>
                <p className="text-[13px] text-white/80 leading-relaxed mb-5">
                  Kami buka slot workshop dan meetup untuk komunitas yang punya agenda sendiri.
                </p>
                <button
                  onClick={() => onNavigate?.('partnership')}
                  className="inline-flex items-center gap-2 bg-white text-[#0284c7] font-bold text-[13px] px-4 py-2.5 rounded-lg transition-transform hover:translateY(-1px)"
                >
                  Ajukan Kolaborasi
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <PublicFooter onNavigate={onNavigate} />

    </div>
  )
}
