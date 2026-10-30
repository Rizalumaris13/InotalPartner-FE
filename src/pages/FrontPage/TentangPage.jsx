import { useState, useRef, useEffect } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import {
  ChevronRight, Home, ArrowRight,
  CheckCircle2, Plus,
} from 'lucide-react'
import PublicFooter from '../../components/PublicFooter'
import PublicAboutCards from '../../components/PublicAboutCards'

const progressStats = [
  { label: 'Kolaborasi berjalan', percent: 82 },
  { label: 'Kepuasan mitra', percent: 90 },
]

const missionList = ['Kejelasan arah sejak awal', 'Komunikasi tanpa birokrasi', 'Program yang dituntaskan']
const visionList = ['Ekosistem mitra terbesar di Indonesia', 'Dampak nyata lintas industri', 'Pertumbuhan bersama jangka panjang']

const team = [
  { name: 'Andini Prameswari', role: 'Chief Executive', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80' },
  { name: 'Bagas Nugraha', role: 'Operations Head', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80' },
  { name: 'Citra Maharani', role: 'Partnership Lead', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80' },
  { name: 'Dimas Saputra', role: 'Tech Director', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80' },
]

const faqs = [
  {
    q: 'Apa itu INOTAL Partner?',
    a: 'INOTAL Partner adalah wadah kemitraan ekosistem INOTAL. Kami menghubungkan perusahaan, komunitas, dan individu dengan program kolaborasi teknologi — dari pembagian proyek, pelatihan tim, sampai akses divisi teknis kami.',
  },
  {
    q: 'Siapa yang bisa bergabung?',
    a: 'Perusahaan teknologi, komunitas IT kampus, freelancer dengan portofolio, dan perusahaan non-teknologi yang sedang bertransformasi digital. Pendaftaran melalui halaman Partnership, tim kami akan merespons dalam 3 hari kerja.',
  },
  {
    q: 'Apakah ada biaya untuk menjadi mitra?',
    a: 'Untuk tier komunitas dan edukasi tidak ada biaya pendaftaran. Tier korporat menyesuaikan lingkup program — rinciannya dibahas transparan di pertemuan awal sebelum ada komitmen apa pun.',
  },
  {
    q: 'Bagaimana proses kolaborasi berjalan?',
    a: 'Pertemuan pertama memetakan kebutuhanmu, lalu kebutuhan itu dicocokkan dengan program berjalan atau membuka program baru. Evaluasi dijadwalkan tiap kuartal agar hasil selalu terukur.',
  },
  {
    q: 'Program seperti apa yang sedang berjalan?',
    a: 'Detail lengkap ada di halaman Program — umumnya mencakup kolaborasi proyek, program magang bersama, dan sesi berbagi keahlian antar mitra yang dijadwalkan tiap kuartal.',
  },
  {
    q: 'Bisakah mitra mengusulkan program sendiri?',
    a: 'Bisa dan sangat kami dukung. Usulan program masuk lewat grup internal lalu ditinjau bulanan. Beberapa program yang sekarang berjalan awalnya usulan mitra.',
  },
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

const PROFILE_VIDEO = {
  id: 'aqz-KE-bpKQ',
  title: 'Profil INOTAL Partner',
  duration: '03:24',
  poster: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&q=80',
}

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

function VideoProfile() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden bg-[#0c4a6e]">
        <div className="relative aspect-[16/10] w-full">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full border-0"
              src={`https://www.youtube-nocookie.com/embed/${PROFILE_VIDEO.id}?autoplay=1&rel=0&modestbranding=1`}
              title={PROFILE_VIDEO.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={PROFILE_VIDEO.poster}
                alt="Sesi kolaborasi INOTAL Partner bersama mitra"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e]/85 via-[#0c4a6e]/20 to-[#0c4a6e]/45" />
              <button
                onClick={() => setPlaying(true)}
                aria-label={`Putar video: ${PROFILE_VIDEO.title}`}
                className="group absolute inset-0 flex items-center justify-center"
              >
                <span className="absolute w-[104px] h-[104px] rounded-full border border-white/25 transition-transform duration-500 group-hover:scale-110" />
                <span className="absolute w-[78px] h-[78px] rounded-full bg-white/10 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110" />
                <span className="relative grid place-items-center w-[64px] h-[64px] rounded-full bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.06]">
                  <svg width="18" height="22" viewBox="0 0 18 22" fill="#0c4a6e" aria-hidden="true">
                    <path d="M17 10.05 1.7 20.9A1 1 0 0 1 0 20V2a1 1 0 0 1 1.7-.9L17 11.95a1 1 0 0 1 0 1.7Z" />
                  </svg>
                </span>
              </button>
              <div className="absolute left-0 right-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
                <div className="min-w-0">
                  <p className="text-white font-bold text-[15px] md:text-[17px] leading-snug truncate">
                    {PROFILE_VIDEO.title}
                  </p>
                  <p className="text-white/60 text-[12.5px] mt-1">
                    Cuplikan program &amp; testimonial mitra
                  </p>
                </div>
                <span className="shrink-0 bg-black/45 backdrop-blur text-white text-[12px] font-semibold px-2.5 py-1 rounded-md tabular-nums">
                  {PROFILE_VIDEO.duration}
                </span>
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

export default function TentangPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [progRef, barsSeen] = useInView({ threshold: 0.4, fallbackMs: 1200 })

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
      <section className="mx-3 md:mx-4 mt-3 rounded-2xl bg-[#0c4a6e] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c4a6e]/85 via-[#0c4a6e]/55 to-[#0c4a6e]/85" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:items-end">
            <div>
              <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-sky-400 mb-4">
                Siapa Kami — Sejak 2019
              </p>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
                Tentang Kami
              </h1>
              <div className="inline-flex items-center gap-2 text-[13px] font-medium">
                <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center">
                  <Home size={14} className="text-sky-400" />
                </span>
                <button onClick={() => onNavigate?.('landing')} className="text-white/80 hover:text-white transition-colors">
                  Beranda
                </button>
                <ChevronRight size={14} className="text-white/40" />
                <span className="text-sky-400 font-semibold">Tentang Kami</span>
              </div>
            </div>
            <p className="text-white/70 text-[15px] leading-relaxed lg:text-right max-w-md lg:justify-self-end">
              Ekosistem kemitraan teknologi INOTAL — menghubungkan perusahaan,
              komunitas, dan talenta digital dalam satu jaringan yang saling menopang.
            </p>
          </div>
        </div>
      </section>
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
      <section className="max-w-7xl mx-auto px-6 pt-20 md:pt-28 pb-20 md:pb-28">
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-14 items-center">
          <Reveal>
            <VideoProfile />
          </Reveal>

          <div className="pt-6 lg:pt-0">
            <Reveal>
              <SubTitle>Video Profil</SubTitle>
              <h2 className="text-3xl md:text-[42px] font-extrabold tracking-tight leading-[1.18] mb-6">
                Lihat sendiri bagaimana{' '}
                <span className="text-[#0284c7]">kolaborasi bekerja.</span>
              </h2>
              <p className="text-[14.5px] leading-relaxed text-[#364e52] max-w-lg">
                Keripitannya kami tampilkan apa adanya: obrolan panjang, request yang berubah,
                sampai proses panjang yang berakhir sesuai rencana. Video ini rekaman,
                bukan brosur.
              </p>
            </Reveal>

            <div className="mt-9 space-y-5">
              {videoHighlights.map(({ icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 120}>
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 grid place-items-center w-11 h-11 rounded-lg bg-[#F0F4F8] text-[#0284c7]">
                      <SvgIcon shape={icon} className="w-[22px] h-[22px]" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[15.5px] mb-1.5">{title}</h3>
                      <p className="text-[13.5px] leading-relaxed text-[#364e52]">{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
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
      <section className="bg-[#F0F4F8] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <Reveal className="relative">
            <div className="rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
                alt="Tim INOTAL Partner dalam sesi diskusi kolaborasi"
                className="w-full h-[420px] md:h-[500px] object-cover"
                loading="lazy"
              />
            </div>
            <div ref={progRef} className="absolute -bottom-8 left-6 md:left-10 bg-white rounded-xl shadow-xl border border-gray-100 px-7 py-6 w-[280px]">
              <h4 className="font-bold text-[15px] mb-4">Progres Kemitraan</h4>
              <div className="space-y-4">
                {progressStats.map(({ label, percent }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[12px] font-semibold mb-1.5">
                      <span className="text-[#364e52]">{label}</span>
                      <span className="text-[#0284c7]">{percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0284c7] transition-all duration-[1400ms] ease-out"
                        style={{ width: barsSeen ? `${percent}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="pt-10 lg:pt-0">
            <Reveal>
              <SubTitle>Kenal Kami Lebih Dekat</SubTitle>
              <h2 className="text-3xl md:text-[42px] font-extrabold tracking-tight leading-[1.18] mb-10">
                Menggerakkan kolaborasi yang berdampak untuk{' '}
                <span className="text-[#0284c7]">pertumbuhan bersama.</span>
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-5 mb-10">
              {[
                { title: 'Misi Kami', desc: 'Memberdayakan mitra melalui solusi kolaborasi yang terukur dan layanan yang sungguh-sungguh.', items: missionList, dot: 'bg-[#0284c7]' },
                { title: 'Visi Kami', desc: 'Menjadi ekosistem kemitraan teknologi paling dipercaya di Indonesia.', items: visionList, dot: 'bg-sky-500' },
              ].map(({ title, desc, items, dot }, i) => (
                <Reveal key={title} delay={i * 120}>
                  <div className="bg-white rounded-xl border border-gray-200/80 p-7 h-full hover:border-[#0284c7]/50 transition-colors">
                    <h3 className="text-lg font-bold mb-2.5 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      {title}
                    </h3>
                    <p className="text-[13.5px] leading-relaxed text-[#364e52] mb-4">{desc}</p>
                    <ul className="space-y-2.5">
                      {items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-[13px] text-[#0c4a6e]">
                          <CheckCircle2 size={15} className="text-[#0284c7] shrink-0 mt-0.5" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={200}>
              <PillButton onClick={() => onNavigate?.('program')}>Lihat Program Kami</PillButton>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <SubTitle>Tim Kami</SubTitle>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Orang-orang di Balik <span className="text-[#0284c7]">Ekosistem Ini.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {team.map(({ name, role, img }, i) => (
            <Reveal key={name} delay={i * 90} className={i % 2 === 1 ? 'lg:mt-10' : ''}>
              <div className="group">
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img
                    src={img}
                    alt={name}
                    className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute left-3 bottom-3 bg-white/95 backdrop-blur rounded-md px-2.5 py-1.5 text-[11px] font-bold text-[#0c4a6e] translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {role}
                  </div>
                </div>
                <h3 className="font-bold text-[15px] md:text-base">{name}</h3>
                <p className="text-[12.5px] text-[#0284c7] font-semibold lg:hidden">{role}</p>
              </div>
            </Reveal>
          ))}
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
            {faqs.map((f, i) => {
              const open = openFaq === i
              return (
                <Reveal key={f.q} delay={i * 60}>
                  <div className={`rounded-xl border transition-all duration-300 ${
                    open
                      ? 'bg-white border-[#0284c7]/40 shadow-lg shadow-blue-100'
                      : 'bg-white/70 border-gray-200 hover:border-gray-300'
                  }`}>
                    <button
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left"
                    >
                      <span className={`font-semibold text-[15px] leading-relaxed transition-colors ${
                        open ? 'text-[#0284c7]' : 'text-[#0c4a6e]'
                      }`}>
                        {f.q}
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
                        <p className="px-7 pb-6 text-[14px] leading-relaxed text-[#364e52]">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
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
