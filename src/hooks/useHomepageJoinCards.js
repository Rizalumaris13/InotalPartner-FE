import { useEffect, useState } from 'react'
import { getPublicJoinCardsApi } from '../api/homepageJoinCards'
import { DEFAULT_JOIN_CARDS } from '../data/homepageJoinCards'

export default function useHomepageJoinCards() {
  const [cards, setCards] = useState(DEFAULT_JOIN_CARDS)

  useEffect(() => {
    const controller = new AbortController()
    getPublicJoinCardsApi({ signal: controller.signal })
      .then((record) => { if (!controller.signal.aborted) setCards(record ?? DEFAULT_JOIN_CARDS) })
      .catch(() => { if (!controller.signal.aborted) setCards(DEFAULT_JOIN_CARDS) })
    return () => controller.abort()
  }, [])

  return cards
}
