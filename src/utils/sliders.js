import { resolveBannerImageUrl } from '../api/homepageBanners'

export function createSliderDraft(banner) {
  const buttons = Array.isArray(banner?.buttons) ? banner.buttons : []
  return {
    title: banner?.title || '',
    buttons: Array.from({ length: 3 }, (_, index) => ({
      label: buttons[index]?.label || '',
      url: buttons[index]?.url || '',
    })),
    imageUrl: banner?.background_image || '',
    imageFile: null,
    imagePreview: banner?.background_image ? resolveBannerImageUrl(banner.background_image) : '',
    order: Number(banner?.order) || 1,
  }
}

export function unwrapBannerList(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.banners)) return response.banners
  return []
}

export function toBannerStatusPayload(banner, isActive) {
  return {
    title: banner.title || '',
    background_image: banner.background_image || '',
    order: Number(banner.order) || 1,
    is_active: isActive,
    buttons: Array.isArray(banner.buttons) ? banner.buttons : [],
  }
}
