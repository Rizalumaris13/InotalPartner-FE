import { useState, useEffect, useMemo } from 'react'
import Reveal from '../../components/Reveal'
import PublicNavbar from '../../components/PublicNavbar'
import PublicPageBanner from '../../components/PublicPageBanner'
import {
  ChevronRight, Search, ArrowRight, Clock,
  ChevronLeft, ChevronDown, Eye, TrendingUp, Tag,
} from 'lucide-react'
import { articles, articleCategories, ARTICLES_PER_PAGE } from '../../data/articles'
import PublicFooter from '../../components/PublicFooter'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ArtikelPage({ onNavigate }) {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const [sortNewest, setSortNewest] = useState(true)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = articles
    if (category !== 'Semua') list = list.filter(a => a.category === category)
    if (q) {
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return [...list].sort((a, b) => {
      const diff = new Date(b.date) - new Date(a.date)
      return sortNewest ? diff : -diff
    })
  }, [category, query, sortNewest])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTICLES_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE,
  )

  useEffect(() => {
    if (page > totalPages) {
      const raf = requestAnimationFrame(() => setPage(totalPages))
      return () => cancelAnimationFrame(raf)
    }
  }, [page, totalPages])

  const go = (n) => {
    setPage(n)
    const top = document.getElementById('daftar-artikel')?.offsetTop ?? 0
    window.scrollTo({ top: Math.max(0, top - 90), behavior: 'smooth' })
  }

  // trending: view tertinggi, dihitung ulang dari list yang difilter supaya konsisten
  const trending = useMemo(() => {
    const pool = category === 'Semua' ? articles : articles.filter(a => a.category === category)
    return [...pool].sort((a, b) => b.views - a.views).slice(0, 5)
  }, [category])

  const popularTags = useMemo(() => {
    const counts = {}
    articles.forEach(a => a.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#0c4a6e]" style={{ fontFamily: "'Mona Sans', system-ui, sans-serif" }}>

      <div className="h-[68px]">
        <PublicNavbar onNavigate={onNavigate} activePage="artikel" />
      </div>

      <PublicPageBanner pageKey="artikel" breadcrumb="Artikel" onNavigate={onNavigate} />

      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 xl:gap-10">

          <div id="daftar-artikel" className="scroll-mt-24 min-w-0">

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                  placeholder="Cari judul, isi, tag, atau penulis..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/15 transition-all"
                />
              </div>
              <button
                onClick={() => setSortNewest(v => !v)}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-[13.5px] font-semibold text-[#0c4a6e] hover:border-[#0284c7]/50 transition-colors"
              >
                {sortNewest ? 'Terbaru' : 'Terlama'}
                <ChevronDown size={15} className={sortNewest ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
              {articleCategories.map(c => (
                <button
                  key={c.name}
                  onClick={() => { setCategory(c.name); setPage(1) }}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    category === c.name
                      ? 'bg-[#0284c7] text-white'
                      : 'bg-[#F0F4F8] text-[#0c4a6e] hover:bg-[#0284c7]/10'
                  }`}
                >
                  {c.name}
                  <span className={`ml-1.5 text-[11px] ${category === c.name ? 'text-white/70' : 'text-gray-400'}`}>
                    {c.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {category === 'Semua' ? 'Artikel Terbaru' : category}
              </h2>
              <span className="text-[12px] text-gray-400">{filtered.length} tulisan</span>
            </div>

            {visible.length === 0 ? (
              <div className="text-center px-6 py-10 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-[#0c4a6e] font-bold text-lg mb-2">Nggak ada hasilnya</p>
                <p className="text-[14px] text-[#364e52] mb-6">
                  Coba kata kunci lain atau ganti kategorinya.
                </p>
                <button
                  onClick={() => { setQuery(''); setCategory('Semua'); setPage(1) }}
                  className="text-[13.5px] font-bold text-[#0284c7] hover:text-[#0c4a6e] transition-colors"
                >
                  Reset semua filter
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {visible.map((a, i) => (
                  <Reveal key={a.id} delay={(i % 2) * 80} className="h-full">
                    <article className="group h-full bg-white border border-gray-200/80 rounded-xl overflow-hidden hover:border-[#0284c7]/50 transition-colors flex flex-col md:flex-row">
                      <div className="relative aspect-[16/10] md:aspect-auto md:w-[240px] xl:w-[280px] md:shrink-0 overflow-hidden">
                        <img
                          src={a.image}
                          alt={a.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute left-3 top-3 bg-white/95 backdrop-blur rounded-md px-2.5 py-1 text-[11px] font-bold text-[#0284c7]">
                          {a.category}
                        </span>
                      </div>
                      <div className="p-5 md:p-6 flex flex-col flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400 mb-3">
                          <span>{formatDate(a.date)}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            {a.readTime} menit
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="inline-flex items-center gap-1">
                            <Eye size={12} />
                            {a.views.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <h3 className="text-[19px] md:text-[21px] font-extrabold leading-[1.3] mb-3 group-hover:text-[#0284c7] transition-colors line-clamp-2">
                          {a.title}
                        </h3>
                        <p className="text-[14px] leading-relaxed text-[#364e52] mb-4 line-clamp-2">{a.excerpt}</p>
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {a.tags.map(t => (
                            <span key={t} className="inline-flex items-center gap-1 bg-[#F0F4F8] text-[11px] font-semibold text-[#0c4a6e] px-2.5 py-1 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[12.5px] font-semibold text-gray-400">{a.author}</span>
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#0284c7]">
                            Baca
                            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => go(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#0c4a6e] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0284c7]/50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => go(n)}
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
                  onClick={() => go(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#0c4a6e] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0284c7]/50 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">

            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">
                <TrendingUp size={16} className="text-sky-400" />
                <h3 className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  TrENDING
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {trending.map((a, i) => (
                  <div key={a.id} className="px-5 py-4 flex gap-3 items-start">
                    <span className="text-[20px] font-extrabold text-[#0284c7]/25 leading-none pt-0.5 w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-[13.5px] font-bold leading-[1.4] text-[#0c4a6e] line-clamp-2">
                        {a.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1.5">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={11} />
                          {a.views.toLocaleString('id-ID')}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{a.readTime} mnt</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">
                <span className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  Kategori
                </span>
              </div>
              <div className="p-5 space-y-3">
                {articleCategories.filter(c => c.name !== 'Semua').map(c => (
                  <button
                    key={c.name}
                    onClick={() => { setCategory(c.name); setPage(1) }}
                    className="w-full inline-flex items-center justify-between text-[13.5px] font-semibold text-[#0c4a6e] hover:text-[#0284c7] transition-colors"
                  >
                    <span>{c.name}</span>
                    <span className="text-[11px] text-gray-400">{c.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
              <div className="bg-[#0c4a6e] px-5 py-3.5 flex items-center gap-2">
                <Tag size={16} className="text-sky-400" />
                <h3 className="text-white font-extrabold text-[13px] tracking-[0.12em] uppercase">
                  Tag Populer
                </h3>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {popularTags.map(([t, n]) => (
                  <button
                    key={t}
                    onClick={() => setQuery(t)}
                    className="inline-flex items-center gap-1.5 bg-[#F0F4F8] hover:bg-[#0284c7]/10 text-[12px] font-semibold text-[#0c4a6e] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {t}
                    <span className="text-[10px] text-gray-400">{n}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0284c7] text-white rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              <div className="relative p-6">
                <h3 className="font-extrabold text-lg mb-2">Mau Diskusi Bersama Kami?</h3>
                <p className="text-[13px] text-white/80 leading-relaxed mb-5">
                  Punya topik yang menarik untuk dibahas? Kirim ide lo ke tim kami.
                </p>
                <button
                  onClick={() => onNavigate?.('partnership')}
                  className="inline-flex items-center gap-2 bg-white text-[#0284c7] font-bold text-[13px] px-4 py-2.5 rounded-lg transition-transform hover:translateY(-1px)"
                >
                  Kirim Usulan
                  <ArrowRight size={14} />
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
