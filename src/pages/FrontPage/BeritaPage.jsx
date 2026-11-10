import { useState, useEffect, useMemo } from 'react'
import { formatDate, formatTime, formatViewCount } from '../../utils/newsFormat'
import Reveal from '../../components/Reveal'

import PublicNavbar from '../../components/PublicNavbar'
import PublicPageBanner from '../../components/PublicPageBanner'

import {
  getPublicNewsApi,
  getPublicPopularNewsApi,
  resolveImageUrl,
} from '../../api/posts'

import {
  ChevronRight,
  Search,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronDown,
  Eye,
  TrendingUp,
} from 'lucide-react'
import PublicFooter from '../../components/PublicFooter'

export default function BeritaPage({ onNavigate }) {

  const [page, setPage] = useState(1)

  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('terbaru')
  const [sortOpen, setSortOpen] = useState(false)

  const [newsItems, setNewsItems] = useState([])
  const [popularItems, setPopularItems] = useState([])

  const [newsLoading, setNewsLoading] = useState(true)

  const [newsError, setNewsError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchNews = async () => {
      try {
        setNewsLoading(true)

        setNewsError('')

        // Daftar dibatasi 100 berita; pagination berikutnya tetap di sisi klien.
        const [newsResult, popularResult] = await Promise.allSettled([
          getPublicNewsApi(1, 100),
          getPublicPopularNewsApi(50),
        ])

        if (newsResult.status !== 'fulfilled') {
          throw newsResult.reason
        }

        const response = newsResult.value
        const popularResponse = popularResult.status === 'fulfilled'
          ? popularResult.value
          : null

        const extractList = (payload) => {
          const data = payload?.data?.data ?? payload?.data ?? payload ?? []
          if (Array.isArray(data)) return data
          if (Array.isArray(data?.data)) return data.data
          if (Array.isArray(data?.items)) return data.items
          return []
        }

        const formatNews = (newsData) => newsData.map((news) => ({
          id: news.id,
          title: news.title || '',
          excerpt: news.excerpt || '',
          categories: Array.isArray(news.categories) && news.categories.length > 0
            ? news.categories.map((c) => c.name)
            : news.category?.name
              ? [news.category.name]
              : ['Berita'],
          publishedAt: news.published_at || news.created_at || '',
          image: news.thumbnail_url ? resolveImageUrl(news.thumbnail_url) : '',
          slug: news.slug || '',
          viewCount: Number(news.view_count || 0),
        }))

        const formattedNews = formatNews(extractList(response))
        const formattedPopular = popularResponse
          ? formatNews(extractList(popularResponse))
          : [...formattedNews].sort((a, b) => b.viewCount - a.viewCount).slice(0, 50)

        if (!popularResponse) {
          console.warn('Endpoint berita populer gagal; menggunakan fallback dari daftar berita.')
        }

        if (isMounted) {
          setNewsItems(formattedNews)
          setPopularItems(formattedPopular)
        }

      } catch (error) {
        console.error(
          'Gagal mengambil berita:',
          error
        )

        if (isMounted) {
          setNewsError(
            error?.response?.data?.message ||
            error?.message ||
            'Gagal mengambil berita'
          )

          setNewsItems([])
          setPopularItems([])
        }

      } finally {
        if (isMounted) {
          setNewsLoading(false)
        }
      }
    }

    fetchNews()

    return () => {
      isMounted = false
    }

  }, [])

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()

    let list = [...(sortBy === 'terpopuler'
      ? (popularItems.length ? popularItems : newsItems)
      : newsItems)]

    if (category !== 'Semua') {
      list = list.filter(
        (news) => news.categories.includes(category)
      )
    }

    if (q) {
      list = list.filter((news) => {
        const title =
          news.title?.toLowerCase() || ''

        const excerpt =
          news.excerpt?.toLowerCase() || ''

        const categoryName =
          news.categories.join(' ').toLowerCase()

        return (
          title.includes(q) ||
          excerpt.includes(q) ||
          categoryName.includes(q)
        )
      })
    }

    return list.sort((a, b) => {

      if (sortBy === 'terbaru') {
        return (
          new Date(b.publishedAt) -
          new Date(a.publishedAt)
        )
      }

      if (sortBy === 'terlama') {
        return (
          new Date(a.publishedAt) -
          new Date(b.publishedAt)
        )
      }

      if (sortBy === 'terpopuler') {
        return (
          b.viewCount -
          a.viewCount
        )
      }

      return 0
    })

  }, [
    newsItems,
    popularItems,
    category,
    query,
    sortBy,
  ])

  const categories = useMemo(() => {
    const counts = {}

    newsItems.forEach((news) => {
      const names = news.categories?.length
        ? news.categories
        : ['Berita']

      names.forEach((name) => {
        counts[name] = (counts[name] || 0) + 1
      })
    })

    return [
      {
        name: 'Semua',
        count: newsItems.length,
      },
      ...Object.entries(counts).map(([name, count]) => ({
        name,
        count,
      })),
    ]
  }, [newsItems])

  const POSTS_PER_PAGE = 10

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length /
      POSTS_PER_PAGE
    )
  )

  const currentPage = Math.min(
    page,
    totalPages
  )

  const visible = filtered.slice(
    (currentPage - 1) *
      POSTS_PER_PAGE,

    currentPage *
      POSTS_PER_PAGE
  )

  useEffect(() => {
    if (page > totalPages) {
      const raf =
        requestAnimationFrame(
          () => setPage(totalPages)
        )

      return () =>
        cancelAnimationFrame(raf)
    }
  }, [
    page,
    totalPages,
  ])

  const popularNews = useMemo(() => {
    return popularItems.slice(0, 5)
  }, [popularItems])

  const go = (n) => {
    setPage(n)

    const top =
      document.getElementById(
        'daftar-berita'
      )?.offsetTop ?? 0

    window.scrollTo({
      top: Math.max(
        0,
        top - 90
      ),
      behavior: 'smooth',
    })
  }

  return (
    <div
      className="min-h-screen bg-white text-[#0c4a6e]"
      style={{
        fontFamily:
          "'Mona Sans', system-ui, sans-serif",
      }}
    >

      <div className="h-[68px]">
        <PublicNavbar
          onNavigate={onNavigate}
          activePage="berita"
        />
      </div>

      <PublicPageBanner pageKey="berita" breadcrumb="Berita" onNavigate={onNavigate} />

      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">

        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 xl:gap-10">

          <div
            id="daftar-berita"
            className="scroll-mt-24 min-w-0"
          >

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">

              <div className="relative flex-1">

                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />

                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(
                      e.target.value
                    )

                    setPage(1)
                  }}
                  placeholder="Cari judul, isi, atau kategori..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/15 transition-all"
                />

              </div>

              <div className="relative shrink-0">

                <div className="relative w-full sm:w-[190px]">
                  <button
                    type="button"
                    onClick={() => setSortOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-[#064C73] shadow-sm transition hover:border-[#008ACB] hover:shadow-md"
                  >
                    <span>
                      {sortBy === 'terbaru' && 'Terbaru'}
                      {sortBy === 'terlama' && 'Terlama'}
                      {sortBy === 'terpopuler' && 'Terpopuler'}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 ${
                        sortOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {[
                        { value: 'terbaru', label: 'Terbaru' },
                        { value: 'terlama', label: 'Terlama' },
                        { value: 'terpopuler', label: 'Terpopuler' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value)
                            setSortOpen(false)
                          }}
                          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                            sortBy === option.value
                              ? 'bg-[#008ACB] text-white'
                              : 'text-[#064C73] hover:bg-sky-50 hover:text-[#008ACB]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex flex-wrap gap-2 mb-6 md:mb-8">

              {categories.map((c) => (

                <button
                  key={c.name}
                  onClick={() => {
                    setCategory(
                      c.name
                    )

                    setPage(1)
                  }}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    category === c.name
                      ? 'bg-[#0284c7] text-white'
                      : 'bg-[#F0F4F8] text-[#0c4a6e] hover:bg-[#0284c7]/10'
                  }`}
                >

                  {c.name}

                  <span
                    className={`ml-1.5 text-[11px] ${
                      category === c.name
                        ? 'text-white/70'
                        : 'text-gray-400'
                    }`}
                  >
                    {c.count}
                  </span>

                </button>

              ))}

            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">

                {category === 'Semua'
                  ? sortBy === 'terbaru'
                    ? 'Berita Terbaru'
                    : sortBy === 'terlama'
                      ? 'Berita Terlama'
                      : 'Berita Terpopuler'
                  : category}

              </h2>

              <span className="text-[12px] text-gray-400">
                {filtered.length} news
              </span>

            </div>

            {newsLoading ? (

              <div className="px-6 py-10 text-center">

                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0284c7]" />

                <p className="text-sm text-gray-400">
                  Memuat berita...
                </p>

              </div>

            ) : newsError ? (

              <div className="px-6 py-10 text-center border border-dashed border-red-200 rounded-2xl">

                <p className="text-red-500 font-bold text-lg mb-2">
                  Gagal memuat berita
                </p>

                <p className="text-sm text-gray-400 mb-5">
                  {newsError}
                </p>

                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  className="text-[13.5px] font-bold text-[#0284c7] hover:text-[#0c4a6e]"
                >
                  Coba lagi
                </button>

              </div>

            ) : visible.length === 0 ? (

              <div className="text-center px-6 py-10 border border-dashed border-gray-200 rounded-2xl">

                <p className="text-[#0c4a6e] font-bold text-lg mb-2">
                  Nggak ada hasilnya
                </p>

                <p className="text-[14px] text-[#364e52] mb-6">
                  Coba kata kunci lain atau ganti kategorinya.
                </p>

                <button
                  onClick={() => {
                    setQuery('')
                    setCategory('Semua')
                    setSortBy('terbaru')
                    setPage(1)
                  }}
                  className="text-[13.5px] font-bold text-[#0284c7] hover:text-[#0c4a6e] transition-colors"
                >
                  Reset semua filter
                </button>

              </div>

            ) : (

              <div className={`grid gap-6 items-stretch ${visible.length > 1 ? 'sm:grid-cols-2' : ''}`}>

                {visible.map((p, i) => (

                  <Reveal
                    key={p.id}
                    delay={(i % 2) * 100}
                    className="h-full"
                  >

                    <article
                      className={`group h-full min-w-0 bg-white border border-gray-200/80 rounded-xl overflow-hidden hover:border-[#0284c7]/50 transition-colors flex flex-col cursor-pointer ${visible.length === 1 ? 'md:flex-row' : ''}`}
                      onClick={() => {
                        if (p.slug) {
                          onNavigate?.(
                            `berita/${p.slug}`
                          )
                        }
                      }}
                    >

                      <div className={`relative aspect-[16/10] overflow-hidden ${visible.length === 1 ? 'md:w-2/5 md:shrink-0 md:aspect-auto' : ''}`}>

                        {p.image ? (

                          <img
                            src={p.image}
                            alt={p.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                        ) : (

                          <div className="absolute inset-0 w-full h-full bg-[#F0F4F8] flex items-center justify-center">

                            <span className="text-sm text-gray-400">
                              Tidak ada gambar
                            </span>

                          </div>

                        )}

                          <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-1.5">
                            {p.categories.map((name) => (
                              <span
                                key={name}
                                className="bg-white/95 backdrop-blur rounded-md px-2.5 py-1 text-[11px] font-bold text-[#0284c7]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1 min-w-0">

                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-400 mb-3">

                          <span>
                            {formatDate(p.publishedAt)}
                          </span>

                          <span>•</span>

                          <div className="flex items-center gap-1.5">
                            <Clock size={13} />

                            <span>
                              {formatTime(p.publishedAt)}
                            </span>
                          </div>

                        </div>

                        <h3 className="text-[17px] font-bold leading-[1.35] mb-3 group-hover:text-[#0284c7] transition-colors line-clamp-2 min-h-[2.7em]">
                          {p.title}
                        </h3>

                        <p className="text-[13.5px] leading-relaxed text-[#364e52] mb-5 line-clamp-3">
                          {p.excerpt}
                        </p>

                        <div className="mt-auto flex justify-end">

                          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0284c7]">

                            Baca

                            <ArrowRight
                              size={13}
                              className="transition-transform duration-300 group-hover:translate-x-1"
                            />

                          </span>

                        </div>

                      </div>

                    </article>

                  </Reveal>

                ))}

              </div>

            )}

            {!newsLoading &&
              !newsError &&
              totalPages > 1 && (

                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">

                  <button
                    onClick={() =>
                      go(
                        Math.max(
                          1,
                          currentPage - 1
                        )
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#0c4a6e] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0284c7]/50 transition-colors"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, i) =>
                      i + 1
                  ).map((n) => (

                    <button
                      key={n}
                      onClick={() =>
                        go(n)
                      }
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
                    onClick={() =>
                      go(
                        Math.min(
                          totalPages,
                          currentPage + 1
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#0c4a6e] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0284c7]/50 transition-colors"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>

                </div>

              )}

          </div>

          <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">

            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">

              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">

                <TrendingUp
                  size={16}
                  className="text-sky-400"
                />

                <h3 className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  Paling Populer
                </h3>

              </div>

              <div>

                {popularNews.length === 0 ? (

                  <div className="p-5 text-sm text-gray-400">
                    Belum ada berita populer.
                  </div>

                ) : (

                  popularNews.map(
                    (news, index) => (

                      <button
                        key={news.id}
                        type="button"
                        onClick={() => {

                          if (news.slug) {
                            onNavigate?.(
                              `berita/${news.slug}`
                            )
                          }

                        }}
                        className="w-full text-left px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-[#F0F4F8] transition-colors"
                      >

                        <div className="flex gap-3 items-start">

                          <span className="text-[20px] font-extrabold text-[#0284c7]/25 leading-none pt-0.5 w-6 shrink-0">
                            {String(
                              index + 1
                            ).padStart(2, '0')}
                          </span>

                          <div className="min-w-0 flex-1">

                            <h4 className="text-[13.5px] font-bold leading-[1.4] text-[#0c4a6e] line-clamp-2">
                              {news.title}
                            </h4>

                            {news.viewCount > 0 && (

                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2">

                                <Eye
                                  size={12}
                                />

                                <span>
                                  {formatViewCount(
                                    news.viewCount
                                  )}{' '}
                                  views
                                </span>

                              </div>

                            )}

                          </div>

                        </div>

                      </button>

                    )
                  )

                )}

              </div>

            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">

              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">

                <span className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  Kategori
                </span>

              </div>

              <div className="p-5 space-y-3">

                {categories
                  .filter(
                    (c) =>
                      c.name !==
                      'Semua'
                  )
                  .map((c) => (

                    <button
                      key={c.name}
                      onClick={() => {
                        setCategory(
                          c.name
                        )

                        setPage(1)
                      }}
                      className="w-full inline-flex items-center justify-between text-[13.5px] font-semibold text-[#0c4a6e] hover:text-[#0284c7] transition-colors"
                    >

                      <span>
                        {c.name}
                      </span>

                      <span className="text-[11px] text-gray-400">
                        {c.count}
                      </span>

                    </button>

                  ))}

              </div>

            </div>

            <div className="bg-[#0284c7] text-white rounded-xl overflow-hidden relative">

              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />

              <div className="relative p-6">

                <h3 className="font-extrabold text-lg mb-2">
                  Butuh Info Lebih?
                </h3>

                <p className="text-[13px] text-white/80 leading-relaxed mb-5">
                  Tim kami bisa bantu jawab pertanyaan soal program kemitraan.
                </p>

                <button
                  onClick={() =>
                    onNavigate?.(
                      'partnership'
                    )
                  }
                  className="inline-flex items-center gap-2 bg-white text-[#0284c7] font-bold text-[13px] px-4 py-2.5 rounded-lg transition-transform hover:translate-y-[-1px]"
                >

                  Hubungi Kami

                  <ArrowRight
                    size={14}
                  />

                </button>

              </div>

            </div>

          </aside>

        </div>

      </section>

      <PublicFooter onNavigate={onNavigate} />

    </div>
  )
}
