import { useState, useRef, useEffect } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicPageBanner from '../../components/PublicPageBanner'
import PublicAboutCards from '../../components/PublicAboutCards'
import AboutIntroSection from '../../components/AboutIntroSection'
import useAboutIntro from '../../hooks/useAboutIntro'
import {
  ChevronRight, Home, Lightbulb, Award, Headset, ArrowRight,
  Phone, Mail, MapPin, Plus, User,
} from 'lucide-react'
import PublicFooter from '../../components/PublicFooter'
import { getPublicAboutSettingApi, getPublicTeamMembersApi, getPublicAboutFAQsApi, getPublicAboutVideosApi, getPublicAboutVideoSettingApi, getPublicAboutVideoHighlightsApi, resolveImageUrl } from '../../api/about'
import { DynamicHighlightIcon } from '../../components/HighlightIconHelper'


const team = [
  { name: 'Andini Prameswari', role: 'Chief Executive', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80' },
  { name: 'Bagas Nugraha', role: 'Operations Head', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80' },
  { name: 'Citra Maharani', role: 'Partnership Lead', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80' },
  { name: 'Dimas Saputra', role: 'Tech Director', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80' },
]


// satu tempat buat "element ini udah keliatan di layar" — Reveal, kartu stat,
// sama progress bar semuanya butuh hal yang sama: observer + jaring pengaman
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
    // kalau observer-nya nggak kepicu, nomornya bisa nyangkut di 0 — muncul
    // agak telat jauh lebih enak daripada gitu
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

function SubTitle({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold tracking-[0.14em] uppercase text-[#0c4a6e] border border-dashed border-gray-300 rounded-md px-5 py-2.5 mb-6 bg-white">
      {children}
    </span>
  )
}

function PillButton({ children, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-3 rounded-full pl-7 pr-1.5 py-1.5 text-[15px] font-semibold transition-all ${
        dark
          ? 'bg-[#0c4a6e] text-white hover:bg-[#0284c7]'
          : 'bg-[#0284c7] text-white hover:bg-[#0c4a6e]'
      }`}
    >
      <span>{children}</span>
      <span className="w-9 h-9 rounded-full bg-white text-sky-600 flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-45deg]">
        <ArrowRight size={16} strokeWidth={2.5} />
      </span>
    </button>
  )
}

// Iframe YouTube cuma dimount setelah diklik, jadi halaman ini nggak
// request ke YouTube cuma karena orang kebetulan scroll lewat.


const videoHighlights = [
  {
    icon: 'film',
    title: 'Rekaman sesi & acara',
    desc: 'Rangkuman diskusi komunitas, demo program, dan berbagi expertise dari mitra yang programnya sudah berjalan.',
  },
  {
    icon: 'quote',
    title: 'Suara dari mitra',
    desc: 'Pendapat langsung soal apa yang berubah setelah bergabung — dari proses kerja sampai hasil yang dirasa.',
  },
]

const SVG_BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICON_PATHS = {
  film: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9h18M8 4.5v3M16 4.5v3" />
      <path d="M10.2 13.1v3.6l3-1.8-3-1.8Z" fill="currentColor" stroke="none" />
    </>
  ),
  quote: (
    <path
      d="M9.7 5.1C6.5 6.5 4.5 9.3 4.5 13v5.9h6.1V11H7.5c0-2.2 1-3.8 3.1-4.7l-.9-1.2Zm9.4 0c-3.2 1.4-5.2 4.2-5.2 7.9v5.9H20V11h-3.1c0-2.2 1-3.8 3.1-4.7l-.9-1.2Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  layers: (
    <>
      <path d="M12 3.4 21 8l-9 4.6L3 8l9-4.6Z" />
      <path d="M3 12.3 12 17l9-4.7M3 16.4 12 21l9-4.6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.4" r="3.4" />
      <path d="M2.8 19.4c.5-3.3 3.1-5.3 6.2-5.3s5.7 2 6.2 5.3" />
      <path d="M16.2 5.6a3.1 3.1 0 0 1 0 5.7M18 14.4c2 .7 3.3 2.4 3.6 4.6" />
    </>
  ),
  award: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4.2v1.8A3.3 3.3 0 0 0 7 10.5M17 5.5h2.8v1.8a3.3 3.3 0 0 1-2.8 3.2" />
      <path d="M12 14v3.4M8.6 20.6h6.8" />
    </>
  ),
  // dua rantai. shape handshake yang detail jarinya berubah jadi gumpalan
  // waktu diperkecil ke 23px, yang ini tetap kebaca
  link: (
    <>
      <path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1.7 1.7" />
      <path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1.7-1.7" />
    </>
  ),
}

function SvgIcon({ shape, className = '' }) {
  return (
    <svg {...SVG_BASE} className={className} aria-hidden="true">
      {ICON_PATHS[shape]}
    </svg>
  )
}


function extractYouTubeId(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.toLowerCase()
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const parts = parsed.pathname.replace(/^\/+/, '').split('/')
      return parts[0] || ''
    }
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) {
        return parsed.searchParams.get('v') || ''
      }
      if (
        parsed.pathname.startsWith('/embed/') ||
        parsed.pathname.startsWith('/shorts/') ||
        parsed.pathname.startsWith('/live/')
      ) {
        const parts = parsed.pathname.split('/')
        return parts[2] || ''
      }
    }
  } catch {
    // Abaikan jika parsing gagal
  }
  return ''
}

function VideoProfile({ video, loading }) {
  const [playing, setPlaying] = useState(false)

  if (loading) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-[#0c4a6e]/90 aspect-[16/10] w-full flex items-center justify-center">
        <div className="text-center text-white/80 space-y-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium tracking-wide">Memuat video profil...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-[#0c4a6e] aspect-[16/10] w-full flex items-center justify-center p-8 border border-white/10">
        <div className="text-center text-white/70 max-w-sm space-y-2">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-sky-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">Video Profil Belum Tersedia</p>
          <p className="text-xs text-white/60">
            Video profil resmi sedang dalam proses pembaruan oleh tim kami.
          </p>
        </div>
      </div>
    )
  }

  const ytId = extractYouTubeId(video.video_url)
  const poster =
    (video.thumbnail_url && video.thumbnail_url.trim())
      ? (video.thumbnail_url.startsWith('http') ? video.thumbnail_url : resolveImageUrl(video.thumbnail_url))
      : (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '')

  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden bg-[#0c4a6e]">
        <div className="relative aspect-[16/10] w-full">
          {playing && ytId ? (
            <iframe
              className="absolute inset-0 h-full w-full border-0"
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
              title={video.title || 'Video Profil'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {poster ? (
                <img
                  src={poster}
                  alt={video.title || 'Video Profil'}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0c4a6e]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e]/90 via-[#0c4a6e]/25 to-[#0c4a6e]/50" />
              
              {ytId ? (
                <button
                  onClick={() => setPlaying(true)}
                  aria-label={`Putar video: ${video.title || 'Video Profil'}`}
                  className="group absolute inset-0 flex items-center justify-center cursor-pointer"
                >
                  <span className="absolute w-[104px] h-[104px] rounded-full border border-white/25 transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute w-[78px] h-[78px] rounded-full bg-white/10 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110" />
                  <span className="relative grid place-items-center w-[64px] h-[64px] rounded-full bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.06]">
                    <svg width="18" height="22" viewBox="0 0 18 22" fill="#0c4a6e" aria-hidden="true">
                      <path d="M17 10.05 1.7 20.9A1 1 0 0 1 0 20V2a1 1 0 0 1 1.7-.9L17 11.95a1 1 0 0 1 0 1.7Z" />
                    </svg>
                  </span>
                </button>
              ) : (
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group absolute inset-0 flex items-center justify-center cursor-pointer"
                >
                  <span className="relative grid place-items-center w-[64px] h-[64px] rounded-full bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.06]">
                    <svg width="18" height="22" viewBox="0 0 18 22" fill="#0c4a6e" aria-hidden="true">
                      <path d="M17 10.05 1.7 20.9A1 1 0 0 1 0 20V2a1 1 0 0 1 1.7-.9L17 11.95a1 1 0 0 1 0 1.7Z" />
                    </svg>
                  </span>
                </a>
              )}

              <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
                <div className="min-w-0">
                  <p className="text-white font-bold text-[15px] md:text-[17px] leading-snug truncate">
                    {video.title}
                  </p>
                  <p className="text-white/70 text-[12.5px] mt-1 line-clamp-1">
                    {video.description || 'Profil resmi INOTAL Partner'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const impactStats = [
  { icon: 'layers', value: 25.5, decimals: 1, suffix: 'K', label: 'Kolaborasi Dituntaskan', note: 'Proyek bersama mitra yang sampai tahap serah terima' },
  { icon: 'users', value: 11.5, decimals: 1, suffix: 'K', label: 'Kepuasan Mitra', note: 'Dinilai tiap kuartal bersama mitra, bukan angka tebakan' },
  { icon: 'award', value: 1.5, decimals: 1, suffix: 'K', label: 'Penghargaan', note: 'Pengakuan industri dan komunitas teknologi' },
  { icon: 'link', value: 4.5, decimals: 1, suffix: 'K', label: 'Mitra Strategis', note: 'Perusahaan, komunitas kampus, dan talenta digital' },
]

function useCountUp(target, decimals, active) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      // bukan setState langsung di effect, nanti cascading render
      const raf = requestAnimationFrame(() => setVal(target))
      return () => cancelAnimationFrame(raf)
    }
    let raf = 0
    const dur = 1100
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) // melambat di akhir
      setVal(Number((target * eased).toFixed(decimals)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, decimals])
  return val
}

function StatCard({ icon, value, decimals, suffix, label, note, index }) {
  const [ref, active] = useInView({ threshold: 0.35, fallbackMs: 1600 })
  const shown = useCountUp(value, decimals, active)

  return (
    <div
      ref={ref}
      className="group relative h-full bg-white border border-gray-200/80 rounded-xl px-7 py-8 overflow-hidden hover:border-[#0284c7]/50 transition-colors duration-300"
    >
      <span className="absolute left-0 top-0 h-full w-1 bg-sky-500 origin-top scale-y-0 transition-transform duration-500 group-hover:scale-y-100" />
      <div className="flex items-start justify-between gap-4 mb-6">
        <span className="inline-flex w-12 h-12 rounded-lg bg-[#F0F4F8] text-[#0284c7] items-center justify-center transition-colors duration-500 group-hover:bg-[#0284c7] group-hover:text-white">
          <SvgIcon shape={icon} className="w-[23px] h-[23px]" />
        </span>
        <span className="text-[11px] font-bold tracking-[0.14em] text-gray-300 select-none">
          {`0${index + 1}`}
        </span>
      </div>
      <p className="text-[34px] leading-none font-extrabold tracking-tight tabular-nums mb-2">
        {shown.toFixed(decimals)}
        <span className="text-[#0284c7]">{suffix}</span>
      </p>
      <p className="font-bold text-[14.5px] mb-2">{label}</p>
      <p className="text-[12.5px] leading-relaxed text-[#364e52]">{note}</p>
    </div>
  )
}

function renderTeamHeading(title) {
  const clean = (title || '').trim() || 'Orang-orang di Balik Ekosistem Ini.'
  const words = clean.split(/\s+/)
  if (words.length <= 2) {
    return <span className="text-[#0284c7]">{clean}</span>
  }
  const mainPart = words.slice(0, -2).join(' ')
  const accentPart = words.slice(-2).join(' ')
  return (
    <>
      {mainPart} <span className="text-[#0284c7]">{accentPart}</span>
    </>
  )
}

export default function TentangPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const intro = useAboutIntro()

  // ─── DATA DINAMIS DARI BACKEND ─────────────────────────────────────────────
  const [teamSectionTitle, setTeamSectionTitle] = useState('Orang-orang di Balik Ekosistem Ini.')
  const [teamMembers, setTeamMembers] = useState([])
  const [teamLoading, setTeamLoading] = useState(true)

  const [faqList, setFaqList] = useState([])
  const [faqLoading, setFaqLoading] = useState(true)
  const [faqError, setFaqError] = useState('')

  // Video Profil State
  const [profileVideo, setProfileVideo] = useState(null)
  const [videoLoading, setVideoLoading] = useState(true)
  const [videoSetting, setVideoSetting] = useState({
    section_label: 'Video Profil',
    section_title: 'Lihat sendiri bagaimana kolaborasi bekerja.',
    section_description:
      'Keripitannya kami tampilkan apa adanya: obrolan panjang, request yang berubah, sampai proses panjang yang berakhir sesuai rencana. Video ini rekaman, bukan brosur.',
  })
  const [videoHighlightsList, setVideoHighlightsList] = useState([])

  useEffect(() => {
    let isMounted = true

    const loadAboutData = async () => {
      try {
        setTeamLoading(true)
        setFaqLoading(true)
        setFaqError('')
        setVideoLoading(true)
        const [settingRes, teamRes, faqRes, videoRes, videoSettingRes, videoHighlightsRes] = await Promise.allSettled([
          getPublicAboutSettingApi(),
          getPublicTeamMembersApi(),
          getPublicAboutFAQsApi(),
          getPublicAboutVideosApi(),
          getPublicAboutVideoSettingApi(),
          getPublicAboutVideoHighlightsApi(),
        ])

        if (isMounted) {
          if (settingRes.status === 'fulfilled') {
            const rawTeamTitle =
              settingRes.value?.data?.team_title ||
              (typeof settingRes.value?.team_title === 'string' ? settingRes.value.team_title : null)
            if (rawTeamTitle && typeof rawTeamTitle === 'string' && rawTeamTitle.trim()) {
              setTeamSectionTitle(rawTeamTitle.trim())
            }
          }

          if (teamRes.status === 'fulfilled') {
            const data = Array.isArray(teamRes.value?.data)
              ? teamRes.value.data
              : Array.isArray(teamRes.value)
                ? teamRes.value
                : []
            // Filter hanya yang memiliki nama dan foto valid
            const validMembers = data.filter(m => m?.name && m?.photo_url)
            setTeamMembers(validMembers.length > 0 ? validMembers : team)
          } else {
            setTeamMembers(team)
          }

          if (faqRes.status === 'fulfilled') {
            const rawFaqs = Array.isArray(faqRes.value?.data)
              ? faqRes.value.data
              : Array.isArray(faqRes.value)
                ? faqRes.value
                : []
            setFaqList(rawFaqs)
          } else {
            setFaqError(
              faqRes.reason?.response?.data?.message ||
              faqRes.reason?.message ||
              'Gagal memuat pertanyaan FAQ saat ini.'
            )
          }

          if (videoRes.status === 'fulfilled') {
            const rawVideos = Array.isArray(videoRes.value?.data)
              ? videoRes.value.data
              : Array.isArray(videoRes.value)
                ? videoRes.value
                : []
            // Ambil video profil aktif terbaru (elemen pertama karena backend sudah urut ID DESC)
            if (rawVideos.length > 0) {
              setProfileVideo(rawVideos[0])
            } else {
              setProfileVideo(null)
            }
          } else {
            setProfileVideo(null)
          }

          if (videoSettingRes.status === 'fulfilled' && videoSettingRes.value?.data) {
            const sData = videoSettingRes.value.data
            setVideoSetting({
              section_label: sData.section_label?.trim() || 'Video Profil',
              section_title: sData.section_title?.trim() || 'Lihat sendiri bagaimana kolaborasi bekerja.',
              section_description:
                sData.section_description?.trim() ||
                'Keripitannya kami tampilkan apa adanya: obrolan panjang, request yang berubah, sampai proses panjang yang berakhir sesuai rencana. Video ini rekaman, bukan brosur.',
            })
          }

          if (videoHighlightsRes.status === 'fulfilled') {
            const rawHighlights = Array.isArray(videoHighlightsRes.value?.data)
              ? videoHighlightsRes.value.data
              : Array.isArray(videoHighlightsRes.value)
                ? videoHighlightsRes.value
                : []
            setVideoHighlightsList(rawHighlights)
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data Tentang Kami:', err)
        if (isMounted) {
          setTeamMembers(team)
          setFaqError('Gagal memuat pertanyaan FAQ saat ini.')
        }
      } finally {
        if (isMounted) {
          setTeamLoading(false)
          setFaqLoading(false)
          setVideoLoading(false)
        }
      }
    }

    loadAboutData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#0c4a6e]" style={{ fontFamily: "'Mona Sans', system-ui, sans-serif" }}>

      <div className="h-[68px]">
        <PublicNavbar onNavigate={onNavigate} activePage="tentang" scrolled={scrolled} />
      </div>
      <PublicPageBanner pageKey="tentang" breadcrumb="Tentang Kami" onNavigate={onNavigate} />
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="mb-14">
          <Reveal>
            <SubTitle>Pilih yang Terbaik</SubTitle>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15] max-w-2xl">
              Memberdayakan Bisnis dengan{' '}
              <span className="text-[#0284c7]">Keahlian.</span>
            </h2>
          </Reveal>
        </div>

        <PublicAboutCards onNavigate={onNavigate} />
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-28">
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-14 items-center">
          <Reveal>
            <VideoProfile video={profileVideo} loading={videoLoading} />
          </Reveal>

          <div className="pt-6 lg:pt-0">
            <Reveal>
              <SubTitle>{videoSetting.section_label || 'Video Profil'}</SubTitle>
              <h2 className="text-3xl md:text-[42px] font-extrabold tracking-tight leading-[1.18] mb-6">
                {renderTeamHeading(videoSetting.section_title || 'Lihat sendiri bagaimana kolaborasi bekerja.')}
              </h2>
              {videoSetting.section_description && (
                <p className="text-[14.5px] leading-relaxed text-[#364e52] max-w-lg whitespace-pre-line">
                  {videoSetting.section_description}
                </p>
              )}
            </Reveal>

            {videoHighlightsList.length > 0 ? (
              <div className="mt-9 space-y-5">
                {videoHighlightsList.map((item, i) => (
                  <Reveal key={item.id || item.title || i} delay={i * 120}>
                    <div className="flex items-start gap-4">
                      <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-[#F0F4F8] text-[#0284c7] shadow-xs">
                        <DynamicHighlightIcon name={item.icon} size={20} />
                      </span>
                      <div>
                        <h3 className="font-bold text-[15.5px] mb-1.5 text-gray-900">{item.title}</h3>
                        <p className="text-[13.5px] leading-relaxed text-[#364e52]">{item.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {impactStats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      </section>
      <AboutIntroSection intro={intro} onNavigate={onNavigate} />
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <SubTitle>Tim Kami</SubTitle>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
            {renderTeamHeading(teamSectionTitle)}
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {teamMembers.map((member, i) => {
            const memberName = member.name || ''
            const memberRole = member.position || member.role || ''
            const rawPhoto = member.photo_url || member.img || ''
            const photoSrc = rawPhoto ? (rawPhoto.startsWith('http') ? rawPhoto : resolveImageUrl(rawPhoto)) : ''

            return (
              <Reveal key={member.id || memberName || i} delay={i * 90} className={i % 2 === 1 ? 'lg:mt-10' : ''}>
                <div className="group">
                  <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-100 aspect-[3/4] flex items-center justify-center">
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt={memberName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full items-center justify-center bg-gray-100 text-gray-400 ${photoSrc ? 'hidden' : 'flex'}`}>
                      <User size={48} className="text-gray-400" />
                    </div>
                    {memberRole && (
                      <div className="absolute left-3 bottom-3 bg-white/95 backdrop-blur rounded-md px-2.5 py-1.5 text-[11px] font-bold text-[#0c4a6e] translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        {memberRole}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-[15px] md:text-base">{memberName}</h3>
                  {memberRole && (
                    <p className="text-[12.5px] text-[#0284c7] font-semibold lg:hidden">{memberRole}</p>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>
      <section className="bg-[#F0F4F8] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[0.85fr_1.4fr] gap-12 lg:gap-16 items-start">

          <Reveal>
            <SubTitle>Pertanyaan Umum</SubTitle>
            <h2 className="text-3xl md:text-[42px] font-extrabold tracking-tight leading-[1.18] mb-5">
              Butuh Bantuan? <span className="text-[#0284c7]">Mulai di Sini.</span>
            </h2>
            <p className="text-[14.5px] leading-relaxed text-[#364e52] mb-8 max-w-sm">
              Tidak menemukan jawabanmu? Kirim pertanyaan lewat halaman Partnership —
              kami balas satu per satu, tanpa template.
            </p>
            <PillButton onClick={() => onNavigate?.('partnership')}>Ajukan Pertanyaan</PillButton>
          </Reveal>

          <div className="space-y-4">
            {faqLoading ? (
              <div className="p-8 text-center bg-white/60 border border-gray-200/80 rounded-xl text-gray-500">
                <div className="w-7 h-7 border-2 border-[#0284c7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[13.5px] font-medium text-[#364e52]">Memuat pertanyaan umum...</p>
              </div>
            ) : faqError ? (
              <div className="p-6 text-center bg-white/80 border border-red-200/80 rounded-xl text-red-600">
                <p className="text-[13.5px] font-medium mb-1">{faqError}</p>
                <p className="text-[12px] text-gray-500">Silakan muat ulang halaman beberapa saat lagi.</p>
              </div>
            ) : faqList.length === 0 ? (
              <div className="p-8 text-center bg-white/60 border border-gray-200/80 rounded-xl text-gray-500">
                <p className="text-[14px] font-medium text-[#364e52]">Belum ada pertanyaan yang tersedia saat ini.</p>
                <p className="text-[12.5px] text-gray-400 mt-1">Gunakan tombol di samping untuk mengajukan pertanyaan Anda.</p>
              </div>
            ) : (
              faqList.map((f, i) => {
                const open = openFaq === i
                return (
                  <Reveal key={f.id || f.question || i} delay={i * 60}>
                    <div className={`rounded-xl border transition-all duration-300 ${
                      open
                        ? 'bg-white border-[#0284c7]/40 shadow-lg shadow-blue-100'
                        : 'bg-white/70 border-gray-200 hover:border-gray-300'
                    }`}>
                      <button
                        onClick={() => setOpenFaq(open ? -1 : i)}
                        aria-expanded={open}
                        className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left cursor-pointer"
                      >
                        <span className={`font-semibold text-[15px] leading-relaxed transition-colors ${
                          open ? 'text-[#0284c7]' : 'text-[#0c4a6e]'
                        }`}>
                          {f.question}
                        </span>
                        <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                          open ? 'bg-[#0284c7] rotate-45' : 'bg-[#F0F4F8]'
                        }`}>
                          <Plus size={16} className={open ? 'text-white' : 'text-[#0c4a6e]'} strokeWidth={2.5} />
                        </span>
                      </button>
                      <div className={`grid transition-all duration-300 ease-out ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}>
                        <div className="overflow-hidden">
                          <p className="px-7 pb-6 text-[14px] leading-relaxed text-[#364e52] whitespace-pre-wrap">{f.answer}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                )
              })
            )}
          </div>
        </div>
      </section>
      <section className="bg-[#0284c7] text-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full border-[40px] border-white/10" />
        <div className="absolute -bottom-52 -left-32 w-[420px] h-[420px] rounded-full border-[32px] border-[#0c4a6e]/20" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-sky-400 mb-5">
            Kesempatan Terbuka
          </p>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-8 max-w-3xl mx-auto">
            Bangun masa depan{' '}
            <span className="relative inline-block">
              bersama kami
              <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden="true">
                <path d="M3 8 C 40 2, 80 11, 118 5 S 176 3, 197 7" stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
            .
          </h2>
          <PillButton onClick={() => onNavigate?.('register')}>
            Mulai Sekarang
          </PillButton>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter onNavigate={onNavigate} />

    </div>
  )
}
