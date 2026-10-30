import api from './axios'
import {
  isAboutCard,
  isAboutCardList,
  isAboutCardPayload,
  sameAboutCardPayload,
} from '../utils/aboutCards'

// Kontrak utama: src/contracts/aboutCard.schema.json; semantik: docs/api-kartu-tentang.md.
const PATH = '/about/cards'

const assertSuccess = (response) => {
  if (response.data?.success !== true) {
    const message = response.data?.message
    throw new Error(
      typeof message === 'string' && message.trim()
        ? message
        : 'Backend tidak mengonfirmasi perubahan kartu Tentang.',
    )
  }
}
const readList = (response) => {
  assertSuccess(response)
  if (!isAboutCardList(response.data.data))
    throw new Error(
      'Format atau posisi kartu Tentang dari backend tidak sesuai kontrak.',
    )
  return response.data.data
}
const assertId = (id) => {
  if (!Number.isSafeInteger(id) || id < 1)
    throw new Error('ID kartu Tentang tidak valid.')
}
const assertPayload = (payload) => {
  if (!isAboutCardPayload(payload))
    throw new Error('Data kartu Tentang tidak valid.')
}
const readSaved = (response, payload, expectedId) => {
  assertSuccess(response)
  const card = response.data.data
  if (!isAboutCard(card))
    throw new Error('Respons penyimpanan kartu Tentang tidak sesuai kontrak.')
  if (expectedId !== undefined && card.id !== expectedId)
    throw new Error('ID kartu pada respons backend tidak sesuai.')
  if (!sameAboutCardPayload(card, payload))
    throw new Error('Respons backend belum mencerminkan perubahan kartu.')
  return card
}

export const getPublicAboutCardsApi = ({ signal } = {}) =>
  api.get(`/public${PATH}`, { signal }).then(readList)
export const listAboutCardsApi = ({ signal } = {}) =>
  api.get(PATH, { signal }).then(readList)
export const createAboutCardApi = (payload) => {
  assertPayload(payload)
  return api
    .post(PATH, payload)
    .then((response) => readSaved(response, payload))
}
export const updateAboutCardApi = (id, payload) => {
  assertId(id)
  assertPayload(payload)
  return api
    .put(`${PATH}/${encodeURIComponent(id)}`, payload)
    .then((response) => readSaved(response, payload, id))
}
export const deleteAboutCardApi = (id) => {
  assertId(id)
  return api.delete(`${PATH}/${encodeURIComponent(id)}`).then((response) => {
    if (response.status !== 204) {
      assertSuccess(response)
      if (response.data.data !== null)
        throw new Error('Respons penghapusan kartu tidak sesuai kontrak.')
    }
  })
}
