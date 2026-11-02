import { useEffect, useState } from 'react'
import { getPublicPartnersApi } from '../api/partners'
import { legacyPartners } from '../data/partners'
import { isHttpUrl, sortPartners } from '../utils/partners'
import PartnerLogo from './PartnerLogo'

export default function PublicPartnerSection() {
  const [state, setState] = useState({ status: 'loading', partners: [] })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const data = await getPublicPartnersApi({ signal: controller.signal })
        if (!controller.signal.aborted) {
          setState({
            status: 'ready',
            partners: sortPartners(
              data.filter((partner) => partner.is_active === true),
            ),
          })
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // Jangan jadikan hasil kosong/500 sebagai alasan menampilkan contoh lama.
          setState(
            err.response?.status === 404
              ? { status: 'legacy', partners: legacyPartners }
              : { status: 'error', partners: [] },
          )
        }
      }
    }
    load()
    return () => controller.abort()
  }, [refreshKey])

  const reload = () => {
    setState({ status: 'loading', partners: [] })
    setRefreshKey((key) => key + 1)
  }

  const cardClass =
    'flex w-full aspect-square items-center justify-center rounded-2xl border border-sky-100 bg-white p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'

  return (
    <section
      aria-labelledby="homepage-partners-title"
      className="py-24 bg-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 mb-14 text-center">
        <h2
          id="homepage-partners-title"
          className="text-3xl md:text-5xl font-bold text-[#1a202c]"
        >
          Bergabunglah dengan Ekosistem Kami, Akselerasi Kemitraan Anda!
        </h2>
      </div>
      <div className="max-w-5xl mx-auto px-4">
        {state.status === 'loading' ? (
          <p role="status" className="py-10 text-center text-sm text-gray-500">
            Memuat daftar mitra...
          </p>
        ) : state.status === 'error' ? (
          <div
            role="status"
            className="py-10 text-center text-sm text-gray-500"
          >
            <p>Daftar mitra belum dapat dimuat.</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 rounded-xl bg-sky-50 px-4 py-2 font-semibold text-sky-700 hover:bg-sky-100"
            >
              Coba Lagi
            </button>
          </div>
        ) : state.partners.length === 0 ? (
          <p role="status" className="py-10 text-center text-sm text-gray-500">
            Belum ada mitra yang ditampilkan.
          </p>
        ) : (
          <>
            {state.status === 'legacy' && (
              <p
                role="status"
                className="mb-5 text-center text-xs text-gray-500"
              >
                Pratinjau mitra contoh. Data resmi akan tampil setelah API
                kemitraan tersedia.
              </p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-5">
              {state.partners.map((partner) =>
                isHttpUrl(partner.website_url) ? (
                  <a
                    key={partner.id}
                    href={partner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={partner.name}
                    title={partner.name}
                    className={`${cardClass} transition hover:border-sky-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-sky-500`}
                  >
                    <PartnerLogo name={partner.name} url={partner.logo_url} />
                  </a>
                ) : (
                  <div
                    key={partner.id}
                    title={partner.name}
                    className={cardClass}
                  >
                    <PartnerLogo name={partner.name} url={partner.logo_url} />
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
