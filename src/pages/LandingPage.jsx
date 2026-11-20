import { useState, useEffect } from 'react'
import usePublicFeed from '../hooks/usePublicFeed'
import PublicNavbar from '../components/PublicNavbar'
import PublicFooter from '../components/PublicFooter'
import PublicPartnerSection from '../components/PublicPartnerSection'
import HomepageJoinImages from '../components/HomepageJoinImages'
import HomepageJoinCard from '../components/HomepageJoinCard'
import useHomepageJoinCards from '../hooks/useHomepageJoinCards'
import HomepageServicesSection from '../components/HomepageServicesSection'
import useHomepageServices from '../hooks/useHomepageServices'
import {
  getPublicNewsApi,
  getPublicEventsApi,
  getPublicArticlesApi,
  resolveImageUrl,
} from '../api/posts'

import {
  getPublicBannersApi,
  resolveBannerImageUrl,
} from '../api/homepageBanners'

import { getPublicTestimonialsApi } from '../api/testimonials'

import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
} from 'lucide-react'

const stats = [
  { value: '2021', label: 'TAHUN BERDIRI' },
  { value: '95+', label: 'ALUMNI' },
  { value: '7', label: 'PARTNERSHIP' },
  { value: '19', label: 'PROGRAM' },
]

function ScrollIndicator() {
  return (
    <div className="flex flex-col items-center gap-1 animate-bounce">
      <div className="w-6 h-10 rounded-full border-2 border-white/60 flex items-start justify-center pt-1.5">
        <div className="w-1 h-2 bg-white/80 rounded-full animate-[scrollDot_1.5s_ease-in-out_infinite]" />
      </div>

      <span className="text-white/50 text-xs tracking-widest uppercase">
        Scroll
      </span>
    </div>
  )
}

function FloatingStat({
  value,
  label,
  className = '',
  rotate = '0deg',
  delay = '0s',
}) {
  return (
    <div
      className={`hidden sm:flex absolute z-10 flex-col items-center bg-white rounded-2xl shadow-xl px-5 py-3 min-w-[112px] ${className}`}
      style={{
        animation: `floatY 4.5s ease-in-out ${delay} infinite`,
        '--rot': rotate,
      }}
    >
      <span className="text-sky-500 text-3xl font-extrabold leading-none">
        {value}
      </span>

      <span className="text-gray-500 text-xs font-semibold tracking-wide mt-1.5 text-center">
        {label}
      </span>
    </div>
  )
}

const CAROUSEL_BREAKPOINTS = ['(min-width: 40rem)', '(min-width: 64rem)']

function readCarouselColumns() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 1
  return window.matchMedia(CAROUSEL_BREAKPOINTS[1]).matches ? 3
    : window.matchMedia(CAROUSEL_BREAKPOINTS[0]).matches ? 2 : 1
}

function useCarouselColumns() {
  const [columns, setColumns] = useState(readCarouselColumns)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const media = CAROUSEL_BREAKPOINTS.map((query) => window.matchMedia(query))
    const update = () => setColumns(readCarouselColumns())
    media.forEach((query) => query.addEventListener('change', update))
    return () => media.forEach((query) => query.removeEventListener('change', update))
  }, [])
  return columns
}

function useCarousel(total, perView = 1) {
  const [position, setIdx] = useState(0)

  const maxIdx = Math.max(0, total - perView)
  const idx = Math.min(position, maxIdx)

  const prev = () => {
    setIdx((i) => Math.max(0, Math.min(i, maxIdx) - 1))
  }

  const next = () => {
    setIdx((i) => Math.min(maxIdx, i + 1))
  }

  return {
    idx,
    setIdx,
    prev,
    next,
    canPrev: idx > 0,
    canNext: idx < maxIdx,
  }
}

const newsFeed = {
  load: () => getPublicNewsApi(1, 5),
  mapItem: (news) => ({
    id: news.id,
    category:
      news.categories?.[0]?.name ||
      news.category?.name ||
      'Berita',
    title: news.title,
    excerpt: news.excerpt || '',
    img: news.thumbnail_url
      ? resolveImageUrl(news.thumbnail_url)
      : '',
    date: news.created_at
      ? new Date(news.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    slug: news.slug,
  }),
  errorMessage: 'Gagal mengambil berita',
}

const eventsFeed = {
  load: () => getPublicEventsApi(1, 9),
  mapItem: (ev) => ({
    id: ev.id,
    category:
      ev.categories?.[0]?.name || ev.category?.name || 'Event',
    title: ev.title,
    img: ev.thumbnail_url ? resolveImageUrl(ev.thumbnail_url) : '',
    date: ev.event_date
      ? new Date(ev.event_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    time: ev.event_time ? ev.event_time.slice(0, 5) : '',
    location: ev.event_location || '',
    slug: ev.slug,
  }),
  errorMessage: 'Gagal mengambil event',
}

const articlesFeed = {
  load: () => getPublicArticlesApi(1, 9),
  mapItem: (art) => ({
    id: art.id,
    category:
      art.categories?.[0]?.name || art.category?.name || 'Article',
    title: art.title,
    excerpt: art.excerpt || '',
    img: art.thumbnail_url ? resolveImageUrl(art.thumbnail_url) : '',
    date: art.created_at
      ? new Date(art.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    slug: art.slug,
  }),
  errorMessage: 'Gagal mengambil artikel',
}

export default function LandingPage({ onNavigate }) {
  const carouselColumns = useCarouselColumns()
  const actionBoxes = useHomepageJoinCards()
  const services = useHomepageServices()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const [heroSlides, setHeroSlides] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroLoading, setHeroLoading] = useState(true)
  const [heroError, setHeroError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchBanners = async () => {
      try {
        setHeroLoading(true)
        setHeroError('')

        const response = await getPublicBannersApi()
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : []

        const formattedSlides = data
          .filter((banner) => banner?.is_active)
          .sort((a, b) => {
            const orderA = Number(a?.order) || 0
            const orderB = Number(b?.order) || 0
            return orderA - orderB || (Number(a?.id) || 0) - (Number(b?.id) || 0)
          })
          .map((banner) => ({
            id: banner.id,
            title: banner.title || '',
            image: resolveBannerImageUrl(banner.background_image),
            buttons: Array.isArray(banner.buttons) ? banner.buttons : [],
          }))

        if (isMounted) {
          setHeroSlides(formattedSlides)
          setHeroIdx(0)
        }
      } catch (error) {
        console.error('Gagal mengambil slider Landing Page:', error)
        if (isMounted) {
          setHeroSlides([])
          setHeroIdx(0)
          setHeroError(
            error.message || 'Gagal mengambil slider Landing Page.'
          )
        }
      } finally {
        if (isMounted) setHeroLoading(false)
      }
    }

    fetchBanners()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined

    const t = setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(t)
  }, [heroSlides.length])

  const safeHeroIdx = heroIdx >= 0 && heroIdx < heroSlides.length ? heroIdx : 0

  const heroPrev = () => {
    if (heroSlides.length <= 1) return
    setHeroIdx((i) => (i - 1 + heroSlides.length) % heroSlides.length)
  }

  const heroNext = () => {
    if (heroSlides.length <= 1) return
    setHeroIdx((i) => (i + 1) % heroSlides.length)
  }

  const { items: newsItems, loading: newsLoading, error: newsError } = usePublicFeed(newsFeed)
  const { items: eventItems, loading: eventsLoading, error: eventsError } = usePublicFeed(eventsFeed)
  const { items: articleItems, loading: articlesLoading, error: articlesError } = usePublicFeed(articlesFeed)

  const eventPerView = Math.min(eventItems.length || 1, carouselColumns)
  const eventC = useCarousel(eventItems.length, eventPerView)

  const articlePerView = Math.min(articleItems.length || 1, carouselColumns)
  const articleC = useCarousel(articleItems.length, articlePerView)

  const [testimonials, setTestimonials] = useState([])
  const [testiLoading, setTestiLoading] = useState(true)
  const [testiError, setTestiError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchTestimonials = async () => {
      try {
        setTestiLoading(true)
        setTestiError('')

        const response = await getPublicTestimonialsApi()
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : []

        if (isMounted) {
          setTestimonials(data)
        }
      } catch (error) {
        console.error('Gagal mengambil testimoni:', error)
        if (isMounted) {
          setTestiError(error.message || 'Gagal mengambil data testimoni')
          setTestimonials([])
        }
      } finally {
        if (isMounted) {
          setTestiLoading(false)
        }
      }
    }

    fetchTestimonials()

    return () => {
      isMounted = false
    }
  }, [])

  const testiTotal = testimonials.length
  const testiPerView = Math.min(testiTotal || 1, carouselColumns === 3 ? 2 : 1)
  const testiMaxIdx = Math.max(0, testiTotal - testiPerView)
  const [testiPosition, setTestiIdx] = useState(0)
  const testiIdx = Math.min(testiPosition, testiMaxIdx)
  const [testiTouchStart, setTestiTouchStart] = useState(null)
  const [testiTouchEnd, setTestiTouchEnd] = useState(null)

  const handleTestiPrev = () => {
    if (testiMaxIdx === 0) return
    setTestiIdx((curr) => (Math.min(curr, testiMaxIdx) <= 0 ? testiMaxIdx : Math.min(curr, testiMaxIdx) - 1))
  }

  const handleTestiNext = () => {
    if (testiMaxIdx === 0) return
    setTestiIdx((curr) => (curr >= testiMaxIdx ? 0 : curr + 1))
  }

  const handleTestiDot = (targetIdx) => {
    setTestiIdx(targetIdx)
  }

  const handleTestiTouchStart = (e) => {
    setTestiTouchEnd(null)
    setTestiTouchStart(e.targetTouches[0].clientX)
  }

  const handleTestiTouchMove = (e) => {
    setTestiTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTestiTouchEnd = () => {
    if (!testiTouchStart || !testiTouchEnd) return
    const distance = testiTouchStart - testiTouchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleTestiNext()
    } else if (isRightSwipe) {
      handleTestiPrev()
    }
  }

  // Auto-slide interval: berjalan normal dan timer di-restart setelah navigasi manual
  useEffect(() => {
    if (testiMaxIdx === 0) return

    const interval = setInterval(() => {
      setTestiIdx((curr) => (curr >= testiMaxIdx ? 0 : curr + 1))
    }, 5000)

    return () => clearInterval(interval)
  }, [testiIdx, testiTotal, testiMaxIdx])

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">
      <style>{`
        @keyframes scrollDot {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }

          50% {
            transform: translateY(8px);
            opacity: 0.3;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatY {
          0%, 100% {
            transform: translateY(0) rotate(var(--rot, 0deg));
          }

          50% {
            transform: translateY(-14px) rotate(var(--rot, 0deg));
          }
        }

        @keyframes blobMorph {
          0% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: scale(1) rotate(0deg);
          }

          50% {
            border-radius: 40% 60% 70% 30% / 50% 60% 40% 50%;
            transform: scale(1.05) rotate(8deg);
          }

          100% {
            border-radius: 30% 70% 40% 60% / 40% 50% 60% 50%;
            transform: scale(0.98) rotate(-4deg);
          }
        }
      `}</style>

      <PublicNavbar
        onNavigate={onNavigate}
        activePage="landing"
        scrolled={scrolled}
      />

      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        {heroSlides.map((slide, i) => (
          <div
            key={slide.id ?? i}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              i === safeHeroIdx ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: slide.image ? `url(${slide.image})` : undefined,
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

        <FloatingStat
          value={stats[0].value}
          label={stats[0].label}
          delay="0s"
          rotate="-6deg"
          className="top-[15%] left-4 md:left-30"
        />

        <FloatingStat
          value={stats[1].value}
          label={stats[1].label}
          delay="0.8s"
          rotate="6deg"
          className="top-[15%] right-4 md:right-30"
        />

        <FloatingStat
          value={stats[2].value}
          label={stats[2].label}
          delay="1.6s"
          rotate="4deg"
          className="bottom-[18%] left-4 md:left-36"
        />

        <FloatingStat
          value={stats[3].value}
          label={stats[3].label}
          delay="2.4s"
          rotate="-4deg"
          className="bottom-[18%] right-4 md:right-36"
        />

        {heroSlides.length > 0 && (
          <>
            {heroSlides.length > 1 && (
              <button
                onClick={heroPrev}
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all"
                aria-label="Sebelumnya"
              >
                <ChevronLeft size={22} className="text-white" />
              </button>
            )}

            <div className="relative z-10 max-w-4xl mx-auto">
              {heroSlides[safeHeroIdx].title && (
                <h1
                  key={heroSlides[safeHeroIdx].id}
                  className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-10 drop-shadow-lg animate-[fadeIn_0.6s_ease]"
                >
                  {heroSlides[safeHeroIdx].title}
                </h1>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4">
                {heroSlides[safeHeroIdx].buttons
                  .filter((button) => button?.label?.trim() && button?.url?.trim())
                  .map((button, index) => (
                    <a
                      key={button.id ?? `${button.label}-${button.url}-${index}`}
                      href={button.url}
                      className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-sky-900/30 text-lg md:text-xl"
                    >
                      {button.label}
                    </a>
                  ))}
              </div>

              {heroSlides.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {heroSlides.map((slide, i) => (
                    <button
                      key={slide.id ?? i}
                      onClick={() => setHeroIdx(i)}
                      aria-label={`Slide ${i + 1}`}
                      className={`rounded-full transition-all ${
                        i === safeHeroIdx
                          ? 'w-6 h-2 bg-sky-400'
                          : 'w-2 h-2 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {heroSlides.length > 1 && (
              <button
                onClick={heroNext}
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all"
                aria-label="Berikutnya"
              >
                <ChevronRight size={22} className="text-white" />
              </button>
            )}
          </>
        )}

        {heroLoading && (
          <div className="relative z-10 text-white/80 text-lg">
            Memuat slider...
          </div>
        )}

        {!heroLoading && heroSlides.length === 0 && (
          <div className="relative z-10 max-w-xl px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
              {heroError ? 'Slider belum tersedia' : 'Selamat Datang'}
            </h1>
            {heroError && (
              <p className="mt-4 text-white/70">{heroError}</p>
            )}
          </div>
        )}

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <ScrollIndicator />
        </div>
      </section>

      <HomepageServicesSection services={services} />

      <section className="landing-section px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 md:mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Event Update
            </h2>

            <div className="flex gap-2">
              <button
                onClick={eventC.prev}
                disabled={!eventC.canPrev}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-400 hover:text-sky-500 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={eventC.next}
                disabled={!eventC.canNext}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-400 hover:text-sky-500 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {eventsLoading && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">Memuat event...</p>
            </div>
          )}

          {!eventsLoading && eventsError && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-red-500">{eventsError}</p>
            </div>
          )}

          {!eventsLoading && !eventsError && eventItems.length === 0 && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">Belum ada event yang dipublikasikan.</p>
            </div>
          )}

          {!eventsLoading && !eventsError && eventItems.length > 0 && (
            <div className="overflow-hidden">
              <div
                className="flex gap-5 transition-transform duration-500 ease-in-out"
                style={{
                  '--carousel-items': eventPerView,
                  '--carousel-gap': 'calc(var(--spacing) * 5)',
                  transform: `translateX(calc(-${eventC.idx} * ((100% + var(--carousel-gap)) / var(--carousel-items))))`,
                }}
              >
                {eventItems.map((ev) => (
                  <div
                    key={ev.id}
                    className="group relative landing-carousel-item h-[400px] sm:h-[440px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer bg-gray-200"
                  >
                    {ev.img ? (
                      <img
                        src={ev.img}
                        alt={ev.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Tidak ada gambar
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 pointer-events-none" />

                    <h3 className="absolute top-6 left-6 right-6 text-white font-extrabold text-2xl sm:text-[28px] uppercase leading-snug tracking-wide drop-shadow-lg">
                      {ev.title}
                    </h3>

                    <div className="absolute bottom-20 left-6 right-6 flex flex-col gap-2.5">
                      {ev.date && (
                        <div className="flex items-center gap-2 text-white/95 text-sm font-medium">
                          <Calendar size={16} className="text-white/80" />
                          <span>
                            {ev.date}
                            {ev.time ? ` · ${ev.time}` : ''}
                          </span>
                        </div>
                      )}

                      {ev.location && (
                        <div className="flex items-center gap-2 text-white/95 text-sm font-medium">
                          <MapPin size={16} className="text-white/80" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                    </div>

                    <button className="absolute bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors duration-300 shadow-md">
                      Lihat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-12 md:pb-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 md:mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Article
            </h2>

            <div className="flex gap-2">
              <button
                onClick={articleC.prev}
                disabled={!articleC.canPrev}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-400 hover:text-sky-500 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={articleC.next}
                disabled={!articleC.canNext}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-400 hover:text-sky-500 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {articlesLoading && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">Memuat artikel...</p>
            </div>
          )}

          {!articlesLoading && articlesError && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-red-500">{articlesError}</p>
            </div>
          )}

          {!articlesLoading && !articlesError && articleItems.length === 0 && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">Belum ada artikel yang dipublikasikan.</p>
            </div>
          )}

          {!articlesLoading && !articlesError && articleItems.length > 0 && (
            <div className="overflow-hidden">
              <div
                className="flex gap-5 transition-transform duration-500 ease-in-out"
                style={{
                  '--carousel-items': articlePerView,
                  '--carousel-gap': 'calc(var(--spacing) * 5)',
                  transform: `translateX(calc(-${articleC.idx} * ((100% + var(--carousel-gap)) / var(--carousel-items))))`,
                }}
              >
                {articleItems.map((art) => (
                  <div
                    key={art.id}
                    className={`group landing-carousel-item rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col ${articleItems.length === 1 ? 'md:flex-row' : ''}`}
                  >
                    <div className={`aspect-[16/10] bg-gray-100 overflow-hidden ${articleItems.length === 1 ? 'md:w-2/5 md:shrink-0' : ''}`}>
                      {art.img ? (
                        <img
                          src={art.img}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          Tidak ada gambar
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-sky-600 font-semibold text-xs mb-2 uppercase tracking-wide">
                        {art.category}
                      </p>

                      <h3 className="font-bold text-[#0f172a] text-base leading-snug mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors">
                        {art.title}
                      </h3>

                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-3">
                        {art.excerpt}
                      </p>

                      <p className="text-gray-400 text-xs mt-auto">{art.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="landing-section px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-[#1a202c] leading-tight max-w-3xl mx-auto">
              Ratusan partner di seluruh Indonesia,
              <br />
              tumbuh bersama dengan penuh kepercayaan
            </h2>
          </div>

          {testiLoading && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">Memuat testimoni...</p>
            </div>
          )}

          {!testiLoading && testiError && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-red-500">{testiError}</p>
            </div>
          )}

          {!testiLoading && !testiError && testimonials.length === 0 && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">Belum ada testimoni yang ditampilkan.</p>
            </div>
          )}

          {!testiLoading && !testiError && testimonials.length > 0 && (
            <>
              <div
                className="relative overflow-hidden"
                onTouchStart={handleTestiTouchStart}
                onTouchMove={handleTestiTouchMove}
                onTouchEnd={handleTestiTouchEnd}
              >
                <div
                  className="flex gap-8 transition-transform duration-700 ease-in-out"
                  style={{
                    '--carousel-items': testiPerView,
                    '--carousel-gap': 'calc(var(--spacing) * 8)',
                    transform: `translateX(calc(-${testiIdx} * ((100% + var(--carousel-gap)) / var(--carousel-items))))`,
                  }}
                >
                  {testimonials.map((t) => {
                    const photoSrc = t.photo_url ? resolveImageUrl(t.photo_url) : ''
                    const subtitle = [t.position, t.company].filter(Boolean).join(', ')

                    return (
                      <div
                        key={t.id}
                        className="landing-carousel-item flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6"
                      >
                        <div className="w-24 h-24 sm:w-[110px] sm:h-[110px] flex-shrink-0 rounded-[1.25rem] overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={t.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full items-center justify-center bg-gray-100 text-gray-400 ${
                              photoSrc ? 'hidden' : 'flex'
                            }`}
                          >
                            <User size={36} className="text-gray-400" />
                          </div>
                        </div>

                        <div className="flex flex-col text-center sm:text-left flex-1 min-w-0">
                          <p className="text-[#0f172a] text-[15px] sm:text-[17px] font-medium italic leading-relaxed mb-4">
                            "{t.content}"
                          </p>

                          <p className="font-bold text-[#0f172a] text-base">
                            {t.name}
                          </p>

                          {subtitle && (
                            <p className="text-gray-500 text-sm">
                              {subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {testiMaxIdx > 0 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleTestiPrev}
                    aria-label="Testimonial sebelumnya"
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-2.5">
                    {Array.from({ length: testiMaxIdx + 1 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleTestiDot(i)}
                        className={`rounded-full transition-all duration-300 focus:outline-none ${
                          i === testiIdx
                            ? 'w-3.5 h-3.5 bg-[#6366f1]'
                            : 'w-3.5 h-3.5 bg-gray-200 hover:bg-gray-300'
                        }`}
                        aria-label={`Ke slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleTestiNext}
                    aria-label="Testimonial berikutnya"
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <PublicPartnerSection />

      <section className="relative px-6 pb-12 md:pb-16 bg-white overflow-hidden">
        <div
          className="absolute -top-24 -left-32 w-[480px] h-[480px] bg-gradient-to-br from-sky-200 to-sky-100 opacity-60 blur-3xl pointer-events-none"
          style={{
            borderRadius:
              '58% 42% 35% 65% / 55% 40% 60% 45%',
          }}
        />

        <div
          className="absolute top-1/3 -right-20 w-[420px] h-[420px] bg-gradient-to-bl from-sky-100 to-blue-50 opacity-70 blur-3xl pointer-events-none"
          style={{
            borderRadius:
              '42% 58% 65% 35% / 45% 55% 40% 60%',
          }}
        />

        <div
          className="absolute -bottom-32 left-1/4 w-[360px] h-[360px] bg-gradient-to-tr from-sky-100 to-sky-200 opacity-50 blur-3xl pointer-events-none"
          style={{
            borderRadius:
              '50% 50% 40% 60% / 60% 40% 60% 40%',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-sky-500 text-sm font-bold tracking-[0.2em] uppercase mb-4">
              Mengapa Bergabung
            </p>

            <h2 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] mb-5">
              Saatnya Bersama Beraksi
            </h2>

            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Indonesia butuh pemuda generasi masa depan emas 2045.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-4">
            <div className="flex flex-col gap-6 w-full lg:w-[32%]">
              {actionBoxes.slice(0, 3).map((box) => (
                <HomepageJoinCard key={box.position} card={box} />
              ))}
            </div>

            <div className="w-full sm:w-2/3 lg:w-[36%] flex items-center justify-center relative min-h-[380px] lg:min-h-[450px]">
              <div className="absolute inset-0 m-auto w-3/4 h-3/4 bg-gradient-to-tr from-sky-200 to-violet-200 rounded-full blur-3xl opacity-50 pointer-events-none" />

              <HomepageJoinImages />
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-[32%]">
              {actionBoxes.slice(3, 6).map((box) => (
                <HomepageJoinCard key={box.position} card={box} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a]">
                Informasi & Berita
              </h2>
            </div>

            <a
              href="#"
              className="flex items-center gap-1 text-sky-500 font-semibold hover:text-sky-600 transition-colors"
            >
              Lihat semua
              <ChevronRight size={18} />
            </a>
          </div>

          {newsLoading && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-gray-400">
                Memuat berita...
              </p>
            </div>
          )}

          {!newsLoading && newsError && (
            <div className="flex items-center justify-center py-6 md:py-8">
              <p className="text-red-500">
                {newsError}
              </p>
            </div>
          )}

          {!newsLoading &&
            !newsError &&
            newsItems.length === 0 && (
              <div className="flex items-center justify-center py-6 md:py-8">
                <p className="text-gray-400">
                  Belum ada berita yang dipublikasikan.
                </p>
              </div>
            )}

          {!newsLoading &&
            !newsError &&
            newsItems.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className={`${newsItems.length > 1 ? 'lg:col-span-7' : 'lg:col-span-12'} group cursor-pointer`}>
                  <div className="overflow-hidden rounded-xl mb-5 bg-gray-100">
                    {newsItems[0].img ? (
                      <img
                        src={newsItems[0].img}
                        alt={newsItems[0].title}
                        className={`w-full aspect-[4/3] md:aspect-[16/9] ${newsItems.length > 1 ? 'lg:aspect-[4/3]' : ''} object-cover group-hover:scale-105 transition-transform duration-500`}
                      />
                    ) : (
                      <div className={`w-full aspect-[4/3] md:aspect-[16/9] ${newsItems.length > 1 ? 'lg:aspect-[4/3]' : ''} flex items-center justify-center bg-gray-200 text-gray-400`}>
                        Tidak ada gambar
                      </div>
                    )}
                  </div>

                  <p className="text-sky-600 font-semibold text-sm mb-2 uppercase tracking-wide">
                    {newsItems[0].category}
                  </p>

                  <h3 className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-3 group-hover:text-sky-600 transition-colors leading-snug">
                    {newsItems[0].title}
                  </h3>

                  <p className="text-gray-600 text-base leading-relaxed">
                    {newsItems[0].excerpt}
                  </p>

                  <p className="text-gray-400 text-base mt-2">
                    {newsItems[0].date}
                  </p>
                </div>

                {newsItems.length > 1 && <div className="lg:col-span-5 flex flex-col gap-6">
                  {newsItems.slice(1).map((news) => (
                    <div
                      key={news.id}
                      className="flex gap-4 group cursor-pointer items-center sm:items-start"
                    >
                      <div className="w-[120px] sm:w-[160px] aspect-[4/3] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {news.img ? (
                          <img
                            src={news.img}
                            alt={news.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs text-center px-2">
                            Tidak ada gambar
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-center py-1">
                        <p className="text-sky-600 font-semibold text-xs mb-1.5 uppercase tracking-wide">
                          {news.category}
                        </p>

                        <h4 className="font-bold text-[#0f172a] text-sm sm:text-base group-hover:text-sky-600 transition-colors leading-snug line-clamp-3">
                          {news.title}
                        </h4>

                        <p className="text-gray-400 text-base mt-2">
                          {news.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            )}
        </div>
      </section>

      <section className="relative px-6 pb-12 md:pb-16 bg-gray-50 overflow-hidden">
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#cbd5e1 2px, transparent 2px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between p-6 md:p-10 lg:p-12 gap-8">
          <div className="w-full md:w-3/5 flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f172a] leading-tight mb-5">
              SIAP Menjadi Bagian INOTAL Partner?
            </h2>

            <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Bergabunglah dengan X stakeholder dalam program digital dan transformasi masa depan
            </p>

            <button
              onClick={() => onNavigate?.('register')}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-10 py-3.5 rounded-xl transition-all shadow-lg shadow-sky-500/30 text-sm tracking-wide"
            >
              GABUNG SEKARANG
            </button>
          </div>

          <div className="w-full md:w-2/5 flex justify-center md:justify-end">
            <div className="w-48 h-48 sm:w-56 sm:h-56 bg-gray-900 rounded-lg transform rotate-12 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold rotate-[-12deg]">
                Logo Placeholder
              </span>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  )
}
