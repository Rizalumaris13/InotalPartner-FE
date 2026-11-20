import { useEffect, useState } from 'react'

export default function usePublicContent(load, fallback) {
  const [content, setContent] = useState(fallback)

  useEffect(() => {
    const controller = new AbortController()
    load({ signal: controller.signal })
      .then((record) => { if (!controller.signal.aborted) setContent(record ?? fallback) })
      .catch(() => { if (!controller.signal.aborted) setContent(fallback) })
    return () => controller.abort()
  }, [load, fallback])

  return content
}
