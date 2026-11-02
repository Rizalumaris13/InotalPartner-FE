import api from './axios'
import {
  isPageBannerPage,
  isPageBannerRecord,
  toPageBannerPayload,
} from '../utils/pageBanners'

const pagePath = (page, isPublic = false) => {
  if (!isPageBannerPage(page)) throw new Error('Key halaman banner tidak dikenal.')
  return `${isPublic ? '/public' : ''}/page-banners/${page}`
}

const readResponse = (response, page, expected) => {
  const body = response.data
  if (body?.success === false && typeof body.message === 'string' && body.message.trim())
    throw new Error(body.message)
  if (body?.success !== true || (body.data !== null && !isPageBannerRecord(body.data, page)))
    throw new Error('Respons banner tidak sesuai kontrak halaman.')
  if (expected && body.data) {
    const saved = toPageBannerPayload(body.data)
    if (Object.keys(expected).some((key) => saved[key] !== expected[key]))
      throw new Error('Respons simpan banner belum mencerminkan data yang dikirim.')
  }
  return body.data
}

export const getPageBannerApi = (page, options = {}) =>
  api.get(pagePath(page), options).then((response) => readResponse(response, page))

export const getPublicPageBannerApi = (page, options = {}) =>
  api.get(pagePath(page, true), options).then((response) => readResponse(response, page))

const assertPayload = (page, payload) => {
  if (!isPageBannerRecord({ page, ...payload }, page))
    throw new Error('Data banner tidak valid untuk halaman ini.')
}

export const createPageBannerApi = (page, payload) => {
  const expected = toPageBannerPayload(payload)
  assertPayload(page, expected)
  return api
    .post(pagePath(page), expected)
    .then((response) => readResponse(response, page, expected))
}

export const updatePageBannerApi = (page, payload) => {
  const expected = toPageBannerPayload(payload)
  assertPayload(page, expected)
  return api
    .put(pagePath(page), expected)
    .then((response) => readResponse(response, page, expected))
}

export const deletePageBannerApi = (page) =>
  api.delete(pagePath(page)).then((response) => {
    const body = response.data
    if (body && body.success !== true)
      throw new Error('Backend tidak mengonfirmasi penghapusan banner.')
    return null
  })
