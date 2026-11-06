import { useEffect, useState } from 'react'
import { getPublicAboutIntroApi } from '../api/aboutIntro'
import { DEFAULT_ABOUT_INTRO } from '../data/aboutIntro'

export default function useAboutIntro() {
  const [intro, setIntro] = useState(DEFAULT_ABOUT_INTRO)

  useEffect(() => {
    const controller = new AbortController()
    getPublicAboutIntroApi({ signal: controller.signal })
      .then((record) => { if (!controller.signal.aborted) setIntro(record ?? DEFAULT_ABOUT_INTRO) })
      .catch(() => { if (!controller.signal.aborted) setIntro(DEFAULT_ABOUT_INTRO) })
    return () => controller.abort()
  }, [])

  return intro
}
