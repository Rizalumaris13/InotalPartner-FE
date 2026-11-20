import { getPublicHomepageServicesApi } from '../api/homepageServices'
import { DEFAULT_HOMEPAGE_SERVICES } from '../data/homepageServices'
import usePublicContent from './usePublicContent'

export default function useHomepageServices() {
  return usePublicContent(getPublicHomepageServicesApi, DEFAULT_HOMEPAGE_SERVICES)
}
