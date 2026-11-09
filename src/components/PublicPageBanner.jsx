import { useEffect, useState } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { getPublicPageBannerApi } from '../api/pageBanners'
import { DEFAULT_PAGE_BANNERS } from '../data/pageBanners'
import { resolveImageUrl } from '../api/posts'

/**
 * Banner paling atas halaman publik. Teks bawaan halaman dipakai selama
 * konfigurasi belum ada atau endpoint publik belum tersedia, supaya halaman
 * tidak pernah kehilangan judul/breadcrumb-nya.
 * Ukuran ringkas berlaku konsisten untuk semua banner halaman publik.
 * Judul memakai skala 2xl dengan jarak label dan breadcrumb yang rapat.
 */
export default function PublicPageBanner({ pageKey, breadcrumb, onNavigate }) {
  const fallback = DEFAULT_PAGE_BANNERS[pageKey]
  const [config, setConfig] = useState(fallback)

  useEffect(() => {
    const controller = new AbortController()
    getPublicPageBannerApi(pageKey, { signal: controller.signal })
      .then((record) => {
        if (!controller.signal.aborted) setConfig(record || fallback)
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfig(fallback)
      })
    return () => controller.abort()
  }, [pageKey, fallback])

  const bgImageUrl = resolveImageUrl(config.image_url)

  return (
    <section className="mx-3 md:mx-4 mt-3 rounded-2xl bg-[#0c4a6e] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${JSON.stringify(bgImageUrl)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c4a6e]/85 via-[#0c4a6e]/55 to-[#0c4a6e]/85" />
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4 md:gap-2 lg:gap-8 lg:items-end">
          <div>
            <p className="mb-2 text-[12px] font-bold tracking-[0.2em] uppercase text-sky-400 break-words">
              {config.label}
            </p>
            <h1 className="text-2xl leading-tight mb-3 font-extrabold text-white tracking-tight break-words">
              {config.title}
            </h1>
            <div className="inline-flex items-center gap-2 text-[13px] font-medium">
              <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center">
                <Home size={14} className="text-sky-400" />
              </span>
              <button
                type="button"
                onClick={() => onNavigate?.('landing')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Beranda
              </button>
              <ChevronRight size={14} className="text-white/40" />
              <span className="text-sky-400 font-semibold">{breadcrumb}</span>
            </div>
          </div>
          <p className="text-white/70 text-[15px] leading-relaxed lg:text-right max-w-md lg:justify-self-end break-words">
            {config.description}
          </p>
        </div>
      </div>
    </section>
  )
}
