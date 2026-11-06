import { useEffect, useState } from 'react'
import { getPublicHomepageServicesApi } from '../api/homepageServices'
import { DEFAULT_HOMEPAGE_SERVICES } from '../data/homepageServices'

export default function useHomepageServices() {
  const [services, setServices] = useState(DEFAULT_HOMEPAGE_SERVICES)

  useEffect(() => {
    const controller = new AbortController()
    getPublicHomepageServicesApi({ signal: controller.signal })
      .then((record) => { if (!controller.signal.aborted) setServices(record ?? DEFAULT_HOMEPAGE_SERVICES) })
      .catch(() => { if (!controller.signal.aborted) setServices(DEFAULT_HOMEPAGE_SERVICES) })
    return () => controller.abort()
  }, [])

  return services
}
