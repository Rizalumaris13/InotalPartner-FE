import { JOIN_CARD_COUNT, JOIN_CARD_FIELDS } from '../data/homepageJoinCards'

const isText = (value, limit) =>
  typeof value === 'string' && Boolean(value.trim()) && value.length <= limit

export const isJoinCardsRecord = (cards) => Array.isArray(cards) &&
  cards.length === JOIN_CARD_COUNT &&
  new Set(cards.map((card) => card?.position)).size === JOIN_CARD_COUNT &&
  cards.every((card) => Number.isInteger(card?.position) &&
    card.position >= 1 && card.position <= JOIN_CARD_COUNT &&
    JOIN_CARD_FIELDS.every((field) => isText(card[field.key], field.maxLength)))

export const toJoinCardsPayload = (cards) => ({
  cards: (Array.isArray(cards) ? cards : []).map((card) => ({
    position: card?.position,
    title: typeof card?.title === 'string' ? card.title.trim() : '',
    description: typeof card?.description === 'string' ? card.description.trim() : '',
  })).sort((a, b) => a.position - b.position),
})

export const validateJoinCards = (cards) => {
  const errors = {}
  for (const card of cards) {
    const number = String(card.position).padStart(2, '0')
    for (const field of JOIN_CARD_FIELDS) {
      const value = card[field.key]
      const key = `${card.position}-${field.key}`
      if (typeof value !== 'string' || !value.trim()) errors[key] = `${field.label} kartu ${number} wajib diisi.`
      else if (value.length > field.maxLength) errors[key] = `${field.label} kartu ${number} maksimal ${field.maxLength} karakter.`
    }
  }
  return errors
}

export { getApiErrorMessage as getJoinCardsErrorMessage } from './apiErrors'
