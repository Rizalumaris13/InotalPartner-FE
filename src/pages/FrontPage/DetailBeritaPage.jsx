import { useEffect, useMemo, useState } from 'react'

import PublicNavbar from '../../components/PublicNavbar'

import {
  getPublicNewsApi,
  getPublicNewsBySlugApi,
  resolveImageUrl,
} from '../../api/posts'

import {
  ArrowLeft,
  Clock,
  Eye,
} from 'lucide-react'
import PublicFooter from '../../components/PublicFooter'


function formatDate(iso) {
  if (!iso) return '-'

  try {
    return new Date(iso).toLocaleDateString(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }
    )
  } catch {
    return '-'
  }
}


function formatTime(iso) {
  if (!iso) return '--:--'

  try {
    return new Date(iso).toLocaleTimeString(
      'id-ID',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      }
    )
  } catch {
    return '--:--'
  }
}


function formatViewCount(value) {
  return Number(value || 0).toLocaleString('id-ID')
}


export default function DetailBeritaPage({
  onNavigate,
  slug,
}) {
  const [news, setNews] = useState(null)
  const [allNews, setAllNews] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [scrolled, setScrolled] = useState(false)


  /* =========================
     NAVBAR SCROLL
  ========================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24)
    }

    handleScroll()

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])


  /* =========================
     FETCH BERITA
  ========================= */

  useEffect(() => {
    let mounted = true

    const fetchNews = async () => {
      try {
        setLoading(true)
        setError('')

        if (!slug) {
          setNews(null)
          setError('Slug berita tidak valid.')
          return
        }

        // Detail diambil langsung berdasarkan slug. Backend menambah
        // view_count pada endpoint ini setiap kali detail dibuka.
        const [detailResult, listResult] = await Promise.allSettled([
          getPublicNewsBySlugApi(slug),
          getPublicNewsApi(1, 100),
        ])

        if (!mounted) return

        if (detailResult.status !== 'fulfilled') {
          const detailError = detailResult.reason
          setNews(null)
          setError(
            detailError?.response?.status === 404
              ? 'Berita yang Anda cari tidak ditemukan.'
              : detailError?.response?.data?.message ||
                detailError?.message ||
                'Gagal mengambil berita.'
          )
          setAllNews([])
          return
        }

        const detailPayload = detailResult.value
        const found = detailPayload?.data?.data ?? detailPayload?.data ?? null

        if (!found || typeof found !== 'object' || Array.isArray(found)) {
          setNews(null)
          setError('Format data detail berita tidak sesuai.')
          setAllNews([])
          return
        }

        setNews(found)

        if (listResult.status === 'fulfilled') {
          const listPayload = listResult.value
          const listData = listPayload?.data?.data ?? listPayload?.data ?? []
          const newsData = Array.isArray(listData)
            ? listData
            : Array.isArray(listData?.data)
              ? listData.data
              : []
          setAllNews(newsData)
        } else {
          // Detail tetap ditampilkan walau daftar berita terkait gagal dimuat.
          console.warn('Gagal mengambil daftar berita terkait:', listResult.reason)
          setAllNews([])
        }

      } catch (err) {
        console.error(
          'Gagal mengambil detail berita:',
          err
        )

        if (mounted) {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            'Gagal mengambil berita.'
          )
        }

      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchNews()

    return () => {
      mounted = false
    }
  }, [slug])


  /* =========================
     RELATED POSTS
  ========================= */

  const relatedPosts = useMemo(() => {
    if (!news) return []

    const currentCategoryId =
      news.category_id ||
      news.category?.id

    const currentCategoryName =
      news.category?.name ||
      news.categories?.[0]?.name ||
      ''

    const currentTags =
      news.tags || []

    /*
     * Ambil slug/tag dari berita sekarang.
     *
     * API bisa mengirim:
     *
     * tags: [
     *   {
     *     id: 1,
     *     name: "AI",
     *     slug: "ai"
     *   }
     * ]
     */

    const currentTagIds =
      currentTags
        .map((tag) => tag?.id)
        .filter(Boolean)

    const currentTagNames =
      currentTags
        .map((tag) =>
          String(
            tag?.name ||
            tag?.slug ||
            ''
          ).toLowerCase()
        )
        .filter(Boolean)


    /*
     * Jangan masukkan berita
     * yang sedang dibuka.
     */

    const candidates =
      allNews.filter(
        (item) =>
          item.id !== news.id
      )


    /*
     * PRIORITAS RELATED POST:
     *
     * 1. Kategori sama
     * 2. Punya tag yang sama
     * 3. Popularitas berdasarkan view_count
     */

    const scored =
      candidates.map((item) => {
        const itemCategoryId =
          item.category_id ||
          item.category?.id

        const itemCategoryName =
          item.category?.name ||
          item.categories?.[0]?.name ||
          ''

        const itemTags =
          item.tags || []

        const itemTagIds =
          itemTags
            .map((tag) => tag?.id)
            .filter(Boolean)

        const itemTagNames =
          itemTags
            .map((tag) =>
              String(
                tag?.name ||
                tag?.slug ||
                ''
              ).toLowerCase()
            )
            .filter(Boolean)


        const sameCategory =
          currentCategoryId &&
          itemCategoryId
            ? currentCategoryId ===
              itemCategoryId
            : currentCategoryName &&
              itemCategoryName ===
                currentCategoryName


        const sharedTags =
          itemTagIds.some((id) =>
            currentTagIds.includes(id)
          ) ||
          itemTagNames.some((name) =>
            currentTagNames.includes(name)
          )


        let score = 0

        /*
         * Kategori sama = prioritas utama
         */
        if (sameCategory) {
          score += 100
        }

        /*
         * Tag sama = tambahan prioritas
         */
        if (sharedTags) {
          score += 50
        }

        /*
         * View count sebagai penentu
         * popularitas.
         */
        score += Number(
          item.view_count || 0
        ) / 1000


        return {
          ...item,
          _score: score,
          _sameCategory: sameCategory,
          _sharedTags: sharedTags,
        }
      })


    /*
     * Hanya ambil yang kategorinya sama.
     *
     * Jadi contoh:
     *
     * Artikel sekarang:
     * kategori = Teknologi
     * tags = AI, Coding
     *
     * Related:
     * - Teknologi + Coding
     * - Teknologi + AI
     * - Teknologi + Pemula
     *
     * Semuanya masih boleh.
     *
     * Artikel dari kategori lain
     * tidak akan muncul.
     */

    const sameCategoryPosts =
      scored.filter(
        (item) =>
          item._sameCategory
      )


    /*
     * Jika ada artikel kategori sama,
     * urutkan berdasarkan score.
     */

    if (sameCategoryPosts.length > 0) {
      return sameCategoryPosts
        .sort(
          (a, b) =>
            b._score -
            a._score
        )
        .slice(0, 3)
    }


    /*
     * Fallback:
     *
     * Jika tidak ada artikel kategori sama,
     * ambil artikel paling populer
     * dari semua berita.
     */

    return scored
      .sort(
        (a, b) =>
          Number(b.view_count || 0) -
          Number(a.view_count || 0)
      )
      .slice(0, 3)

  }, [news, allNews])


  /* =========================
     LOADING
  ========================= */

  if (loading) {
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
            scrolled={scrolled}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0284c7]" />

          <p className="text-sm text-gray-400">
            Memuat berita...
          </p>
        </div>
      </div>
    )
  }


  /* =========================
     ERROR
  ========================= */

  if (error || !news) {
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
            scrolled={scrolled}
          />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center">
          <h1 className="text-3xl font-extrabold mb-4">
            Berita Tidak Ditemukan
          </h1>

          <p className="text-gray-500 mb-8">
            {error}
          </p>

          <button
            onClick={() =>
              onNavigate?.('berita')
            }
            className="inline-flex items-center gap-2 bg-[#0284c7] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#0369a1] transition"
          >
            <ArrowLeft size={16} />

            Kembali ke Berita
          </button>
        </div>
      </div>
    )
  }


  /* =========================
     DATA BERITA
  ========================= */

  const categories =
    Array.isArray(news.categories) && news.categories.length > 0
        ? news.categories
        : news.category
        ? [news.category]
        : []

  const image =
    news.thumbnail_url
      ? resolveImageUrl(
          news.thumbnail_url
        )
      : ''


  return (
    <div
      className="min-h-screen bg-white text-[#0c4a6e]"
      style={{
        fontFamily:
          "'Mona Sans', system-ui, sans-serif",
      }}
    >

      {/* NAVBAR */}

      <div className="h-[68px]">
        <PublicNavbar
          onNavigate={onNavigate}
          activePage="berita"
          scrolled={scrolled}
        />
      </div>


      {/* HERO / ARTICLE HEADER */}




      {/* NEWS */}

      
        {/* ARTICLE */}

        <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 xl:gap-10">

            {/* CONTENT */}
            <article className="min-w-0 w-full max-w-3xl mx-auto xl:max-w-none">

            {/* BACK BUTTON */}
            <button
                onClick={() => onNavigate?.('berita')}
                className="inline-flex items-center gap-2 text-[#0c4a6e]/70 hover:text-[#0284c7] text-sm font-semibold mb-6 transition"
            >
                <ArrowLeft size={16} />
                Kembali ke Berita
            </button>

           
            {/* CATEGORY + DATE/TIME */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

                {/* CATEGORY - LEFT */}
                    <div className="flex flex-wrap items-center gap-2">
                        {categories.map((item, index) => {
                            const name =
                            typeof item === 'string'
                                ? item
                                : item?.name

                            if (!name) return null

                            return (
                            <span
                                key={item?.id ?? `${name}-${index}`}
                                className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0284c7]"
                            >
                                {name}
                            </span>
                            )
                        })}
                    </div>

                {/* DATE/TIME - RIGHT */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <Clock size={15} />

                        <span>
                        {formatDate(news.published_at || news.created_at)}
                        </span>

                        <span>•</span>

                        <span>
                        {formatTime(news.published_at || news.created_at)}
                        </span>

                        {Number(news.view_count || 0) > 0 && (
                        <>
                            <span className="mx-1">•</span>
                            <Eye size={15} />
                            <span>{formatViewCount(news.view_count)} views</span>
                        </>
                        )}
                </div>

            </div>

            {/* IMAGE */}
            {image && (
                <div className="overflow-hidden rounded-2xl mb-8 bg-[#F0F4F8]">
                <img
                    src={image}
                    alt={news.title}
                    className="w-full h-auto max-h-[650px] object-cover"
                />
                </div>
            )}

            {/* TITLE: BELOW IMAGE */}
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-[#0b8bd5] mb-6">
                {news.title}
            </h1>

            {/* NEWS CONTENT */}
            <div
                className="
                text-[#172f3d]
                text-[16px]
                md:text-[17px]
                leading-[1.9]
                [&_p]:mb-6
                [&_p:last-child]:mb-0
                [&_h2]:text-2xl
                [&_h2]:md:text-3xl
                [&_h2]:font-extrabold
                [&_h2]:text-[#0c4a6e]
                [&_h2]:mt-10
                [&_h2]:mb-5
                [&_h3]:text-xl
                [&_h3]:font-bold
                [&_h3]:text-[#0c4a6e]
                [&_h3]:mt-8
                [&_h3]:mb-4
                [&_strong]:font-bold
                [&_strong]:text-[#0c4a6e]
                [&_a]:text-[#0284c7]
                [&_a]:font-semibold
                [&_a:hover]:underline
                [&_ul]:list-disc
                [&_ul]:pl-6
                [&_ul]:mb-6
                [&_ol]:list-decimal
                [&_ol]:pl-6
                [&_ol]:mb-6
                [&_li]:mb-2
                [&_img]:rounded-xl
                [&_img]:my-8
                [&_img]:max-w-full
                "
                dangerouslySetInnerHTML={{
                __html: news.content || '',
                }}
            />

            {/* TAGS: BELOW NEWS CONTENT */}
            {Array.isArray(news.tags) && news.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-200">
                <h2 className="text-sm font-bold text-[#0c4a6e] mb-3">
                    Tags
                </h2>

                <div className="flex flex-wrap gap-2">
                    {news.tags.map((tag, index) => {
                    const tagName =
                        typeof tag === 'string'
                        ? tag
                        : tag?.name || tag?.slug || '';

                    if (!tagName) return null;

                    return (
                        <span
                        key={tag.id ?? `${tagName}-${index}`}
                        className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-3 py-1.5 text-sm font-medium text-[#0284c7]"
                        >
                        #{tagName.replace(/^#/, '')}
                        </span>
                    );
                    })}
                </div>
                </div>
            )}

            </article>

            {/* SIDEBAR */}
            <aside className="min-w-0 w-full max-w-3xl mx-auto xl:max-w-none xl:sticky xl:top-24 xl:self-start">
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">

                <div className="bg-[#0c4a6e] px-5 py-4">
                <h2 className="text-white font-extrabold text-sm">
                    Related Posts
                </h2>
                <p className="text-white/60 text-xs mt-1">
                    Artikel lain yang mungkin menarik
                </p>
                </div>

                <div>
                {relatedPosts.length === 0 ? (
                    <div className="p-5 text-sm text-gray-400">
                    Belum ada artikel terkait.
                    </div>
                ) : (
                    relatedPosts.map((post) => {
                    const postImage = post.thumbnail_url
                        ? resolveImageUrl(post.thumbnail_url)
                        : '';

                    return (
                        <button
                        key={post.id}
                        type="button"
                        onClick={() => {
                            if (post.slug) {
                            onNavigate?.(`berita/${post.slug}`);
                            }
                        }}
                        className="w-full text-left border-b border-gray-100 last:border-b-0 p-4 hover:bg-sky-50 transition"
                        >
                        <div className="flex gap-3">
                            {postImage ? (
                            <img
                                src={postImage}
                                alt={post.title}
                                className="w-24 h-20 shrink-0 object-cover rounded-lg"
                            />
                            ) : (
                            <div className="w-24 h-20 shrink-0 rounded-lg bg-[#F0F4F8]" />
                            )}

                            <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
                                {post.category?.name ||
                                post.categories?.[0]?.name ||
                                'Berita'}
                            </span>

                            <h3 className="mt-1 text-[13px] font-bold leading-[1.4] text-[#0c4a6e] line-clamp-3">
                                {post.title}
                            </h3>

                            {Number(post.view_count || 0) > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                                <Eye size={11} />
                                <span>
                                    {formatViewCount(post.view_count)} views
                                </span>
                                </div>
                            )}
                            </div>
                        </div>
                        </button>
                    );
                    })
                )}
                </div>
            </div>
            </aside>

        </div>
        </main>



      {/* FOOTER */}

      <PublicFooter onNavigate={onNavigate} />

    </div>
  )
}