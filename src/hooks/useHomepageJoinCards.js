import { getPublicJoinCardsApi } from '../api/homepageJoinCards'
import { DEFAULT_JOIN_CARDS } from '../data/homepageJoinCards'
import usePublicContent from './usePublicContent'

export default function useHomepageJoinCards() {
  return usePublicContent(getPublicJoinCardsApi, DEFAULT_JOIN_CARDS)
}
