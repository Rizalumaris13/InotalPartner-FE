import { JOIN_IMAGE_SLOTS } from '../data/homepageJoinImages'
import { isSafeImageUrl as isJoinImageUrl, normalizeImageUrl as normalizeJoinImageUrl } from './imageUrl'

export { isJoinImageUrl, normalizeJoinImageUrl }
export {
  MAX_IMAGE_URL_LENGTH as MAX_JOIN_IMAGE_URL_LENGTH,
  IMAGE_MIME_TYPES as JOIN_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES as MAX_JOIN_IMAGE_BYTES,
  validateImageFile as validateJoinImageFile,
} from './imageUrl'

export const isJoinImagesRecord = (record) =>
  Boolean(record && typeof record === 'object' && !Array.isArray(record)) &&
  JOIN_IMAGE_SLOTS.every(({ key }) => isJoinImageUrl(record[key]))

export const toJoinImagesPayload = (form) => Object.fromEntries(
  JOIN_IMAGE_SLOTS.map(({ key }) => [key, normalizeJoinImageUrl(form?.[key])]),
)

export { getApiErrorMessage as getJoinImagesErrorMessage } from './apiErrors'
