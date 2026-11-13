import { useEffect, useState } from 'react'
import { getPublicAboutCardsApi } from '../api/aboutCards'
import { previewAboutCards } from '../data/aboutCards'
import { getAboutCardErrorMessage, sortAboutCards } from '../utils/aboutCards'
import AboutCard from './AboutCard'

export default function PublicAboutCards({ onNavigate }) {
  const [result, setResult] = useState({
    status: 'loading',
    cards: [],
    message: '',
  })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const cards = await getPublicAboutCardsApi({
          signal: controller.signal,
        })
        if (!controller.signal.aborted)
          setResult({
            status: 'ready',
            cards: sortAboutCards(cards),
            message: '',
          })
      } catch (error) {
        if (controller.signal.aborted) return
        if (error.response?.status === 404) {
          setResult({
            status: 'preview',
            cards: previewAboutCards,
            message:
              'About cards preview — /api/public/about/cards endpoint is not yet available.',
          })
        } else {
          setResult({
            status: 'error',
            cards: [],
            message: getAboutCardErrorMessage(
              error,
              'Failed to load About cards. Please try again later.',
            ),
          })
        }
      }
    }
    load()
    return () => controller.abort()
  }, [refreshKey])

  if (result.status === 'loading')
    return (
      <p role="status" className="py-12 text-center text-sm text-gray-500">
        Loading About cards...
      </p>
    )
  if (result.status === 'error')
    return (
      <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-8 text-center">
        <p role="alert" className="text-sm text-gray-600">
          {result.message}
        </p>
        <button
          type="button"
          onClick={() => {
            setResult({ status: 'loading', cards: [], message: '' })
            setRefreshKey((key) => key + 1)
          }}
          className="mt-4 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Try Again
        </button>
      </div>
    )

  return (
    <>
      {result.status === 'preview' && (
        <p
          role="status"
          className="mb-6 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-800"
        >
          {result.message}
        </p>
      )}
      {result.cards.length ? (
        <div className="grid gap-5 md:grid-cols-3">
          {result.cards.map((card) => (
            <AboutCard key={card.id} card={card} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-gray-500">
          No cards available in this section.
        </p>
      )}
    </>
  )
}
